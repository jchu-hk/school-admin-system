import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere } from 'typeorm';
import {
  SystemConfig,
  SystemLog,
  SystemLogLevel,
  SystemUser,
} from './settings.entity';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  CreateSystemLogDto,
  SystemLogQueryDto,
  CreateSystemUserDto,
  UpdateSystemUserDto,
  SystemUserQueryDto,
} from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepository: Repository<SystemConfig>,
    @InjectRepository(SystemLog)
    private readonly logRepository: Repository<SystemLog>,
    @InjectRepository(SystemUser)
    private readonly userRepository: Repository<SystemUser>,
  ) {}

  // ===== System Config Methods =====

  async createConfig(createDto: CreateSystemConfigDto): Promise<SystemConfig> {
    const existing = await this.configRepository.findOne({
      where: { key: createDto.key },
    });

    if (existing) {
      throw new ConflictException(`配置键 ${createDto.key} 已存在`);
    }

    const config = this.configRepository.create(createDto);
    return this.configRepository.save(config);
  }

  async findAllConfigs(query: {
    page?: number;
    pageSize?: number;
    category?: string;
  }): Promise<{ data: SystemConfig[]; total: number }> {
    const { page = 1, pageSize = 50, category } = query;

    const where: FindOptionsWhere<SystemConfig> = {};
    if (category) {
      where.category = category;
    }

    const [data, total] = await this.configRepository.findAndCount({
      where,
      order: { category: 'ASC', key: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total };
  }

  async findConfigById(id: string): Promise<SystemConfig> {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`配置 ID ${id} 不存在`);
    }
    return config;
  }

  async findConfigByKey(key: string): Promise<SystemConfig> {
    const config = await this.configRepository.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`配置键 ${key} 不存在`);
    }
    return config;
  }

  async updateConfig(
    id: string,
    updateDto: UpdateSystemConfigDto,
    userId?: string,
  ): Promise<SystemConfig> {
    const config = await this.findConfigById(id);
    Object.assign(config, updateDto);
    if (userId) {
      config.updatedBy = userId;
    }
    return this.configRepository.save(config);
  }

  async deleteConfig(id: string): Promise<void> {
    const config = await this.findConfigById(id);
    await this.configRepository.remove(config);
  }

  async getConfigValue(key: string, defaultValue?: string): Promise<string> {
    try {
      const config = await this.findConfigByKey(key);
      return config.value;
    } catch {
      return defaultValue || '';
    }
  }

  // ===== System Log Methods =====

  async createLog(createDto: CreateSystemLogDto): Promise<SystemLog> {
    const log = this.logRepository.create(createDto);
    return this.logRepository.save(log);
  }

  async findAllLogs(query: SystemLogQueryDto): Promise<{
    data: SystemLog[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      page = 1,
      pageSize = 20,
      level,
      module,
      userId,
      startTime,
      endTime,
    } = query;

    const where: FindOptionsWhere<SystemLog> = {};

    if (level) {
      where.level = level;
    }

    if (module) {
      where.module = module;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startTime && endTime) {
      where.createdAt = Between(new Date(startTime), new Date(endTime));
    }

    const [data, total] = await this.logRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findLogById(id: string): Promise<SystemLog> {
    const log = await this.logRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`日志 ID ${id} 不存在`);
    }
    return log;
  }

  async clearOldLogs(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.logRepository.delete({
      createdAt: Between(new Date(0), cutoffDate),
    });

    return result.affected || 0;
  }

  // ===== System User Methods =====

  async createUser(createDto: CreateSystemUserDto): Promise<SystemUser> {
    const existing = await this.userRepository.findOne({
      where: { email: createDto.email },
    });

    if (existing) {
      throw new ConflictException(`邮箱 ${createDto.email} 已存在`);
    }

    const user = this.userRepository.create(createDto as any);
    return this.userRepository.save(user);
  }

  async findAllUsers(query: SystemUserQueryDto): Promise<{
    data: SystemUser[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, keyword, role, status } = query;

    const where: FindOptionsWhere<SystemUser> = {};

    if (keyword) {
      where.username = Like(`%${keyword}%`);
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Remove sensitive fields
    data.forEach((user) => {
      delete user.passwordHash;
    });

    return { data, total, page, pageSize };
  }

  async findUserById(id: string): Promise<SystemUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    delete user.passwordHash;
    return user;
  }

  async updateUser(
    id: string,
    updateDto: UpdateSystemUserDto,
  ): Promise<SystemUser> {
    const user = await this.findUserById(id);
    Object.assign(user, updateDto);
    return this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);
    await this.userRepository.remove(user);
  }

  async updateUserStatus(
    id: string,
    status: 'active' | 'inactive',
  ): Promise<SystemUser> {
    const user = await this.findUserById(id);
    user.status = status;
    return this.userRepository.save(user);
  }

  async recordLogin(userId: string, ipAddress: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });
  }
}
