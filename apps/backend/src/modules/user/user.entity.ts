import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  SCHOOL_DIRECTOR = 'school_director',
  SCHOOL_STAFF = 'school_staff',
  TEACHER = 'teacher',
  PARENT = 'parent',
  STUDENT = 'student',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISABLED = 'disabled',
}

@Entity('users')
export class User {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '用户名' })
  @Column({ unique: true, length: 50 })
  username: string;

  @ApiProperty({ description: '姓名' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: '香港身份证号' })
  @Column({ length: 20, unique: true, nullable: true })
  hkId: string;

  @ApiProperty({ description: '手机号' })
  @Column({ length: 20, unique: true, nullable: true })
  phone: string;

  @ApiProperty({ description: '邮箱' })
  @Column({ length: 100, unique: true, nullable: true })
  email: string;

  @ApiProperty({ description: 'WhatsApp号' })
  @Column({ length: 20, nullable: true })
  whatsapp: string;

  @ApiProperty({ description: '所属班级' })
  @Column({ length: 50, nullable: true })
  className: string;

  @ApiProperty({ description: '关联学生ID（家长角色使用）' })
  @Column({ type: 'uuid', nullable: true })
  relatedStudentId: string;

  @ApiProperty({ description: '关联学生信息' })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'relatedStudentId' })
  relatedStudent: User;

  @ApiProperty({ description: '用户角色', enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @ApiProperty({ description: '用户状态', enum: UserStatus })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Exclude()
  @Column()
  password: string;

  @Exclude()
  @Column({ nullable: true })
  otpSecret: string;

  @ApiProperty({ description: '是否启用OTP二次认证' })
  @Column({ default: false })
  otpEnabled: boolean;

  @ApiProperty({ description: '密码过期时间' })
  @Column({ type: 'timestamp', nullable: true })
  passwordExpiresAt: Date;

  @ApiProperty({ description: '最后登录时间' })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @ApiProperty({ description: '最后登录IP' })
  @Column({ length: 50, nullable: true })
  lastLoginIp: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: '删除时间（软删除标记）' })
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @ApiProperty({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @ApiProperty({ description: '更新人ID' })
  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;
}
