import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private maskSensitiveFields(user: User, requester: User): User {
    // 系统管理员和校务主任可以看到完整信息
    if (
      requester.role === UserRole.SYSTEM_ADMIN ||
      requester.role === UserRole.SCHOOL_DIRECTOR ||
      requester.id === user.id // 用户自己可以看到自己的完整信息
    ) {
      return user;
    }

    // 教师角色：只能看到本班学生的部分信息，敏感字段掩码
    if (requester.role === UserRole.TEACHER) {
      if (
        user.className === requester.className &&
        user.role === UserRole.STUDENT
      ) {
        // 本班学生，掩码敏感字段
        return {
          ...user,
          roles: user.roles,
          hkId: user.hkId
            ? user.hkId.replace(/(.{2}).*(.{2})/, '$1****$2')
            : null,
          phone: user.phone
            ? user.phone.replace(/(.{3}).*(.{2})/, '$1****$2')
            : null,
          whatsapp: user.whatsapp
            ? user.whatsapp.replace(/(.{3}).*(.{2})/, '$1****$2')
            : null,
        };
      } else {
        // 非本班学生，所有敏感字段掩码
        return {
          ...user,
          roles: user.roles,
          hkId: user.hkId ? '****' : null,
          phone: user.phone ? '****' : null,
          whatsapp: user.whatsapp ? '****' : null,
          email: user.email ? '****' : null,
        };
      }
    }

    // 家长角色：只能看到自己关联学生的信息，其他用户信息掩码
    if (requester.role === UserRole.PARENT) {
      if (user.id === requester.relatedStudentId) {
        // 自己关联的学生，掩码敏感字段
        return {
          ...user,
          roles: user.roles,
          hkId: user.hkId
            ? user.hkId.replace(/(.{2}).*(.{2})/, '$1****$2')
            : null,
          phone: user.phone
            ? user.phone.replace(/(.{3}).*(.{2})/, '$1****$2')
            : null,
          whatsapp: user.whatsapp
            ? user.whatsapp.replace(/(.{3}).*(.{2})/, '$1****$2')
            : null,
        };
      } else {
        // 其他用户，所有敏感字段掩码
        return {
          ...user,
          roles: user.roles,
          hkId: user.hkId ? '****' : null,
          phone: user.phone ? '****' : null,
          whatsapp: user.whatsapp ? '****' : null,
          email: user.email ? '****' : null,
        };
      }
    }

    // 学生角色：只能看到自己的信息，其他用户信息全部掩码
    if (requester.role === UserRole.STUDENT) {
      return {
        ...user,
        roles: user.roles,
        hkId: user.hkId ? '****' : null,
        phone: user.phone ? '****' : null,
        whatsapp: user.whatsapp ? '****' : null,
        email: user.email ? '****' : null,
      };
    }

    return user;
  }

  async create(
    createUserDto: CreateUserDto,
    createdBy?: string,
  ): Promise<User> {
    // 检查用户名是否存在
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: createUserDto.username },
        { hkId: createUserDto.hkId },
        { phone: createUserDto.phone },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('用户名、身份证、手机号或邮箱已存在');
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // 密码默认90天后过期
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 90);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      passwordExpiresAt,
      createdBy,
    });

    return this.userRepository.save(user);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    role?: string,
    status?: string,
    requester?: User,
  ): Promise<{ users: User[]; total: number }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.relatedStudent', 'relatedStudent');

    if (role) {
      queryBuilder.where('user.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // 掩码敏感字段
    if (requester) {
      const maskedUsers = users.map((user) =>
        this.maskSensitiveFields(user, requester),
      );
      return { users: maskedUsers, total };
    }

    return { users, total };
  }

  async findOne(id: string, requester?: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['relatedStudent'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 掩码敏感字段
    if (requester) {
      return this.maskSensitiveFields(user, requester);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({ where: { username } });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    updatedBy?: string,
  ): Promise<User> {
    const user = await this.findOne(id);

    // 如果修改了密码，重新加密
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
      // 重置密码过期时间
      updateUserDto.passwordExpiresAt = new Date();
      updateUserDto.passwordExpiresAt.setDate(
        updateUserDto.passwordExpiresAt.getDate() + 90,
      );
    }

    Object.assign(user, {
      ...updateUserDto,
      updatedBy,
    });

    return this.userRepository.save(user);
  }

  async remove(id: string, deletedBy?: string): Promise<void> {
    const user = await this.findOne(id);
    user.updatedBy = deletedBy;
    await this.userRepository.save(user);
    await this.userRepository.softDelete(id);
  }

  async restore(id: string, updatedBy?: string): Promise<User> {
    await this.userRepository.restore(id);
    const user = await this.findOne(id);
    user.updatedBy = updatedBy;
    return this.userRepository.save(user);
  }

  async toggleStatus(
    id: string,
    status: UserStatus,
    updatedBy?: string,
  ): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    user.updatedBy = updatedBy;
    return this.userRepository.save(user);
  }

  async resetPassword(
    id: string,
    newPassword: string,
    updatedBy?: string,
  ): Promise<User> {
    const user = await this.findOne(id);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordExpiresAt = new Date();
    user.passwordExpiresAt.setDate(user.passwordExpiresAt.getDate() + 90);
    user.updatedBy = updatedBy;
    return this.userRepository.save(user);
  }

  async updateLoginInfo(id: string, ip: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
