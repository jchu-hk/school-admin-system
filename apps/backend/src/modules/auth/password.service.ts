import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { SetPasswordDto } from './dto/set-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LinkStudentDto, LinkedStudentResponseDto } from './dto/link-student.dto';
import { ParentStudentLink, RelationshipType } from './entities/parent-student-link.entity';
import { TemporaryPassword, TempPasswordType } from './entities/temporary-password.entity';
import { OtpRequest, OtpRequestType } from './entities/otp-request.entity';

// Password policy constants
const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 32,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  historyLength: 3,
  bcryptSaltRounds: 12,
};

// Account lockout constants
const ACCOUNT_LOCKOUT = {
  maxFailedAttempts: 5,
  lockoutDurationSeconds: 30 * 60, // 30 minutes
};

// OTP constants
const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 5,
  maxAttempts: 3,
  resendCooldownSeconds: 60,
  dailyLimit: 10,
};

export interface ApiResponse<T = any> {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class PasswordService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ParentStudentLink)
    private linkRepository: Repository<ParentStudentLink>,
    @InjectRepository(TemporaryPassword)
    private tempPasswordRepository: Repository<TemporaryPassword>,
    @InjectRepository(OtpRequest)
    private otpRequestRepository: Repository<OtpRequest>,
    private userService: UserService,
  ) {}

  // ==========================================
  // Password Validation
  // ==========================================

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < PASSWORD_POLICY.minLength) {
      errors.push(`密码至少${PASSWORD_POLICY.minLength}个字符`);
    }
    if (password.length > PASSWORD_POLICY.maxLength) {
      errors.push(`密码最多${PASSWORD_POLICY.maxLength}个字符`);
    }
    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('密码必须包含数字');
    }
    if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if password was used recently
   */
  async isPasswordRecentlyUsed(user: User, newPassword: string): Promise<boolean> {
    if (!user.passwordHistory || user.passwordHistory.length === 0) {
      return false;
    }

    for (const oldHash of user.passwordHistory) {
      if (await bcrypt.compare(newPassword, oldHash)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Hash password with bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_POLICY.bcryptSaltRounds);
  }

  // ==========================================
  // Account Lockout
  // ==========================================

  /**
   * Check if account is locked
   */
  private async checkLockout(user: User): Promise<void> {
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingSeconds = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 1000,
      );
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      throw new ForbiddenException({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: `账户已锁定，请在${remainingMinutes}分钟后重试`,
        data: null,
      });
    }

    // If lockout has expired, reset failed attempts
    if (user.lockoutUntil && user.lockoutUntil <= new Date()) {
      user.failedAttempts = 0;
      user.lockoutUntil = null;
      await this.userRepository.save(user);
    }
  }

  /**
   * Record failed attempt
   */
  private async recordFailedAttempt(user: User): Promise<void> {
    user.failedAttempts = (user.failedAttempts || 0) + 1;

    if (user.failedAttempts >= ACCOUNT_LOCKOUT.maxFailedAttempts) {
      const lockoutUntil = new Date(
        Date.now() + ACCOUNT_LOCKOUT.lockoutDurationSeconds * 1000,
      );
      user.lockoutUntil = lockoutUntil;
    }

    await this.userRepository.save(user);

    if (user.failedAttempts >= ACCOUNT_LOCKOUT.maxFailedAttempts) {
      throw new ForbiddenException({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: '账户已锁定，请在30分钟后重试',
        data: null,
      });
    }
  }

  /**
   * Reset failed attempts on successful login
   */
  private async resetFailedAttempts(user: User): Promise<void> {
    if (user.failedAttempts > 0 || user.lockoutUntil) {
      user.failedAttempts = 0;
      user.lockoutUntil = null;
      await this.userRepository.save(user);
    }
  }

  // ==========================================
  // Set Password
  // ==========================================

  /**
   * Set or update password
   */
  async setPassword(userId: string, dto: SetPasswordDto): Promise<ApiResponse> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
        data: null,
      });
    }

    // Check lockout
    await this.checkLockout(user);

    // Validate password match
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException({
        success: false,
        code: 'PASSWORD_MISMATCH',
        message: '两次密码输入不一致',
        data: null,
      });
    }

    // Validate password strength
    const { valid, errors } = this.validatePasswordStrength(dto.newPassword);
    if (!valid) {
      throw new BadRequestException({
        success: false,
        code: 'PASSWORD_TOO_WEAK',
        message: `密码强度不足: ${errors.join(', ')}`,
        data: null,
      });
    }

    // For non-first-time users, validate old password
    if (user.password && dto.oldPassword) {
      const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isOldPasswordValid) {
        await this.recordFailedAttempt(user);
        throw new BadRequestException({
          success: false,
          code: 'INVALID_OLD_PASSWORD',
          message: '原密码错误',
          data: null,
        });
      }
    }

    // Check password history
    const recentlyUsed = await this.isPasswordRecentlyUsed(user, dto.newPassword);
    if (recentlyUsed) {
      throw new BadRequestException({
        success: false,
        code: 'PASSWORD_RECENTLY_USED',
        message: '不能使用最近使用过的密码',
        data: null,
      });
    }

    // Update password and history
    const newHash = await this.hashPassword(dto.newPassword);
    const passwordHistory = user.passwordHistory || [];

    // Add current password to history before updating
    if (user.password) {
      passwordHistory.push(user.password);
      // Keep only last N passwords
      if (passwordHistory.length > PASSWORD_POLICY.historyLength) {
        passwordHistory.splice(0, passwordHistory.length - PASSWORD_POLICY.historyLength);
      }
    }

    user.password = newHash;
    user.passwordHistory = passwordHistory;
    user.mustChangePassword = false;
    user.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    await this.userRepository.save(user);

    // Reset failed attempts on successful password change
    if (user.failedAttempts > 0) {
      await this.resetFailedAttempts(user);
    }

    return {
      success: true,
      code: 'SUCCESS',
      message: '密码设置成功',
      data: null,
    };
  }

  // ==========================================
  // Password Status
  // ==========================================

  /**
   * Get password status for current user
   */
  async getPasswordStatus(userId: string): Promise<ApiResponse> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
        data: null,
      });
    }

    // A user needs to set password if:
    // 1. They don't have a password set yet (first login)
    // 2. mustChangePassword flag is true
    const hasPassword = !!(user.password && user.password.length > 0);

    return {
      success: true,
      code: 'SUCCESS',
      message: '操作成功',
      data: {
        isPasswordSet: hasPassword,
        mustSetPassword: !hasPassword || user.mustChangePassword === true,
        passwordExpiresAt: user.passwordExpiresAt,
      },
    };
  }

  // ==========================================
  // OTP Management
  // ==========================================

  /**
   * Generate a random OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check daily OTP request limit
   */
  private async checkDailyOtpLimit(phone: string): Promise<void> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this.otpRequestRepository.count({
      where: {
        phone,
        createdAt: MoreThan(startOfDay),
      },
    });

    if (count >= OTP_CONFIG.dailyLimit) {
      throw new BadRequestException({
        success: false,
        code: 'DAILY_OTP_LIMIT',
        message: '今日请求次数超限，请明天再试',
        data: null,
      });
    }
  }

  /**
   * Request OTP for password reset
   */
  async requestResetOtp(phone: string): Promise<ApiResponse> {
    // Check daily limit
    await this.checkDailyOtpLimit(phone);

    // Clean up old OTP requests for this phone
    await this.otpRequestRepository.delete({
      phone,
      used: false,
      expiresAt: LessThan(new Date()),
    });

    // Check cooldown (60 seconds)
    const cooldownStart = new Date(Date.now() - OTP_CONFIG.resendCooldownSeconds * 1000);
    const recentRequest = await this.otpRequestRepository.findOne({
      where: {
        phone,
        createdAt: MoreThan(cooldownStart),
      },
      order: { createdAt: 'DESC' },
    });

    if (recentRequest) {
      const remainingSeconds = Math.ceil(
        OTP_CONFIG.resendCooldownSeconds - (Date.now() - recentRequest.createdAt.getTime()) / 1000,
      );
      throw new BadRequestException({
        success: false,
        code: 'OTP_COOLDOWN',
        message: `请${remainingSeconds}秒后再试`,
        data: null,
      });
    }

    // Generate OTP
    const code = this.generateOtpCode();
    const codeHash = await bcrypt.hash(code, PASSWORD_POLICY.bcryptSaltRounds);
    const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000);

    // Create OTP request
    const otpRequest = this.otpRequestRepository.create({
      phone,
      codeHash,
      type: OtpRequestType.RESET,
      expiresAt,
    });

    await this.otpRequestRepository.save(otpRequest);

    // In production, send SMS here
    // For development, log the code
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PasswordService] OTP for phone ${phone}: ${code}`);
    }

    return {
      success: true,
      code: 'SUCCESS',
      message: '验证码已发送',
      data: null,
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(dto: ResetPasswordDto): Promise<ApiResponse> {
    const identifier = dto.phone || dto.email;
    if (!identifier) {
      throw new BadRequestException({
        success: false,
        code: 'INVALID_REQUEST',
        message: '请提供手机号或邮箱',
        data: null,
      });
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: dto.phone ? { phone: dto.phone } : { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
        data: null,
      });
    }

    // Check lockout
    await this.checkLockout(user);

    // Find valid OTP request
    const whereClause: any = {
      used: false,
      expiresAt: MoreThan(new Date()),
    };
    if (dto.phone) whereClause.phone = dto.phone;
    if (dto.email) whereClause.email = dto.email;

    const otpRequest = await this.otpRequestRepository.findOne({
      where: whereClause,
      order: { createdAt: 'DESC' },
    });

    if (!otpRequest) {
      throw new BadRequestException({
        success: false,
        code: 'OTP_EXPIRED',
        message: '验证码已过期，请重新获取',
        data: null,
      });
    }

    // Check attempts
    if (otpRequest.attempts >= OTP_CONFIG.maxAttempts) {
      // Delete expired OTP
      await this.otpRequestRepository.delete(otpRequest.id);
      throw new BadRequestException({
        success: false,
        code: 'OTP_EXCEEDED',
        message: '验证码尝试次数超限，请重新获取',
        data: null,
      });
    }

    // Verify OTP code
    const isValid = await bcrypt.compare(dto.otp, otpRequest.codeHash);
    if (!isValid) {
      otpRequest.attempts += 1;
      await this.otpRequestRepository.save(otpRequest);
      await this.recordFailedAttempt(user);

      const remainingAttempts = OTP_CONFIG.maxAttempts - otpRequest.attempts;
      throw new BadRequestException({
        success: false,
        code: 'INVALID_OTP',
        message: `验证码错误，剩余${remainingAttempts}次尝试机会`,
        data: null,
      });
    }

    // Validate password strength
    const { valid, errors } = this.validatePasswordStrength(dto.newPassword);
    if (!valid) {
      throw new BadRequestException({
        success: false,
        code: 'PASSWORD_TOO_WEAK',
        message: `密码强度不足: ${errors.join(', ')}`,
        data: null,
      });
    }

    // Check password history
    const recentlyUsed = await this.isPasswordRecentlyUsed(user, dto.newPassword);
    if (recentlyUsed) {
      throw new BadRequestException({
        success: false,
        code: 'PASSWORD_RECENTLY_USED',
        message: '不能使用最近使用过的密码',
        data: null,
      });
    }

    // Mark OTP as used
    otpRequest.used = true;
    await this.otpRequestRepository.save(otpRequest);

    // Update password
    const newHash = await this.hashPassword(dto.newPassword);
    const passwordHistory = user.passwordHistory || [];
    if (user.password) {
      passwordHistory.push(user.password);
      if (passwordHistory.length > PASSWORD_POLICY.historyLength) {
        passwordHistory.splice(0, passwordHistory.length - PASSWORD_POLICY.historyLength);
      }
    }

    user.password = newHash;
    user.passwordHistory = passwordHistory;
    user.mustChangePassword = false;
    user.failedAttempts = 0;
    user.lockoutUntil = null;

    await this.userRepository.save(user);

    return {
      success: true,
      code: 'SUCCESS',
      message: '密码重置成功',
      data: null,
    };
  }

  // ==========================================
  // Student Linking
  // ==========================================

  /**
   * Link a student to parent account
   */
  async linkStudent(userId: string, dto: LinkStudentDto): Promise<ApiResponse> {
    const parent = await this.userService.findOne(userId);
    if (!parent) {
      throw new NotFoundException({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
        data: null,
      });
    }

    // Check if already linked
    const existingLink = await this.linkRepository.findOne({
      where: { parentId: userId, studentId: dto.studentId },
    });

    if (existingLink) {
      throw new ConflictException({
        success: false,
        code: 'ALREADY_LINKED',
        message: '该学生已关联此账号',
        data: null,
      });
    }

    // If setting as primary, unset other primary links
    if (dto.isPrimary) {
      await this.linkRepository.update(
        { parentId: userId, isPrimary: true },
        { isPrimary: false },
      );
    }

    // Create the link
    const link = this.linkRepository.create({
      parentId: userId,
      studentId: dto.studentId,
      relationship: dto.relationship,
      isPrimary: dto.isPrimary || false,
      verifiedAt: new Date(), // Auto-verify for now
    });

    await this.linkRepository.save(link);

    return {
      success: true,
      code: 'SUCCESS',
      message: '关联成功',
      data: {
        id: link.id,
        studentId: link.studentId,
        relationship: link.relationship,
        isPrimary: link.isPrimary,
        verifiedAt: link.verifiedAt,
      },
    };
  }

  /**
   * Unlink a student from parent account
   */
  async unlinkStudent(userId: string, linkId: string): Promise<ApiResponse> {
    const link = await this.linkRepository.findOne({
      where: { id: linkId, parentId: userId },
    });

    if (!link) {
      throw new NotFoundException({
        success: false,
        code: 'LINK_NOT_FOUND',
        message: '关联记录不存在',
        data: null,
      });
    }

    await this.linkRepository.delete(linkId);

    return {
      success: true,
      code: 'SUCCESS',
      message: '已解除关联',
      data: null,
    };
  }

  /**
   * Get all linked students for a parent
   */
  async getLinkedStudents(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<ApiResponse<PaginatedResponse<LinkedStudentResponseDto>>> {
    const [links, total] = await this.linkRepository.findAndCount({
      where: { parentId: userId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items: LinkedStudentResponseDto[] = links.map((link) => ({
      id: link.id,
      studentId: link.studentId,
      relationship: link.relationship,
      isPrimary: link.isPrimary,
      verifiedAt: link.verifiedAt,
    }));

    return {
      success: true,
      code: 'SUCCESS',
      message: '操作成功',
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  }

  // ==========================================
  // Temporary Password Management
  // ==========================================

  /**
   * Generate a temporary password for a user
   */
  async generateTemporaryPassword(
    userId: string,
    type: TempPasswordType,
  ): Promise<ApiResponse & { code?: string }> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
        data: null,
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await this.hashPassword(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate old unused temp passwords
    await this.tempPasswordRepository.update(
      { userId, used: false },
      { used: true },
    );

    const tempPassword = this.tempPasswordRepository.create({
      userId,
      codeHash,
      type,
      expiresAt,
    });

    await this.tempPasswordRepository.save(tempPassword);

    // In production, send via SMS/email
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PasswordService] Temp password for user ${userId}: ${code}`);
    }

    return {
      success: true,
      code: 'SUCCESS',
      message: '临时密码已生成',
      data: { code }, // Only for dev/test environments
    };
  }

  /**
   * Verify and consume temporary password
   */
  async verifyTemporaryPassword(
    userId: string,
    code: string,
  ): Promise<ApiResponse> {
    const tempPassword = await this.tempPasswordRepository.findOne({
      where: {
        userId,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!tempPassword) {
      throw new BadRequestException({
        success: false,
        code: 'TEMP_PASSWORD_INVALID',
        message: '临时密码无效或已过期',
        data: null,
      });
    }

    const isValid = await bcrypt.compare(code, tempPassword.codeHash);
    if (!isValid) {
      throw new BadRequestException({
        success: false,
        code: 'INVALID_OLD_PASSWORD',
        message: '临时密码错误',
        data: null,
      });
    }

    // Mark as used
    tempPassword.used = true;
    await this.tempPasswordRepository.save(tempPassword);

    // Mark user as needing password change
    const user = await this.userService.findOne(userId);
    if (user) {
      user.mustChangePassword = true;
      await this.userRepository.save(user);
    }

    return {
      success: true,
      code: 'SUCCESS',
      message: '临时密码验证成功',
      data: null,
    };
  }
}
