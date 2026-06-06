import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

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

    return { users, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['relatedStudent'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
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

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
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
