import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import { QrCode, QrCodeStatus } from '../entities/qr-code.entity';
import { Student } from '../../student/student.entity';

/** QR码明文格式:
 *  SCHQR|01|YYYYMMDDHHMMSS|student-uuid|16hex-nonce|signature-hex
 */
const QR_PROTOCOL = 'SCHQR';
const QR_VERSION = '01';
const QR_TTL_SECONDS = 30;

/** 两次生成的最小间隔（秒） */
const GENERATE_COOLDOWN_SECONDS = 30;

/**
 * 获取当日 UTC+8 的开始和结束时间
 */
function todayRange(): { start: Date; end: Date } {
  const now = new Date();
  const offset = 8 * 60; // UTC+8 分钟偏移
  const local = new Date(now.getTime() + offset * 60 * 1000);
  const start = new Date(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    0, 0, 0, 0,
  );
  const end = new Date(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    23, 59, 59, 999,
  );
  return { start, end };
}

@Injectable()
export class QrGenerationService {
  private readonly logger = new Logger(QrGenerationService.name);

  constructor(
    @InjectRepository(QrCode)
    private qrCodeRepository: Repository<QrCode>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  /**
   * F-ATTQR-001: 学生动态QR码生成
   *
   * 核心逻辑：
   * 1. JWT 学生认证 → 校验学生档案存在
   * 2. 校验当天是否已签到（已签到返回 409）
   * 3. 30秒内只允许生成一次（速率限制）
   * 4. 生成 QR 码数据（NestJS + crypto）
   * 5. 写入 qr_codes 表
   * 6. 返回 { qr_code_data, expires_at }
   */
  async generate(
    studentUserId: string,
    deviceId?: string,
    ipAddress?: string,
  ): Promise<{
    qr_code_data: string;
    expires_at: string;
    nonce: string;
  }> {
    // 1. 校验学生档案存在
    // studentUserId 是 User.id，需要通过 student_users 表查到 Student.id
    const studentLink = await this.studentRepository.query<Array<{ student_id: string }>>(
      'SELECT student_id FROM student_users WHERE user_id = $1',
      [studentUserId],
    );

    let studentId: string | undefined;
    if (studentLink && studentLink.length > 0) {
      studentId = studentLink[0].student_id;
    }

    if (!studentId) {
      // Fallback: 也尝试直接用 student.student_id 列查找（兼容旧数据或直接匹配）
      const studentByStudentId = await this.studentRepository.findOne({
        where: { studentId: studentUserId } as any,
      });
      if (studentByStudentId) {
        studentId = studentByStudentId.id;
      }
    }

    if (!studentId) {
      throw new BadRequestException({
        error: 'STUDENT_NOT_FOUND',
        message: '学生档案不存在',
      });
    }

    // 2. 校验当天是否已签到
    const { start: todayStart, end: todayEnd } = todayRange();
    const existingLog = await this.qrCodeRepository
      .createQueryBuilder('qr')
      .innerJoin('attendance_qr_logs', 'log', 'log.qr_code_id = qr.id')
      .where('qr.student_id = :studentId', { studentId })
      .andWhere('log.result = :result', { result: 'success' })
      .andWhere('log.created_at BETWEEN :start AND :end', {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString(),
      })
      .getOne();

    if (existingLog) {
      throw new ConflictException({
        error: 'ALREADY_CHECKED_IN',
        message: '今日已签到',
        checked_in_at: existingLog.generatedAt
          ? existingLog.generatedAt.toISOString()
          : undefined,
      });
    }

    // 3. 30秒内只允许生成一次（速率限制）
    const thirtySecAgo = new Date(Date.now() - GENERATE_COOLDOWN_SECONDS * 1000);
    const recentQr = await this.qrCodeRepository.findOne({
      where: {
        studentId,
        generatedAt: LessThan(new Date()) as any,
      } as any,
      order: { generatedAt: 'DESC' },
    });

    if (recentQr && recentQr.generatedAt > thirtySecAgo) {
      // Check if there's a recent active QR (within cooldown)
      const recentActive = await this.qrCodeRepository.findOne({
        where: {
          studentId,
          status: QrCodeStatus.ACTIVE,
        } as any,
        order: { generatedAt: 'DESC' },
      });

      if (recentActive && recentActive.generatedAt > thirtySecAgo) {
        // 如果还有未过期的 active QR，则直接返回它（不生成新的）
        const now = new Date();
        if (recentActive.expiresAt > now) {
          return {
            qr_code_data: recentActive.qrData || '',
            expires_at: recentActive.expiresAt.toISOString(),
            nonce: recentActive.nonce,
          };
        }
      }

      // Rate limit: 30秒内同一学生只能生成一次
      const waitMs =
        thirtySecAgo.getTime() - recentQr.generatedAt.getTime() + 1000;
      throw new BadRequestException({
        error: 'RATE_LIMIT',
        message: `30秒内只能生成一次，请等待 ${Math.ceil(waitMs / 1000)} 秒`,
      });
    }

    // 4. 生成 QR 码数据
    const nonce = crypto.randomBytes(16).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + QR_TTL_SECONDS * 1000);

    // 格式化时间戳为 YYYYMMDDHHMMSS (UTC+8)
    const offset = 8 * 60; // UTC+8
    const localNow = new Date(now.getTime() + offset * 60 * 1000);
    const timestamp = this.formatTimestamp(localNow);

    // 原始明文（不含签名）
    const payload = `${QR_PROTOCOL}|${QR_VERSION}|${timestamp}|${studentId}|${nonce}`;

    // 签名
    const keyVersion = this.getCurrentKeyVersion();
    const signingKey = this.getSigningKey(keyVersion);
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(payload)
      .digest('hex');

    // 完整 QR 码数据
    const qrCodeData = `${payload}|${signature}`;

    // 5. 写入 qr_codes 表
    const qrCode = this.qrCodeRepository.create({
      studentId,
      nonce,
      keyVersion,
      signature,
      qrData: qrCodeData,
      generatedAt: now,
      expiresAt,
      status: QrCodeStatus.ACTIVE,
    });

    await this.qrCodeRepository.save(qrCode);

    this.logger.log(
      `QR码已生成: studentId=${studentId}, nonce=${nonce.substring(0, 8)}..., expires=${expiresAt.toISOString()}`,
    );

    // 6. 返回结果
    return {
      qr_code_data: qrCodeData,
      expires_at: expiresAt.toISOString(),
      nonce,
    };
  }

