import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';

export enum OtpType {
  SMS = 'sms',
  EMAIL = 'email',
  GOOGLE_AUTHENTICATOR = 'google_authenticator',
  UKEY = 'ukey',
}

export enum OtpSessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  USED = 'used',
}

@Entity('otp_configs')
export class OtpConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: OtpType,
    name: 'otp_type',
  })
  otpType: OtpType;

  @Column({ name: 'is_enabled', default: false })
  isEnabled: boolean;

  @Column({ name: 'secret', nullable: true })
  secret: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'email', nullable: true })
  email: string;

  @Column({ name: 'ukey_id', nullable: true })
  ukeyId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('otp_sessions')
export class OtpSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'otp_code', nullable: true })
  otpCode: string;

  @Column({
    type: 'enum',
    enum: OtpType,
    name: 'otp_type',
  })
  otpType: OtpType;

  @Column({
    type: 'enum',
    enum: OtpSessionStatus,
    default: OtpSessionStatus.ACTIVE,
  })
  status: OtpSessionStatus;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'failed_attempts', default: 0 })
  failedAttempts: number;

  @Column({ name: 'operation_type' })
  operationType: string;

  @Column({ name: 'operation_details', type: 'json', nullable: true })
  operationDetails: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('otp_trusted_sessions')
export class OtpTrustedSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
