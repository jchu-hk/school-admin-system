/**
 * OTP认证 → 用户管理 集成测试
 *
 * 测试场景：
 * 1. OTP验证成功后更新用户最后登录时间 (lastLoginAt)
 * 2. OTP失败达到最大次数后锁定账户 (UserStatus.DISABLED)
 * 3. OTP验证成功后重置账户状态（解锁）
 *
 * 对应模块：otp (OTP认证), user (用户管理)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OtpService } from '../otp/services/otp.service';
import { OtpService as OtpServiceClass } from '../otp/services/otp.service';
import {
  OtpConfig,
  OtpSession,
  OtpTrustedSession,
  OtpType,
  OtpSessionStatus,
} from '../otp/entities/otp.entity';
import { User, UserStatus } from '../user/user.entity';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';

describe('OTP Authentication → User Management Integration', () => {
  let otpService: OtpServiceClass;
  let otpConfigRepository: jest.Mocked<Repository<OtpConfig>>; // eslint-disable-line @typescript-eslint/no-unused-vars
  let otpSessionRepository: jest.Mocked<Repository<OtpSession>>; // eslint-disable-line @typescript-eslint/no-unused-vars
  let otpTrustedSessionRepository: jest.Mocked<Repository<OtpTrustedSession>>; // eslint-disable-line @typescript-eslint/no-unused-vars
  let userRepository: jest.Mocked<Repository<User>>; // eslint-disable-line @typescript-eslint/no-unused-vars

  const mockOtpConfigRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOtpSessionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOtpTrustedSessionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('School Admin'),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const testUser: User = {
    id: 'user-001',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    role: 'teacher' as any,
    status: UserStatus.ACTIVE,
    password: 'hashed',
    schoolId: 'school-001',
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getRepositoryToken(OtpConfig),
          useValue: mockOtpConfigRepository,
        },
        {
          provide: getRepositoryToken(OtpSession),
          useValue: mockOtpSessionRepository,
        },
        {
          provide: getRepositoryToken(OtpTrustedSession),
          useValue: mockOtpTrustedSessionRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    otpService = module.get<OtpServiceClass>(OtpService);
    otpConfigRepository = module.get(getRepositoryToken(OtpConfig));
    otpSessionRepository = module.get(getRepositoryToken(OtpSession));
    otpTrustedSessionRepository = module.get(
      getRepositoryToken(OtpTrustedSession),
    );
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('场景1: OTP验证成功后更新用户最后登录时间', () => {
    it('应该在OTP验证成功后更新用户的 lastLoginAt', async () => {
      // Arrange
      const otpConfig: OtpConfig = {
        id: 'otp-config-001',
        userId: 'user-001',
        otpType: OtpType.EMAIL,
        isEnabled: true,
        secret: null,
        phoneNumber: null,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpConfig;

      const otpSession: OtpSession = {
        id: 'session-001',
        userId: 'user-001',
        otpType: OtpType.EMAIL,
        otpCode: '123456',
        status: OtpSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        failedAttempts: 0,
        operationType: 'login',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpSession;

      mockOtpSessionRepository.findOne.mockResolvedValue(otpSession);
      mockOtpConfigRepository.findOne.mockResolvedValue(otpConfig);
      mockOtpSessionRepository.save.mockResolvedValue(otpSession);
      mockOtpTrustedSessionRepository.create.mockReturnValue({
        userId: 'user-001',
        expiresAt: new Date(),
      } as OtpTrustedSession);
      mockOtpTrustedSessionRepository.save.mockResolvedValue(
        {} as OtpTrustedSession,
      );
      mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Act
      const result = await otpService.verifyOtp(
        testUser,
        { sessionId: 'session-001', otpType: OtpType.EMAIL, code: '123456' },
        'session-id-abc',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      // Assert: OTP verification succeeded
      expect(result.success).toBe(true);
      expect(result.trustedSessionId).toBeDefined();

      // Assert: User's lastLoginAt was updated
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 'user-001' },
        expect.objectContaining({
          lastLoginAt: expect.any(Date),
          lastLoginIp: '192.168.1.1',
          status: UserStatus.ACTIVE,
        }),
      );
    });

    it('应该同时记录审计日志', async () => {
      const otpConfig: OtpConfig = {
        id: 'otp-config-001',
        userId: 'user-001',
        otpType: OtpType.GOOGLE_AUTHENTICATOR,
        isEnabled: true,
        secret: 'JBSWY3DPEHPK3PXP',
        email: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpConfig;

      const otpSession: OtpSession = {
        id: 'session-002',
        userId: 'user-001',
        otpType: OtpType.GOOGLE_AUTHENTICATOR,
        status: OtpSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        failedAttempts: 0,
        operationType: 'login',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpSession;

      mockOtpSessionRepository.findOne.mockResolvedValue(otpSession);
      mockOtpConfigRepository.findOne.mockResolvedValue(otpConfig);
      mockOtpSessionRepository.save.mockResolvedValue(otpSession);
      mockOtpTrustedSessionRepository.create.mockReturnValue({
        userId: 'user-001',
        expiresAt: new Date(),
      } as OtpTrustedSession);
      mockOtpTrustedSessionRepository.save.mockResolvedValue({} as any);
      mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);

      await otpService.verifyOtp(
        testUser,
        {
          sessionId: 'session-002',
          otpType: OtpType.GOOGLE_AUTHENTICATOR,
          code: '000000',
        },
        'session-id-xyz',
      );

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'OTP_VERIFY_SUCCESS',
          resourceType: 'OTP',
        }),
      );
    });
  });

  describe('场景2: OTP失败达到最大次数后锁定账户', () => {
    it('应该在失败3次后锁定用户账户', async () => {
      // Arrange - Session with 2 previous failed attempts
      const otpConfig: OtpConfig = {
        id: 'otp-config-001',
        userId: 'user-001',
        otpType: OtpType.EMAIL,
        isEnabled: true,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpConfig;

      const otpSession: OtpSession = {
        id: 'session-003',
        userId: 'user-001',
        otpType: OtpType.EMAIL,
        otpCode: '123456', // Correct code
        status: OtpSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        failedAttempts: 2, // Already 2 failures
        operationType: 'login',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpSession;

      mockOtpSessionRepository.findOne.mockResolvedValue(otpSession);
      mockOtpConfigRepository.findOne.mockResolvedValue(otpConfig);

      // The 3rd attempt with wrong code
      const updatedSession = {
        ...otpSession,
        failedAttempts: 3,
      };
      mockOtpSessionRepository.save.mockResolvedValue(
        updatedSession as OtpSession,
      );
      mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Act & Assert
      await expect(
        otpService.verifyOtp(testUser, {
          sessionId: 'session-003',
          otpType: OtpType.EMAIL,
          code: 'WRONG_CODE',
        }),
      ).rejects.toThrow(ForbiddenException);

      // Assert: User account was locked
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 'user-001' },
        expect.objectContaining({
          status: UserStatus.DISABLED,
        }),
      );
    });

    it('应该记录账户锁定审计日志', async () => {
      const otpConfig: OtpConfig = {
        id: 'otp-config-001',
        userId: 'user-001',
        otpType: OtpType.SMS,
        isEnabled: true,
        phoneNumber: '+85212345678',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpConfig;

      const otpSession: OtpSession = {
        id: 'session-004',
        userId: 'user-001',
        otpType: OtpType.SMS,
        otpCode: '654321',
        status: OtpSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        failedAttempts: 2,
        operationType: 'login',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpSession;

      mockOtpSessionRepository.findOne.mockResolvedValue(otpSession);
      mockOtpConfigRepository.findOne.mockResolvedValue(otpConfig);
      mockOtpSessionRepository.save.mockResolvedValue({
        ...otpSession,
        failedAttempts: 3,
      } as OtpSession);
      mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);

      try {
        await otpService.verifyOtp(testUser, {
          sessionId: 'session-004',
          otpType: OtpType.SMS,
          code: 'WRONG',
        });
      } catch (e) {
        // Expected to throw
      }

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_ACCOUNT_LOCKED',
          resourceType: 'User',
          resourceId: 'user-001',
          details: expect.objectContaining({
            reason: 'OTP failed attempts exceeded',
            lockedAt: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('场景3: 验证失败时记录审计日志', () => {
    it('应该在OTP验证失败时记录失败尝试次数', async () => {
      const otpConfig: OtpConfig = {
        id: 'otp-config-001',
        userId: 'user-001',
        otpType: OtpType.EMAIL,
        isEnabled: true,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpConfig;

      const otpSession: OtpSession = {
        id: 'session-005',
        userId: 'user-001',
        otpType: OtpType.EMAIL,
        otpCode: '123456',
        status: OtpSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        failedAttempts: 0,
        operationType: 'login',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtpSession;

      mockOtpSessionRepository.findOne.mockResolvedValue(otpSession);
      mockOtpConfigRepository.findOne.mockResolvedValue(otpConfig);
      mockOtpSessionRepository.save.mockResolvedValue({
        ...otpSession,
        failedAttempts: 1,
      } as OtpSession);

      await expect(
        otpService.verifyOtp(testUser, {
          sessionId: 'session-005',
          otpType: OtpType.EMAIL,
          code: 'WRONG',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'OTP_VERIFY_FAILED',
          details: expect.objectContaining({
            failedAttempts: 1,
          }),
        }),
      );
    });
  });
});