  /**
   * 获取当前有效的密钥版本号
   */
  getCurrentKeyVersion(): number {
    // 基于日期计算版本号，实现每日轮换
    const now = new Date();
    const epoch = new Date('2026-01-01T00:00:00.000Z');
    const daysSinceEpoch = Math.floor(
      (now.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysSinceEpoch;
  }

  /**
   * 获取指定版本的签名密钥
   * 密钥每日轮换：版本号基于天数，密钥派生自主密钥 + 版本号
   */
  getSigningKey(version: number): string {
    const masterKey =
      process.env.QR_SIGNING_MASTER_KEY ||
      'change-me-in-production-qr-signing-master-key-2026';
    // 每个版本派生不同的密钥
    return crypto
      .createHmac('sha256', masterKey)
      .update(`qr-signing-v${version}`)
      .digest('hex');
  }

  /**
   * 解析并验证 QR 码数据
   * 返回解析结果或抛出错误
   */
  parseAndVerifyQrCode(
    qrData: string,
  ): {
    protocol: string;
    version: string;
    timestamp: string;
    studentId: string;
    nonce: string;
    signature: string;
  } {
    const parts = qrData.split('|');
    if (parts.length !== 6) {
      throw new BadRequestException({
        error: 'INVALID_QR_FORMAT',
        message: 'QR码格式无效',
        alert: true,
      });
    }

    const [protocol, version, timestamp, studentId, nonce, signature] = parts;

    // 校验协议标识
    if (protocol !== QR_PROTOCOL || version !== QR_VERSION) {
      throw new BadRequestException({
        error: 'INVALID_QR_FORMAT',
        message: 'QR码协议版本不匹配',
        alert: true,
      });
    }

    return { protocol, version, timestamp, studentId, nonce, signature };
  }

  /**
   * 验证 HMAC 签名
   */
  verifySignature(
    payload: string,
    signature: string,
    keyVersion: number,
  ): boolean {
    const signingKey = this.getSigningKey(keyVersion);
    const expectedSig = crypto
      .createHmac('sha256', signingKey)
      .update(payload)
      .digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    // 防止 timingSafeEqual 因长度不一致而抛出 RangeError
    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  }

  /**
   * 尝试不同密钥版本验证签名（用于密钥轮换过渡期）
   */
  verifySignatureWithFallback(
    payload: string,
    signature: string,
    keyVersion: number,
  ): boolean {
    // 优先使用传入的版本
    if (this.verifySignature(payload, signature, keyVersion)) {
      return true;
    }
    // 兜底：检查前一个版本（密钥轮换过渡期）
    if (keyVersion > 0) {
      return this.verifySignature(payload, signature, keyVersion - 1);
    }
    return false;
  }

  private formatTimestamp(date: Date): string {
    const y = date.getFullYear().toString();
    const M = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${y}${M}${d}${h}${m}${s}`;
  }
}
