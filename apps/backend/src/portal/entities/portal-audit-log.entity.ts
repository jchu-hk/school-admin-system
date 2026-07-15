import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 门户审计日志事件类型
 */
export enum PortalAuditEventType {
  LOGIN = 'LOGIN',
  PROFILE_VIEW = 'PROFILE_VIEW',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  LEAVE_CREATE = 'LEAVE_CREATE',
  LEAVE_CANCEL = 'LEAVE_CANCEL',
  QR_GENERATE = 'QR_GENERATE',
  QR_SCAN = 'QR_SCAN',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  GRADE_VIEW = 'GRADE_VIEW',
  ATTENDANCE_VIEW = 'ATTENDANCE_VIEW',
  PAYMENT_OPERATE = 'PAYMENT_OPERATE',
  NOTICE_VIEW = 'NOTICE_VIEW',
}

/**
 * 门户审计日志实体
 * 记录所有学生/家长门户操作，符合 PDPO 审计追踪要求
 * 对应 DB-SCHEMA.md 中的 portal_audit_logs 表
 */
@Entity('portal_audit_logs')
@Index(['actorId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['result'])
export class PortalAuditLog {
  @ApiProperty({ description: '日志ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: '事件类型',
    enum: PortalAuditEventType,
  })
  @Column({ name: 'event_type', length: 50 })
  eventType: PortalAuditEventType;

  @ApiProperty({ description: '操作人ID' })
  @Column({ name: 'actor_id', type: 'uuid' })
  actorId: string;

  @ApiProperty({ description: '操作人角色 (student/parent/staff)' })
  @Column({ name: 'actor_role', length: 20 })
  actorRole: string;

  @ApiProperty({ description: '目标对象ID' })
  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId: string;

  @ApiProperty({ description: '目标类型 (students/leaves/qr_codes 等)' })
  @Column({ name: 'target_type', length: 50, nullable: true })
  targetType: string;

  @ApiProperty({ description: '操作类型' })
  @Column({ length: 20 })
  action: string;

  @ApiProperty({ description: '变更详情（脱敏后）' })
  @Column({ name: 'changes', type: 'jsonb', nullable: true })
  changes: Record<string, any>;

  @ApiProperty({ description: 'IP地址' })
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @ApiProperty({ description: 'User Agent' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @ApiProperty({ description: '结果 (SUCCESS/FAILURE/DENIED)' })
  @Column({ length: 10 })
  result: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
