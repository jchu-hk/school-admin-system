import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../user/user.entity';
import { UserService } from '../user/user.service';
import {
  OtpSession,
  OtpSessionStatus,
  OtpType,
} from '../otp/entities/otp.entity';
import { authenticator } from '@otplib/preset-default';

export interface TokenPayload {
  sub: string;
  username: string;
  role: UserRole;
  type: 'access' | 'refresh' | 'temp';
}

export interface LoginResult {
  access_token?: string;
  refresh_token?: string;
  temp_token?: string;
  sessionId?: string;
  requiresOtp?: boolean;
  otpType?: OtpType;
  otpCode?: string; // 开发环境下返回用于测试
  user?: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
  };
  message: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectRepository(OtpSession)
    private readonly otpSessionRepository: Repository<OtpSession>,
  ) {}

  /**
   * 用户登录
   * 1. 验证用户名密码
   * 2. 检查是否需要OTP（TEACHER/OFFICER角色）
   * 3. 不需要OTP的直接返回token
   * 4. 需要OTP的生成OTP并发送，返回临时token
   */
  async login(
    username: string,
    password: string,
    ipAddress?: string,
  ): Promise<LoginResult> {
    // 1. 查找用户
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 2. 检查用户状态
    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException('账户已被禁用');
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('账户未激活');
    }

    // 3. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 4. 更新登录信息
    await this.userService.updateLoginInfo(user.id, ipAddress || '');

    // 5. 检查是否需要OTP验证
    const requiresOtp = this.requiresOtpVerification(user.role);

    if (requiresOtp) {
      // 需要OTP验证，生成临时token和OTP会话
      return this.initiateOtpVerification(user);
    }

    // 不需要OTP验证，直接生成完整token
    const tokens = await this.generateTokens(user);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      message: '登录成功',
    };
  }

  /**
   * 验证OTP码
   * 1. 验证临时token
   * 2. 验证OTP码
   * 3. 验证成功返回完整token
   */
  async verifyOtp(
    tempToken: string,
    code: string,
    sessionId: string,
    otpType: OtpType,
  ): Promise<LoginResult> {
    // 1. 验证临时token
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify(tempToken, {
        secret: this.configService.get('JWT_SECRET') || 'school-admin-secret',
      });
    } catch (error) {
      throw new UnauthorizedException('临时token无效或已过期');
    }

    if (payload.type !== 'temp') {
      throw new UnauthorizedException('无效的临时token');
    }

    // 2. 获取用户
    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 3. 验证OTP会话
    const session = await this.otpSessionRepository.findOne({
      where: {
        id: sessionId,
        userId: user.id,
        status: OtpSessionStatus.ACTIVE,
      },
    });

    if (!session) {
      throw new BadRequestException('OTP会话无效或已过期');
    }

    if (session.expiresAt < new Date()) {
      session.status = OtpSessionStatus.EXPIRED;
      await this.otpSessionRepository.save(session);
      throw new BadRequestException('OTP会话已过期');
    }

    // 4. 验证OTP码
    const isValid = await this.validateOtpCode(user, code, otpType, session);

    if (!isValid) {
      session.failedAttempts += 1;
      await this.otpSessionRepository.save(session);
      throw new BadRequestException('OTP验证码错误');
    }

    // 5. 标记OTP会话为已使用
    session.status = OtpSessionStatus.USED;
    await this.otpSessionRepository.save(session);

    // 6. 生成完整token
    const tokens = await this.generateTokens(user);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      message: '登录成功',
    };
  }

  /**
   * 刷新access token
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<{ access_token: string; message: string }> {
    try {
      // 验证refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get('JWT_REFRESH_SECRET') ||
          'school-admin-refresh-secret',
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      // 获取用户
      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      // 检查用户状态
      if (user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('账户状态异常');
      }

      // 生成新的access token
      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          username: user.username,
          role: user.role,
          type: 'access',
        },
        {
          secret: this.configService.get('JWT_SECRET') || 'school-admin-secret',
          expiresIn: '15m',
        },
      );

      return {
        access_token: accessToken,
        message: 'Token刷新成功',
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 检查角色是否需要OTP验证
   * TEACHER和OFFICER角色需要OTP验证
   */
  private requiresOtpVerification(role: UserRole): boolean {
    const rolesRequiringOtp = [
      UserRole.TEACHER,
      UserRole.SCHOOL_DIRECTOR,
      UserRole.SYSTEM_ADMIN,
    ];
    return rolesRequiringOtp.includes(role);
  }

  /**
   * 初始化OTP验证流程
   */
  private async initiateOtpVerification(user: User): Promise<LoginResult> {
    // 生成6位数字OTP码
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 创建OTP会话
    const session = this.otpSessionRepository.create({
      userId: user.id,
      otpType: OtpType.EMAIL, // 默认使用邮件OTP
      otpCode,
      operationType: 'LOGIN',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟有效期
    });

    await this.otpSessionRepository.save(session);

    // 生成临时token（15分钟有效期）
    const tempToken = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        type: 'temp',
      },
      {
        secret: this.configService.get('JWT_SECRET') || 'school-admin-secret',
        expiresIn: '15m',
      },
    );

    // TODO: 发送OTP码到用户邮箱或手机
    // 在开发/测试环境返回OTP码方便调试
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    console.log(`[AuthService] OTP for ${user.username}: ${otpCode}`);

    return {
      temp_token: tempToken,
      sessionId: session.id,
      requiresOtp: true,
      otpType: OtpType.EMAIL,
      // 开发环境下返回OTP码用于测试
      otpCode: isDev ? otpCode : undefined,
      message: '请查收OTP验证码',
    };
  }

  /**
   * 验证OTP码
   */
  private async validateOtpCode(
    user: User,
    code: string,
    otpType: OtpType,
    session: OtpSession,
  ): Promise<boolean> {
    switch (otpType) {
      case OtpType.GOOGLE_AUTHENTICATOR:
        // 使用Google Authenticator验证
        if (user.otpSecret) {
          return authenticator.check(code, user.otpSecret);
        }
        return false;
      case OtpType.SMS:
      case OtpType.EMAIL:
        // 验证短信或邮件OTP
        return session.otpCode === code;
      default:
        return false;
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jwtSecret =
      this.configService.get('JWT_SECRET') || 'school-admin-secret';
    const jwtRefreshSecret =
      this.configService.get('JWT_REFRESH_SECRET') ||
      'school-admin-refresh-secret';

    // 生成access token（15分钟有效期）
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        type: 'access',
      },
      {
        secret: jwtSecret,
        expiresIn: '15m',
      },
    );

    // 生成refresh token（7天有效期）
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        type: 'refresh',
      },
      {
        secret: jwtRefreshSecret,
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
