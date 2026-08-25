import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/user.entity';

/** 同意类型（consent_type） */
export enum ConsentType {
  DATA_PROCESSING = 'data_processing', // 数据处理同意
  COMMUNICATION = 'communication', // 家校沟通/通知同意
  HEALTH_DATA = 'health_data', // 健康资料处理同意
  THIRD_PARTY_SHARING = 'third_party_sharing', // 第三方共享同意
  EMERGENCY_CONTACT = 'emergency_contact', // 紧急联系人使用同意
  SYNC_PUSH = 'sync_push', // 外部系统同步推送同意
}

/** 同意状态（consent_status） */
export enum ConsentStatus {
  GRANTED = 'granted', // 已同意
  REVOKED = 'revoked', // 已撤回
  EXPIRED = 'expired', // 已过期
}

/** 同意签署渠道 */
export enum ConsentChannel {
  PORTAL = 'portal', // 门户在线
  PAPER = 'paper', // 纸质签署
  PHONE = 'phone', // 电话确认
  MANUAL = 'manual', // 人工登记
}

/** 由谁签署 */
export enum ConsentGranter {
  SELF = 'self', // 本人
  PARENT_GUARDIAN = 'parent_guardian', // 家长/监护人
}

/**
 * 同意记录（consent_records）
 * F-COMP-001 同意管理：记录资料当事人对个人资料处理/共享/通知的同意、撤回与过期状态。
 */
@Entity('consent_records')
export class ConsentRecord {
  @ApiProperty({ description: '同意记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 资料当事人（subject）—— 只读引用既有 User */
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subject_id', referencedColumnName: 'id' })
  subject: User;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ApiProperty({ enum: ConsentType, description: '同意类型' })
  @Column({ type: 'enum', enum: ConsentType, name: 'consent_type' })
  consentType: ConsentType;

  @ApiProperty({ enum: ConsentStatus, description: '同意状态' })
  @Column({ type: 'enum', enum: ConsentStatus, default: ConsentStatus.GRANTED })
  status: ConsentStatus;

  @ApiProperty({ enum: ConsentGranter, description: '签署人' })
  @Column({ type: 'enum', enum: ConsentGranter, default: ConsentGranter.SELF, name: 'granter' })
  granter: ConsentGranter;

  @ApiProperty({ enum: ConsentChannel, description: '签署渠道' })
  @Column({ type: 'enum', enum: ConsentChannel, default: ConsentChannel.PORTAL, name: 'channel' })
  channel: ConsentChannel;

  @ApiProperty({ description: '同意签署时间' })
  @Column({ type: 'timestamptz', name: 'granted_at' })
  grantedAt: Date;

  @ApiProperty({ description: '撤回时间' })
  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt: Date;

  @ApiProperty({ description: '过期时间（可选）' })
  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt: Date;

  @ApiProperty({ description: '版本号（每次同意递增，便于追溯历史版本）' })
  @Column({ name: 'version', default: 1 })
  version: number;

  @ApiProperty({ description: '关联学生（家长代签时，如适用）' })
  @Column({ name: 'student_id', type: 'uuid', nullable: true })
  studentId: string;

  @ApiProperty({ description: '同意文本/条款摘要' })
  @Column({ type: 'text', name: 'consent_text', nullable: true })
  consentText: string;

  /** 签署操作人（系统记录） */
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy: User;

  @Column({ name: 'recorded_by_id', type: 'uuid', nullable: true })
  recordedById: string;

  @ApiProperty({ description: '所属学校' })
  @Column({ length: 100, name: 'school_id' })
  schoolId: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
