import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackupService } from './backup.service';

/**
 * 定时备份任务调度器
 * 负责按照配置的时间自动触发数据库备份
 */
@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);

  constructor(private readonly backupService: BackupService) {}

  /**
   * 每日凌晨2点执行数据库全量备份
   * SLA: 备份成功率 ≥ 99.9%
   */
  @Cron('0 2 * * *', { name: 'daily-backup' })
  async handleDailyBackup(): Promise<void> {
    this.logger.log('开始执行每日定时备份...');

    try {
      await this.backupService.triggerScheduledBackup();
      this.logger.log('每日定时备份完成');
    } catch (error) {
      this.logger.error(`每日定时备份失败: ${error.message}`, error.stack);
      // 错误已在 BackupService 中记录并发送通知
    }
  }

  /**
   * 每小时清理超过保留期限的旧备份
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup(): Promise<void> {
    try {
      const deletedCount = await this.backupService.cleanupOldBackups();
      if (deletedCount > 0) {
        this.logger.log(`清理完成，删除了 ${deletedCount} 个旧备份`);
      }
    } catch (error) {
      this.logger.error(`清理旧备份失败: ${error.message}`, error.stack);
    }
  }
}
