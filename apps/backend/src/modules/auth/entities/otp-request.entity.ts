import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';

export enum OtpRequestType {
  RESET = 'reset',
  VERIFY = 'verify',
}

@Entity('otp_requests')
export class OtpRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: 'code_hash', length: 255 })
  codeHash: string;

  @Column({ type: 'enum', enum: OtpRequestType })
  type: OtpRequestType;

  @Column({ default: 0 })
  attempts: number;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
