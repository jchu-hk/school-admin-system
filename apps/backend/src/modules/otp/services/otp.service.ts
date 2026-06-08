import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { authenticator } from '@otplib/preset-default';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import {
  OtpConfig,
  OtpSession,
  OtpTrustedSession,
  OtpType,
  OtpSessionStatus,
} from '../entities/otp.entity';
import {
  BindOtpDto,
  VerifyOtpDto,
  ConfirmBindOtpDto,
  UnbindOtpDto,
  GenerateOtpDto,
} from '../dto/otp.dto';
import { User } from '../../user/user.entity';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-log.entity';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_HOURS = 1;
  private readonly TRUSTED_SESSION_DURATION_HOURS = 2;

  constructor(
    @InjectRepository(OtpConfig)
    private readonly otpConfigRepository: Repository<OtpConfig>,
    @InjectRepository(OtpSession)
    private readonly otpSessionRepository: Repository<OtpSession>,
    @InjectRepository(OtpTrustedSession)
    private readonly otpTrustedSessionRepository: Repository<OtpTrustedSession>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    authenticator.options = {
      window: 1,
      step: 30,
    };
  }

  async generateOtp(
    user: User,
    generateOtpDto: GenerateOtpDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Check if user has this OTP type enabled
    const otpConfig = await this.otpConfigRepository.findOne({
      where: {
        userId: user.id,
        otpType: generateOtpDto.otpType,
        isEnabled: true,
      },
    });

    if (!otpConfig) {
      throw new BadRequestException(
        `OTP type ${generateOtpDto.otpType} is not enabled for this user`,
      );
    }

    // Check if there's an active locked session
    const recentFailedSessions = await this.otpSessionRepository.find({
      where: {
        userId: user.id,
        otpType: generateOtpDto.otpType,
        createdAt: MoreThan(
          new Date(Date.now() - this.LOCKOUT_DURATION_HOURS * 60 * 60 * 1000),
        ),
      },
      order: { createdAt: 'DESC' },
      take: this.MAX_FAILED_ATTEMPTS,
    });

    const failedAttempts = recentFailedSessions.filter(
      (s) => s.failedAttempts >= 1,
    ).length;
    if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      throw new ForbiddenException(
        `Too many failed attempts. Please try again after ${this.LOCKOUT_DURATION_HOURS} hour`,
      );
    }

    let otpCode: string;
    if (
      generateOtpDto.otpType === OtpType.GOOGLE_AUTHENTICATOR ||
      generateOtpDto.otpType === OtpType.UKEY
    ) {
      // These are time-based, no need to generate code here, user will provide from their device
      otpCode = null;
    } else {
      // Generate 6-digit OTP for SMS/email
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Send OTP via corresponding channel
      await this.sendOtp(otpConfig, otpCode, generateOtpDto.operationType);
    }

    // Create OTP session
    const session = this.otpSessionRepository.create({
      userId: user.id,
      otpType: generateOtpDto.otpType,
      otpCode,
      operationType: generateOtpDto.operationType,
      operationDetails: generateOtpDto.operationDetails,
      expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    await this.otpSessionRepository.save(session);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.OTP_GENERATED,
      resourceType: 'OTP',
      resourceId: session.id,
      details: {
        otpType: generateOtpDto.otpType,
        operationType: generateOtpDto.operationType,
        ipAddress,
        userAgent,
      },
    });

    return {
      sessionId: session.id,
      expiresAt: session.expiresAt,
      otpType: generateOtpDto.otpType,
      message:
        generateOtpDto.otpType === OtpType.SMS ||
        generateOtpDto.otpType === OtpType.EMAIL
          ? `OTP has been sent to your ${generateOtpDto.otpType}`
          : 'Please enter the OTP code from your device',
    };
  }

  async verifyOtp(
    user: User,
    verifyOtpDto: VerifyOtpDto,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const session = await this.otpSessionRepository.findOne({
      where: {
        id: verifyOtpDto.sessionId,
        userId: user.id,
        status: OtpSessionStatus.ACTIVE,
      },
    });

    if (!session) {
      throw new BadRequestException('Invalid or expired OTP session');
    }

    if (session.expiresAt < new Date()) {
      session.status = OtpSessionStatus.EXPIRED;
      await this.otpSessionRepository.save(session);
      throw new BadRequestException('OTP session has expired');
    }

    const otpConfig = await this.otpConfigRepository.findOne({
      where: {
        userId: user.id,
        otpType: verifyOtpDto.otpType,
        isEnabled: true,
      },
    });

    if (!otpConfig) {
      throw new BadRequestException(
        `OTP type ${verifyOtpDto.otpType} is not enabled for this user`,
      );
    }

    let isValid = false;
    if (verifyOtpDto.otpType === OtpType.GOOGLE_AUTHENTICATOR) {
      isValid = authenticator.check(verifyOtpDto.code, otpConfig.secret);
    } else if (verifyOtpDto.otpType === OtpType.UKEY) {
      // Implement UKey verification logic here
      isValid = await this.verifyUKey(otpConfig.ukeyId, verifyOtpDto.code);
    } else {
      isValid = session.otpCode === verifyOtpDto.code;
    }

    if (!isValid) {
      session.failedAttempts += 1;
      await this.otpSessionRepository.save(session);

      await this.auditService.log({
        userId: user.id,
        action: AuditAction.OTP_VERIFY_FAILED,
        resourceType: 'OTP',
        resourceId: session.id,
        details: {
          otpType: verifyOtpDto.otpType,
          failedAttempts: session.failedAttempts,
          ipAddress,
          userAgent,
        },
      });

      if (session.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        throw new ForbiddenException(
          `Too many failed attempts. Please try again after ${this.LOCKOUT_DURATION_HOURS} hour`,
        );
      }

      throw new BadRequestException('Invalid OTP code');
    }

    // Mark session as used
    session.status = OtpSessionStatus.USED;
    await this.otpSessionRepository.save(session);

    // Create trusted session
    const trustedSession = this.otpTrustedSessionRepository.create({
      userId: user.id,
      sessionId: sessionId || uuidv4(),
      ipAddress,
      userAgent,
      expiresAt: new Date(
        Date.now() + this.TRUSTED_SESSION_DURATION_HOURS * 60 * 60 * 1000,
      ),
    });
    await this.otpTrustedSessionRepository.save(trustedSession);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.OTP_VERIFY_SUCCESS,
      resourceType: 'OTP',
      resourceId: session.id,
      details: {
        otpType: verifyOtpDto.otpType,
        operationType: session.operationType,
        ipAddress,
        userAgent,
        trustedSessionExpiresAt: trustedSession.expiresAt,
      },
    });

    return {
      success: true,
      trustedSessionId: trustedSession.id,
      trustedSessionExpiresAt: trustedSession.expiresAt,
      operationDetails: session.operationDetails,
    };
  }

  async bindOtp(
    user: User,
    bindOtpDto: BindOtpDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Check if already bound
    const existingConfig = await this.otpConfigRepository.findOne({
      where: { userId: user.id, otpType: bindOtpDto.otpType },
    });

    if (existingConfig && existingConfig.isEnabled) {
      throw new BadRequestException(
        `OTP type ${bindOtpDto.otpType} is already bound`,
      );
    }

    let secret: string;
    let qrCodeUrl: string = null;

    if (bindOtpDto.otpType === OtpType.GOOGLE_AUTHENTICATOR) {
      secret = authenticator.generateSecret();
      const otpAuthUrl = authenticator.keyuri(
        user.email,
        this.configService.get('APP_NAME', 'School Admin'),
        secret,
      );
      qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);
    } else {
      secret = null;
    }

    const otpConfig =
      existingConfig ||
      this.otpConfigRepository.create({
        userId: user.id,
        otpType: bindOtpDto.otpType,
        isEnabled: false,
      });

    otpConfig.secret = secret;
    otpConfig.phoneNumber = bindOtpDto.phoneNumber;
    otpConfig.email = bindOtpDto.email;
    otpConfig.ukeyId = bindOtpDto.ukeyId;

    await this.otpConfigRepository.save(otpConfig);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.OTP_BIND_INITIATED,
      resourceType: 'OTP',
      resourceId: otpConfig.id,
      details: {
        otpType: bindOtpDto.otpType,
        ipAddress,
        userAgent,
      },
    });

    return {
      otpType: bindOtpDto.otpType,
      secret:
        bindOtpDto.otpType === OtpType.GOOGLE_AUTHENTICATOR
          ? secret
          : undefined,
      qrCodeUrl:
        bindOtpDto.otpType === OtpType.GOOGLE_AUTHENTICATOR
          ? qrCodeUrl
          : undefined,
      message: 'Please verify the OTP code to complete binding',
    };
  }

  async confirmBindOtp(
    user: User,
    confirmBindOtpDto: ConfirmBindOtpDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const otpConfig = await this.otpConfigRepository.findOne({
      where: {
        userId: user.id,
        otpType: confirmBindOtpDto.otpType,
        isEnabled: false,
      },
    });

    if (!otpConfig) {
      throw new BadRequestException(
        'No pending OTP binding found for this type',
      );
    }

    let isValid = false;
    if (confirmBindOtpDto.otpType === OtpType.GOOGLE_AUTHENTICATOR) {
      isValid = authenticator.check(
        confirmBindOtpDto.code,
        confirmBindOtpDto.secret,
      );
    } else {
      // For SMS/email/UKey, send OTP first then verify here
      // This is simplified, in production you'd check against a sent OTP
      isValid = true;
    }

    if (!isValid) {
      throw new BadRequestException('Invalid OTP code');
    }

    otpConfig.isEnabled = true;
    await this.otpConfigRepository.save(otpConfig);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.OTP_BIND_SUCCESS,
      resourceType: 'OTP',
      resourceId: otpConfig.id,
      details: {
        otpType: confirmBindOtpDto.otpType,
        ipAddress,
        userAgent,
      },
    });

    return {
      success: true,
      message: `OTP type ${confirmBindOtpDto.otpType} has been successfully bound`,
    };
  }

  async unbindOtp(
    user: User,
    unbindOtpDto: UnbindOtpDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const otpConfig = await this.otpConfigRepository.findOne({
      where: {
        userId: user.id,
        otpType: unbindOtpDto.otpType,
        isEnabled: true,
      },
    });

    if (!otpConfig) {
      throw new BadRequestException(
        `OTP type ${unbindOtpDto.otpType} is not bound`,
      );
    }

    // Verify OTP before unbinding
    let isValid = false;
    if (unbindOtpDto.otpType === OtpType.GOOGLE_AUTHENTICATOR) {
      isValid = authenticator.check(unbindOtpDto.code, otpConfig.secret);
    } else {
      // Simplified verification
      isValid = true;
    }

    if (!isValid) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.otpConfigRepository.remove(otpConfig);

    // Revoke all trusted sessions for this user
    await this.otpTrustedSessionRepository.delete({ userId: user.id });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.OTP_UNBIND_SUCCESS,
      resourceType: 'OTP',
      resourceId: otpConfig.id,
      details: {
        otpType: unbindOtpDto.otpType,
        ipAddress,
        userAgent,
      },
    });

    return {
      success: true,
      message: `OTP type ${unbindOtpDto.otpType} has been successfully unbound`,
    };
  }

  async isTrustedSession(userId: string, sessionId: string): Promise<boolean> {
    const trustedSession = await this.otpTrustedSessionRepository.findOne({
      where: { userId, sessionId, expiresAt: MoreThan(new Date()) },
    });

    return !!trustedSession;
  }

  async getUserOtpConfigs(userId: string) {
    const configs = await this.otpConfigRepository.find({
      where: { userId },
      select: ['id', 'otpType', 'isEnabled', 'createdAt', 'updatedAt'],
    });

    return configs.map((config) => ({
      id: config.id,
      otpType: config.otpType,
      isEnabled: config.isEnabled,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));
  }

  private async sendOtp(
    otpConfig: OtpConfig,
    otpCode: string,
    operationType: string,
  ) {
    // Implement SMS/email sending logic here
    // For production, integrate with actual SMS/email providers
    // This is a mock implementation
    if (otpConfig.otpType === OtpType.SMS) {
      console.log(
        `Sending SMS OTP ${otpCode} to ${otpConfig.phoneNumber} for operation ${operationType}`,
      );
    } else if (otpConfig.otpType === OtpType.EMAIL) {
      console.log(
        `Sending email OTP ${otpCode} to ${otpConfig.email} for operation ${operationType}`,
      );
    }
  }

  private async verifyUKey(ukeyId: string, code: string): Promise<boolean> {
    // Implement UKey verification logic here
    // This is a mock implementation
    return code === '123456';
  }
}


