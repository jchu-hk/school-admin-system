import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, Not, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { OfflineSyncBuffer } from '../entities/offline-sync-buffer.entity';
import {
  Attendance,
  AttendanceStatus,
  AttendanceType,
  SyncSource,
  SyncStatus,
} from '../attendance.entity';
import { User, UserRole } from '../../user/user.entity';
import { Class } from '../../user/class.entity';

/** 单条离线记录 */
export interface OfflineSyncItem {
  cacheId?: string;
  /** QR原始内容 */
  qrRawContent: string;
  /** 学生ID */
  qrStudentId: string;
  /** 扫码设备ID */
  scannerDeviceId: string;
  scannerLocation?: string;
  /** ISO-8601 本地扫码时间 */
  scannedAt: string;
  /** ISO-8601 缓存时间 */
  cachedAt: string;
}

/** 批量同步请求体 */
export interface SyncBatchRequest {
  deviceId: string;
  deviceName?: string;
  items: OfflineSyncItem[];
}

/** 单条处理结果 */
export interface SyncItemResult {
  index: number;
  cacheId?: string;
  success: boolean;
  attendanceId?: string;
  error?: string;
  errorCode?: string;
}

/** 批量同步响应 */
export interface SyncBatchResponse {
  syncedCount: number;
  failedCount: number;
  failedItems: SyncItemResult[];
}

