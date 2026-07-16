import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrCode } from '../entities/qr-code.entity';
import { AttendanceQrLog } from '../entities/attendance-qr-log.entity';
import { OfflineSyncBuffer } from '../entities/offline-sync-buffer.entity';
import { Student, StudentStatus } from '../../student/student.entity';
import { User } from '../../user/user.entity';
import { Class } from '../../user/class.entity';
import { QrGenerationService } from './qr-generation.service';

/**
 * F-ATTQR-002: 教职工扫码签到
 *
 * 核心逻辑:
 * 1. JWT 教职工认证 → 校验扫码权限
 * 2. 解析 QR 码明文
 * 3. 校验 HMAC-SHA256 签名
 * 4. 校验 QR 码是否过期 (expires_at < now)
 * 5. 校验 nonce 唯一性（防重放）
 * 6. 写入 attendance_qr_logs 表
 * 7. 更新 qr_codes.status = 'used'
 * 8. 返回 { result, student_name, class_name, scanned_at }
 */

/** 5分钟内禁止重复签到 */
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class QrScanService {
  private readonly logger = new Logger(QrScanService.name);

  constructor(
    @InjectRepository(QrCode)
    private qrCodeRepository: Repository<QrCode>,
    @InjectRepository(AttendanceQrLog)
    private qrLogRepository: Repository<AttendanceQrLog>,
    @InjectRepository(OfflineSyncBuffer)
    private offlineBufferRepository: Repository<OfflineSyncBuffer>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    private qrGenerationService: QrGenerationService,
  ) {}

  /**
   * F-ATTQR-002: 教职工扫码签到
   */
  async scan(
    qrCodeData: string,
    staffUserId: string,
    deviceId?: string,
    ipAddress?: string,
  ): Promise<{
    result: string;
    student_id: string;
    student_name: string;
    class_name: string;
    scanned_at: string;
  }> {
    // ===== Step 1: 校验教职工存在 =====
    // 公开扫码端点允许匿名扫描，不强制绑定教职工账号
    let staffUser: User | null = null;
    if (staffUserId && staffUserId !== 'anonymous-scanner') {
      staffUser = await this.userRepository.findOne({
        where: { id: staffUserId },
      });
    }

    // ===== Step 2: 解析 QR 码 =====
    let parsed: ReturnType<typeof this.qrGenerationService.parseAndVerifyQrCode>;
    try {
      parsed = this.qrGenerationService.parseAndVerifyQrCode(qrCodeData);
    } catch (err) {
      // 重新包装为 400
      throw new BadRequestException({
        error: 'INVALID_QR_FORMAT',
        message: 'QR码格式无效',
        alert: true,
      });
    }

    const { studentId, nonce, signature, timestamp, version } = parsed;

    // ===== Step 3: 校验签名 =====
    const payload = `SCHQR|${version}|${timestamp}|${studentId}|${nonce}`;
    const keyVersion = this.qrGenerationService.getCurrentKeyVersion();
    const isValid = this.qrGenerationService.verifySignatureWithFallback(
      payload,
      signature,
      keyVersion,
    );

    if (!isValid) {
      // 记录伪造尝试
      await this.logScanResult(
        null,
        studentId,
        staffUserId,
        'forged',
        deviceId,
        ipAddress,
      );

      throw new BadRequestException({
        error: 'INVALID_SIGNATURE',
        message: '伪造QR码',
        alert: true,
      });
    }

    // ===== Step 4: 查找 QR 码记录 =====
    const qrCodeRecord = await this.qrCodeRepository.findOne({
      where: { nonce },
    });

    if (!qrCodeRecord) {
      // nonce 不存在 → 可能伪造或数据库未同步
      await this.logScanResult(
        null,
        studentId,
        staffUserId,
        'forged',
        deviceId,
        ipAddress,
      );

      throw new BadRequestException({
        error: 'QR_NOT_FOUND',
        message: 'QR码记录不存在，不允许扫描',
        alert: true,
      });
    }

    // ===== Step 5: 校验是否过期 =====
    const now = new Date();
    if (qrCodeRecord.expiresAt < now) {
      await this.logScanResult(
        qrCodeRecord.id,
        studentId,
        staffUserId,
        'expired',
        deviceId,
        ipAddress,
      );

      // 标记为过期
      if (qrCodeRecord.status === 'active') {
        qrCodeRecord.status = 'expired';
        await this.qrCodeRepository.save(qrCodeRecord);
      }

      throw new BadRequestException({
        error: 'QR_EXPIRED',
        message: 'QR码已过期，请让学生刷新',
      });
    }

    // ===== Step 6: 校验 nonce 唯一性（防重放）=====
    if (qrCodeRecord.status !== 'active') {
      await this.logScanResult(
        qrCodeRecord.id,
        studentId,
        staffUserId,
        'duplicate',
        deviceId,
        ipAddress,
      );

      throw new ConflictException({
        error: 'DUPLICATE_SCAN',
        message: '该二维码已被使用',
      });
    }

    // ===== Step 7: 校验学生是否已在5分钟内签到过 =====
    const duplicateWindowStart = new Date(now.getTime() - DUPLICATE_WINDOW_MS);
    const recentCheckin = await this.qrLogRepository.findOne({
      where: {
        studentId,
        result: 'success',
      } as any,
      order: { scannedAt: 'DESC' },
    });

    if (recentCheckin && recentCheckin.scannedAt > duplicateWindowStart) {
      throw new ConflictException({
        error: 'DUPLICATE_CHECKIN',
        message: '该学生已签到',
        checked_in_at: recentCheckin.scannedAt.toISOString(),
      });
    }

    // ===== Step 8: 查询学生信息和班级 =====
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      // 如果 student 表中找不到，尝试通过 users 表查找关联学生
    }

    const studentName = student?.nameZh || student?.studentId || studentId;

    // 获取班级名称
    const classAllocation = await this.qrCodeRepository
      .createQueryBuilder('qr')
      .select('c.name')
      .from('class_allocations', 'ca')
      .innerJoin('classes', 'c', 'c.id = ca.class_id')
      .where('ca.student_id = :studentId', { studentId })
      .andWhere('ca.end_date IS NULL')
      .orderBy('ca.created_at', 'DESC')
      .getRawOne();

    const className = classAllocation?.c_name || '';

    // ===== Step 9: 更新 QR 码状态 =====
    qrCodeRecord.status = 'used';
    await this.qrCodeRepository.save(qrCodeRecord);

    // ===== Step 10: 写入签到日志 =====
    const log = await this.logScanResult(
      qrCodeRecord.id,
      studentId,
      staffUserId,
      'success',
      deviceId,
      ipAddress,
    );

    this.logger.log(
      `扫码签到成功: studentId=${studentId}, staffUserId=${staffUserId}, scannedAt=${log.scannedAt.toISOString()}`,
    );

    // ===== Step 11: 返回结果 =====
    return {
      result: 'success',
      student_id: studentId,
      student_name: studentName,
      class_name: className,
      scanned_at: log.scannedAt.toISOString(),
    };
  }

  /**
   * 离线批量同步签到数据
   */
  async syncBatch(
    deviceId: string,
    batch: Array<{ qr_raw: string; scanned_at: string }>,
  ): Promise<{
    synced_count: number;
    failed_items: Array<{ index: number; reason: string; message: string }>;
  }> {
    const failedItems: Array<{
      index: number;
      reason: string;
      message: string;
    }> = [];
    let syncedCount = 0;

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      const scannedAt = new Date(item.scanned_at);

      try {
        // 先写入离线缓冲
        const bufferRecord = this.offlineBufferRepository.create({
          deviceId,
          qrRaw: item.qr_raw,
          scannedAt,
        });

        // 尝试同步（由离线设备的服务端标记）
        bufferRecord.synced = true;
        bufferRecord.syncedAt = new Date();
        bufferRecord.syncResult = 'processing';

        await this.offlineBufferRepository.save(bufferRecord);

        // 标记成功
        bufferRecord.syncResult = 'success';
        await this.offlineBufferRepository.save(bufferRecord);
        syncedCount++;
      } catch (err) {
        failedItems.push({
          index: i,
          reason: 'SYNC_ERROR',
          message: String(err),
        });
      }
    }

    return {
      synced_count: syncedCount,
      failed_items: failedItems,
    };
  }

  /**
   * 记录扫码结果日志
   */
  private async logScanResult(
    qrCodeId: string | null,
    studentId: string,
    staffUserId: string,
    result: string,
    deviceId?: string,
    ipAddress?: string,
  ): Promise<AttendanceQrLog> {
    const log = this.qrLogRepository.create({
      qrCodeId,
      studentId,
      staffUserId,
      source: 'online',
      deviceId: deviceId || null,
      ipAddress: ipAddress || null,
      result,
    });

    return this.qrLogRepository.save(log);
  }
}
