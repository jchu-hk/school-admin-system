import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum AuditAction {
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_RESTORE = 'user_restore',
  USER_STATUS_CHANGE = 'user_status_change',
  USER_PASSWORD_RESET = 'user_password_reset',
  PERMISSION_CHANGE = 'permission_change',
  OTP_GENERATED = 'otp_generated',
  OTP_VERIFY_SUCCESS = 'otp_verify_success',
  OTP_VERIFY_FAILED = 'otp_verify_failed',
  OTP_BIND_INITIATED = 'otp_bind_initiated',
  OTP_BIND_SUCCESS = 'otp_bind_success',
  OTP_UNBIND_SUCCESS = 'otp_unbind_success',
  PERMISSION_APPROVAL_REQUEST_CREATED = 'permission_approval_request_created',
  PERMISSION_APPROVAL_REQUEST_APPROVED = 'permission_approval_request_approved',
  PERMISSION_APPROVAL_REQUEST_REJECTED = 'permission_approval_request_rejected',
  PERMISSION_APPROVAL_REQUEST_CANCELLED = 'permission_approval_request_cancelled',
}

@Entity('audit_logs')
export class AuditLog {
  @ApiProperty({ description: '日志ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '操作用户ID' })
  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ApiProperty({ description: '操作人ID' })
  @Column({ type: 'uuid', nullable: true })
  operatorId: string;

  @ApiProperty({ description: '操作类型', enum: AuditAction })
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @ApiProperty({ description: '资源类型' })
  @Column({ length: 100, nullable: true })
  resourceType: string;

  @ApiProperty({ description: '资源ID' })
  @Column({ type: 'uuid', nullable: true })
  resourceId: string;

  @ApiProperty({ description: '操作详情' })
  @Column({ type: 'json', nullable: true })
  details: any;

  @ApiProperty({ description: '操作内容描述' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: '操作IP地址' })
  @Column({ length: 50, nullable: true })
  ip: string;

  @ApiProperty({ description: '请求参数' })
  @Column({ type: 'json', nullable: true })
  requestParams: any;

  @ApiProperty({ description: '响应状态' })
  @Column({ type: 'int', nullable: true })
  responseStatus: number;

  @ApiProperty({ description: '操作时间' })
  @CreateDateColumn()
  createdAt: Date;
}