/**
 * 离线同步服务
 *
 * 扫码设备离线期间的签到缓存批量同步处理。
 * 幂等: 相同 qrRaw + scannedAt 不重复处理。
 * 防重复: 同一学生 5 分钟内不重复签到。
 *
 * 参考: FSD-QR-ATT-001 §3 F-ATTQR-002 (离线容灾)
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly DEDUP_WINDOW_MS = 5 * 60 * 1000;

  constructor(
    @InjectRepository(OfflineSyncBuffer)
    private readonly bufferRepository: Repository<OfflineSyncBuffer>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  /**
   * 计算 QR 内容 SHA256 哈希（去重用）
   */
  private hashQrContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 校验 QR 签名 & 过期
   *
   * SCHQR|01|YYYYMMDDHHMMSS|UUID|RANDOM|SIGNATURE
   *
   * 签名算法（预留）：HMAC-SHA256(当日密钥, protocol|version|timestamp|uuid|random)
   * 密钥每日轮换，由 KeyManagementService 管理。
   */
  private verifyQrSignature(
    qrContent: string,
  ): { valid: boolean; studentId?: string; timestamp?: Date; error?: string } {
    try {
      const parts = qrContent.split('|');
      if (parts.length !== 6) {
        return { valid: false, error: 'QR格式无效，预期6段，以|分隔' };
      }

      const [protocol, version, timestampStr] = parts;

      if (protocol !== 'SCHQR') {
        return { valid: false, error: '协议标识无效，预期SCHQR' };
      }
      if (version !== '01') {
        return { valid: false, error: 'QR版本号不支持，仅支持01' };
      }
      if (timestampStr.length !== 14 || !/^\d{14}$/.test(timestampStr)) {
        return { valid: false, error: '时间戳格式无效，预期YYYYMMDDHHMMSS' };
      }

      const qrTimestamp = this.parseQrTimestamp(timestampStr);
      if (!qrTimestamp) {
        return { valid: false, error: '时间戳解析失败' };
      }

      // 30秒有效期
      const now = new Date();
      const ageMs = now.getTime() - qrTimestamp.getTime();
      if (ageMs > 30000) {
        return { valid: false, error: '二维码已过期（超过30秒）' };
      }
      if (ageMs < 0) {
        return { valid: false, error: '二维码时间戳来自未来' };
      }

      return { valid: true, studentId: parts[3], timestamp: qrTimestamp };
    } catch (err: any) {
      return { valid: false, error: `签名验证异常: ${err.message}` };
    }
  }

  /**
   * 解析 QR 时间戳 YYYYMMDDHHMMSS -> Date
   */
  private parseQrTimestamp(timestamp: string): Date | null {
    const m = timestamp.match(
      /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
    );
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  }

  /**
   * 检查 5 分钟内同一学生是否已有签到（防重复）
   */
  private async checkDuplicateCheckIn(
    studentId: string,
    scannedAt: Date,
  ): Promise<boolean> {
    const start = new Date(scannedAt.getTime() - this.DEDUP_WINDOW_MS);
    const end = new Date(scannedAt.getTime() + this.DEDUP_WINDOW_MS);
    const count = await this.attendanceRepository.count({
      where: {
        studentId,
        attendanceDate: scannedAt,
      } as any,
    });
    // Use query builder for more precise time-range check
    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.student_id = :studentId', { studentId })
      .andWhere('attendance.attendance_date BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      });
    const total = await qb.getCount();
    return total > 0;
  }

  /**
   * 幂等性检查：相同 qrRaw + scannedAt 不重复处理
   */
  private async checkIdempotency(
    qrRawHash: string,
    scannedAt: Date,
  ): Promise<boolean> {
    const existing = await this.bufferRepository.findOne({
      where: { qrRawHash, scannedAt } as any,
    });
    return !!existing;
  }

  /**
   * 处理单条离线记录
   */
  private async processItem(
    item: OfflineSyncItem,
    deviceId: string,
    deviceName: string,
    index: number,
  ): Promise<SyncItemResult> {
    const startTime = Date.now();
    const qrHash = this.hashQrContent(item.qrRawContent);
    const scannedAtDate = new Date(item.scannedAt);

    try {
      // ---- 幂等检查 ----
      const dup = await this.checkIdempotency(qrHash, scannedAtDate);
      if (dup) {
        return {
          index,
          cacheId: item.cacheId,
          success: false,
          error: '重复记录，相同的 qr_raw+scanned_at 已存在',
          errorCode: 'DUPLICATE_RECORD',
        };
      }

      // ---- 签名/格式/过期校验 ----
      const ver = this.verifyQrSignature(item.qrRawContent);
      if (!ver.valid) {
        await this.bufferRepository.save({
          cacheId: item.cacheId || undefined,
          deviceId,
          deviceName: deviceName || undefined,
          scannerLocation: item.scannerLocation || undefined,
          qrRaw: item.qrRawContent,
          qrRawHash: qrHash,
          qrStudentId: item.qrStudentId || undefined,
          scannedAt: scannedAtDate,
          cachedAt: new Date(item.cachedAt),
          syncResult: 'invalid_signature',
          failureReason: ver.error,
          rawRequest: item as any,
          validationDetail: { verification: ver },
        });
        return {
          index,
          cacheId: item.cacheId,
          success: false,
          error: ver.error,
          errorCode: 'INVALID_QR',
        };
      }

      const studentId = ver.studentId || item.qrStudentId;

      // ---- 5分钟重复签到检查 ----
      const recent = await this.checkDuplicateCheckIn(studentId, scannedAtDate);
      if (recent) {
        await this.bufferRepository.save({
          cacheId: item.cacheId || undefined,
          deviceId,
          deviceName: deviceName || undefined,
          scannerLocation: item.scannerLocation || undefined,
          qrRaw: item.qrRawContent,
          qrRawHash: qrHash,
          qrStudentId: studentId,
          scannedAt: scannedAtDate,
          cachedAt: new Date(item.cachedAt),
          syncResult: 'duplicate',
          failureReason: '5分钟内已有签到记录',
          rawRequest: item as any,
          validationDetail: { verification: ver },
        });
        return {
          index,
          cacheId: item.cacheId,
          success: false,
          error: '该学生5分钟内已有签到记录，请勿重复签到',
          errorCode: 'RATE_LIMITED',
        };
      }

      // ---- 查找学生 ----
      const student = await this.userRepository.findOne({
        where: { id: studentId, role: UserRole.STUDENT },
      });
      if (!student) {
        await this.bufferRepository.save({
          cacheId: item.cacheId || undefined,
          deviceId,
          deviceName: deviceName || undefined,
          scannerLocation: item.scannerLocation || undefined,
          qrRaw: item.qrRawContent,
          qrRawHash: qrHash,
          qrStudentId: studentId,
          scannedAt: scannedAtDate,
          cachedAt: new Date(item.cachedAt),
          syncResult: 'failed',
          failureReason: '学生用户不存在',
          rawRequest: item as any,
          validationDetail: { verification: ver },
        });
        return {
          index,
          cacheId: item.cacheId,
          success: false,
          error: '学生用户不存在',
          errorCode: 'STUDENT_NOT_FOUND',
        };
      }

      // ---- 查找班级 ----
      let classId: string | null = null;
      if (student.className) {
        const classEntity = await this.classRepository.findOne({
          where: { name: student.className },
        });
        if (classEntity) classId = classEntity.id;
      }

      // ---- 判定迟到 ----
      const hour = scannedAtDate.getHours();
      const isLate = hour > 8 || (hour === 8 && scannedAtDate.getMinutes() > 0);
      const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      const checkInTimeStr = scannedAtDate
        .toISOString()
        .slice(11, 19);

      // ---- 创建签到记录 ----
      const attendance = this.attendanceRepository.create({
        studentId,
        classId,
        attendanceDate: scannedAtDate,
        checkInTime: checkInTimeStr,
        status,
        attendanceType: AttendanceType.CHECK_IN,
        syncSource: SyncSource.BIOMETRIC,
        syncStatus: SyncStatus.SUCCESS,
        deviceId,
        deviceName: deviceName || undefined,
        createdBy: 'sync-service',
      } as any);
      const saved = await this.attendanceRepository.save(attendance);
      const savedAttendance = Array.isArray(saved) ? saved[0] : saved;

      // ---- 更新缓冲区为成功 ----
      await this.bufferRepository.save({
        cacheId: item.cacheId || undefined,
        deviceId,
        deviceName: deviceName || undefined,
        scannerLocation: item.scannerLocation || undefined,
        qrRaw: item.qrRawContent,
        qrRawHash: qrHash,
        qrStudentId: studentId,
        scannedAt: scannedAtDate,
        cachedAt: new Date(item.cachedAt),
        synced: true,
        syncResult: 'success',
        syncedAt: new Date(),
        attendanceId: savedAttendance.id,
        rawRequest: item as any,
        validationDetail: {
          verification: ver,
          checkInTime: checkInTimeStr,
          status,
          processingTimeMs: Date.now() - startTime,
        },
      });

      this.logger.log(
        `离线同步成功: student=${studentId}, attendance=${savedAttendance.id}, time=${checkInTimeStr}`,
      );

      return {
        index,
        cacheId: item.cacheId,
        success: true,
        attendanceId: savedAttendance.id,
      };
    } catch (err: any) {
      this.logger.error(`离线同步异常 index=${index}: ${err.message}`, err.stack);
      return {
        index,
        cacheId: item.cacheId,
        success: false,
        error: `内部错误: ${err.message}`,
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * 批量同步离线记录
   *
   * POST /attendance/qr/sync-batch
   *
   * 逐条校验，独立结果。幂等：qr_raw + scanned_at 防止重复。
   */
  async syncBatch(dto: SyncBatchRequest): Promise<SyncBatchResponse> {
    const { deviceId, deviceName, items } = dto;

    if (!deviceId) throw new BadRequestException('deviceId 不能为空');
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items 不能为空');
    }
    if (items.length > 500) {
      throw new BadRequestException('单次同步最多500条记录');
    }

    this.logger.log(`批量离线同步: device=${deviceId}, items=${items.length}`);

    const results: SyncItemResult[] = [];
    let syncedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const result = await this.processItem(items[i], deviceId, deviceName || deviceId, i);
      results.push(result);
      if (result.success) syncedCount++;
    }

    const failedItems = results.filter((r) => !r.success);
    this.logger.log(
      `离线同步完成: device=${deviceId}, total=${items.length}, synced=${syncedCount}, failed=${failedItems.length}`,
    );

    return { syncedCount, failedCount: failedItems.length, failedItems };
  }

  /**
   * 获取待同步数量统计
   */
  async getPendingCount(deviceId?: string): Promise<{
    total: number;
    pending: number;
    failed: number;
  }> {
    const where: any = {};
    if (deviceId) where.deviceId = deviceId;

    const [total, pending, failed] = await Promise.all([
      this.bufferRepository.count({ where }),
      this.bufferRepository.count({ where: { ...where, synced: false } }),
      this.bufferRepository.count({
        where: { ...where, syncResult: 'failed' },
      }),
    ]);
    return { total, pending, failed };
  }

  /**
   * 重试失败的同步记录
   */
  async retryFailed(deviceId?: string, limit: number = 100): Promise<{
    retried: number;
    succeeded: number;
    failed: number;
  }> {
    const where: any = {
      synced: false,
      syncResult: In(['failed', 'pending']),
    };
    if (deviceId) where.deviceId = deviceId;

    const records = await this.bufferRepository.find({ where, take: limit, order: { createdAt: 'ASC' } });

    let succeeded = 0;
    let failed = 0;

    for (const record of records) {
      try {
        const result = await this.processItem(
          {
            cacheId: record.cacheId,
            qrRawContent: record.qrRaw,
            qrStudentId: record.qrStudentId || record.deviceId,
            scannerDeviceId: record.deviceId,
            scannerLocation: record.scannerLocation || undefined,
            scannedAt: record.scannedAt.toISOString(),
            cachedAt: (record.cachedAt || record.createdAt).toISOString(),
          },
          record.deviceId,
          record.deviceName || record.deviceId,
          0,
        );
        if (result.success) succeeded++;
        else failed++;
      } catch (err: any) {
        failed++;
        await this.bufferRepository.update(record.id, {
          retryCount: record.retryCount + 1,
          failureReason: `重试异常: ${err.message}`,
        });
      }
    }

    return { retried: records.length, succeeded, failed };
  }

  /**
   * 清理过期的缓冲区记录（默认超过72小时）
   */
  async cleanExpired(olderThanHours: number = 72): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const result = await this.bufferRepository.delete({ createdAt: cutoff as any });
    return result.affected || 0;
  }
}
