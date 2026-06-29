import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User, UserRole, UserStatus } from './user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUser: User = {
    id: 'test-id',
    username: 'testuser',
    name: 'Test User',
    hkId: 'A123456(7)',
    phone: '91234567',
    email: 'test@example.com',
    whatsapp: '91234567',
    className: 'P1A',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    password: 'hashed-password',
    otpEnabled: false,
    passwordExpiresAt: new Date('2026-12-31'),
    lastLoginAt: new Date(),
    lastLoginIp: '127.0.0.1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    updatedBy: 'admin-id',
    relatedStudentId: null,
    relatedStudent: null,
    roles: [{ name: UserRole.STUDENT }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        username: 'newuser',
        password: 'NewPass123!',
        name: 'New User',
        hkId: 'A123456(7)',
        phone: '91234568',
        email: 'newuser@example.com',
        role: UserRole.STUDENT,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto, 'admin-id');

      expect(result).toBeDefined();
      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error if username already exists', async () => {
      const createUserDto = {
        username: 'testuser',
        password: 'NewPass123!',
        name: 'New User',
        email: 'new@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto, 'admin-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: [mockUser],
        total: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('test-id');

      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update user password', async () => {
      const updateUserDto = {
        password: 'NewPassword123!',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.update('test-id', updateUserDto, 'admin-id');

      expect(result).toBeDefined();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('toggleStatus', () => {
    it('should toggle user status', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        status: UserStatus.DISABLED,
      });

      const result = await service.toggleStatus(
        'test-id',
        UserStatus.DISABLED,
        'admin-id',
      );

      expect(result.status).toBe(UserStatus.DISABLED);
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);

      const result = await service.validatePassword(
        'Password123!',
        hashedPassword,
      );

      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);

      const result = await service.validatePassword(
        'WrongPassword123!',
        hashedPassword,
      );

      expect(result).toBe(false);
    });
  });

  describe('getClasses', () => {
    it('should return unique class names', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { className: 'P1A' },
          { className: 'P2A' },
          { className: 'P1A' }, // duplicate
        ]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getClasses();

      expect(result).toEqual(['P1A', 'P2A']);
    });
  });
});
