import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { BackupRecord, BackupStatus, BackupType } from './backup.entity';
import {
  TriggerBackupDto,
  BackupQueryDto,
  BackupSettingsDto,
  BackupStatisticsDto,
} from './backup.dto';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private backupSettings: BackupSettingsDto;

  constructor(
    @InjectRepository(BackupRecord)
    private backupRepository: Repository<BackupRecord>,
    private configService: ConfigService,
  ) {
    // 初始化默认设置
    this.backupSettings = {
      retentionDays: 30,
      scheduleTime: '02:00',
      notificationEmail: this.configService.get('BACKUP_NOTIFICATION_EMAIL'),
      notificationWebhook: this.configService.get(
        'BACKUP_NOTIFICATION_WEBHOOK',
      ),
    };
  }

  /**
   * 生成备份编号
   */
  private generateBackupNo(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${date}-${random}`;
  }

  /**
   * 执行数据库备份
   */
  async performBackup(
    type: BackupType,
    triggeredBy?: string,
  ): Promise<BackupRecord> {
    // 创建备份记录
    const record = this.backupRepository.create({
      backupNo: this.generateBackupNo(),
      type,
      status: BackupStatus.PENDING,
      databaseName: this.configService.get('DB_NAME', 'school_admin'),
      databaseHost: this.configService.get('DB_HOST', 'localhost'),
      triggeredBy,
      startedAt: new Date(),
    });

    await this.backupRepository.save(record);

    try {
      // 更新状态为运行中
      record.status = BackupStatus.RUNNING;
      await this.backupRepository.save(record);

      // 执行备份脚本
      const backupDir = this.configService.get(
        'BACKUP_DIR',
        '/var/backups/school_admin',
      );
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, '')
        .slice(0, 15);
      const fileName = `backup_${timestamp}.sql.gz`;
      const filePath = path.join(backupDir, fileName);

      // 确保备份目录存在
      await fs.mkdir(backupDir, { recursive: true });

      // 构建备份命令
      const dbHost = this.configService.get('DB_HOST', 'localhost');
      const dbPort = this.configService.get('DB_PORT', '5432');
      const dbUser = this.configService.get('DB_USER', 'school_admin');
      const dbPassword = this.configService.get('DB_PASSWORD', '');
      const dbName = this.configService.get('DB_NAME', 'school_admin');

      const pgDumpCmd = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-acl -F p | gzip > "${filePath}"`;

      this.logger.log(`开始执行备份: ${record.backupNo}`);

      // 执行备份命令
      await execAsync(pgDumpCmd, {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      });

      // 检查文件是否存在
      const stats = await fs.stat(filePath);

      // 计算文件大小
      const fileSizeBytes = stats.size;
      const fileSize = this.formatFileSize(fileSizeBytes);

      // 计算校验和
      const checksum = await this.calculateChecksum(filePath);

      // 更新记录
      record.filePath = filePath;
      record.fileSize = fileSize;
      record.fileSizeBytes = fileSizeBytes;
      record.checksum = checksum;
      record.status = BackupStatus.SUCCESS;
      record.completedAt = new Date();
      record.durationSeconds = Math.round(
        (record.completedAt.getTime() - record.startedAt.getTime()) / 1000,
      );

      await this.backupRepository.save(record);

      this.logger.log(
        `备份成功: ${record.backupNo}, 文件大小: ${fileSize}, 耗时: ${record.durationSeconds}秒`,
      );

      // 发送成功通知
      await this.sendNotification(
        'success',
        `数据库备份成功\n备份编号: ${record.backupNo}\n文件大小: ${fileSize}\n耗时: ${record.durationSeconds}秒`,
      );

      // 清理旧备份
      await this.cleanupOldBackups();

      return record;
    } catch (error) {
      this.logger.error(`备份失败: ${record.backupNo}`, error.stack);

      // 更新失败状态
      record.status = BackupStatus.FAILED;
      record.errorMessage = error.message;
      record.completedAt = new Date();
      record.durationSeconds = Math.round(
        (record.completedAt.getTime() - record.startedAt.getTime()) / 1000,
      );

      await this.backupRepository.save(record);

      // 发送失败通知
      await this.sendNotification(
        'failure',
        `数据库备份失败\n备份编号: ${record.backupNo}\n错误: ${error.message}`,
      );

      throw new InternalServerErrorException(`备份失败: ${error.message}`);
    }
  }

  /**
   * 手动触发备份
   */
  async triggerManualBackup(
    dto: TriggerBackupDto,
    userId: string,
  ): Promise<BackupRecord> {
    this.logger.log(`用户 ${userId} 手动触发备份`);
    return this.performBackup(BackupType.MANUAL, userId);
  }

  /**
   * 定时任务触发备份
   */
  async triggerScheduledBackup(): Promise<BackupRecord> {
    this.logger.log('定时任务触发备份');
    return this.performBackup(BackupType.SCHEDULED);
  }

  /**
   * 清理旧备份文件
   */
  async cleanupOldBackups(): Promise<number> {
    const retentionDays = this.backupSettings.retentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.log(`开始清理 ${retentionDays} 天前的备份记录和文件`);

    // 查找需要删除的记录
    const oldRecords = await this.backupRepository.find({
      where: {
        createdAt: LessThanOrEqual(cutoffDate),
        status: BackupStatus.SUCCESS,
      },
    });

    let deletedCount = 0;

    for (const record of oldRecords) {
      try {
        // 删除文件
        if (record.filePath) {
          await fs.unlink(record.filePath).catch(() => {
            // 文件可能已不存在，忽略错误
          });
        }

        // 删除记录
        await this.backupRepository.remove(record);
        deletedCount++;
      } catch (error) {
        this.logger.error(`删除备份记录失败: ${record.backupNo}`, error.stack);
      }
    }

    this.logger.log(`清理完成，删除了 ${deletedCount} 个旧备份`);
    return deletedCount;
  }

  /**
   * 获取备份列表
   */
  async getBackupList(
    query: BackupQueryDto,
  ): Promise<{ records: BackupRecord[]; total: number }> {
    const { page = 1, limit = 20, status, type, startDate, endDate } = query;

    const qb = this.backupRepository
      .createQueryBuilder('record')
      .orderBy('record.createdAt', 'DESC');

    if (status) {
      qb.andWhere('record.status = :status', { status });
    }

    if (type) {
      qb.andWhere('record.type = :type', { type });
    }

    if (startDate) {
      qb.andWhere('record.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      qb.andWhere('record.createdAt <= :endDate', {
        endDate: new Date(endDate + 'T23:59:59'),
      });
    }

    const [records, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { records, total };
  }

  /**
   * 获取备份详情
   */
  async getBackupDetail(id: string): Promise<BackupRecord> {
    const record = await this.backupRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('备份记录不存在');
    }
    return record;
  }

  /**
   * 获取备份统计
   */
  async getStatistics(): Promise<BackupStatisticsDto> {
    const totalBackups = await this.backupRepository.count();
    const successfulBackups = await this.backupRepository.count({
      where: { status: BackupStatus.SUCCESS },
    });
    const failedBackups = await this.backupRepository.count({
      where: { status: BackupStatus.FAILED },
    });

    // 计算总大小
    const successfulRecords = await this.backupRepository.find({
      where: { status: BackupStatus.SUCCESS },
      select: ['fileSizeBytes'],
    });

    const totalSizeBytes = successfulRecords.reduce(
      (sum, r) => sum + (r.fileSizeBytes || 0),
      0,
    );

    // 获取最近一次备份
    const lastBackup = await this.backupRepository.findOne({
      where: { status: BackupStatus.SUCCESS },
      order: { createdAt: 'DESC' },
    });

    return {
      totalBackups,
      successfulBackups,
      failedBackups,
      totalSize: this.formatFileSize(totalSizeBytes),
      averageSize:
        successfulBackups > 0
          ? this.formatFileSize(totalSizeBytes / successfulBackups)
          : '0 B',
      lastBackupTime: lastBackup?.completedAt || null,
      lastBackupStatus: lastBackup?.status || null,
      successRate:
        totalBackups > 0
          ? Math.round((successfulBackups / totalBackups) * 10000) / 100
          : 0,
    };
  }

  /**
   * 获取备份设置
   */
  async getSettings(): Promise<BackupSettingsDto> {
    return this.backupSettings;
  }

  /**
   * 更新备份设置
   */
  async updateSettings(dto: BackupSettingsDto): Promise<BackupSettingsDto> {
    this.backupSettings = { ...this.backupSettings, ...dto };
    return this.backupSettings;
  }

  /**
   * 验证备份文件完整性
   */
  async verifyBackup(id: string): Promise<{ valid: boolean; message: string }> {
    const record = await this.getBackupDetail(id);

    if (!record.filePath) {
      return { valid: false, message: '备份文件路径不存在' };
    }

    try {
      // 检查文件是否存在
      await fs.access(record.filePath);

      // 验证校验和
      const currentChecksum = await this.calculateChecksum(record.filePath);
      if (currentChecksum !== record.checksum) {
        return { valid: false, message: '校验和不匹配，文件可能已损坏' };
      }

      return { valid: true, message: '备份文件完整性验证通过' };
    } catch (error) {
      return {
        valid: false,
        message: `文件不存在或无法访问: ${error.message}`,
      };
    }
  }

  /**
   * 发送通知
   */
  private async sendNotification(
    status: 'success' | 'failure',
    message: string,
  ): Promise<void> {
    const title =
      status === 'success' ? '✅ 数据库备份成功' : '❌ 数据库备份失败';

    // 发送Webhook通知
    if (this.backupSettings.notificationWebhook) {
      try {
        await fetch(this.backupSettings.notificationWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            message,
            status,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        this.logger.error('发送Webhook通知失败', error);
      }
    }

    // TODO: 集成邮件通知
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 计算文件MD5校验和
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hash = createHash('md5');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }
}
