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
  // 家长查询模块
  INQUIRY_CREATE = 'inquiry_create',
  INQUIRY_UPDATE = 'inquiry_update',
  INQUIRY_REPLY = 'inquiry_reply',
  INQUIRY_ASSIGN = 'inquiry_assign',
  INQUIRY_CLOSE = 'inquiry_close',
  INQUIRY_SATISFACTION = 'inquiry_satisfaction',
  INQUIRY_TEMPLATE_CREATE = 'inquiry_template_create',
  // 请假申请模块
  LEAVE_CREATE = 'leave_create',
  LEAVE_UPDATE = 'leave_update',
  LEAVE_APPROVE = 'leave_approve',
  LEAVE_REJECT = 'leave_reject',
  LEAVE_CANCEL = 'leave_cancel',
  LEAVE_CHECKIN = 'leave_checkin',
  // 多渠道通知模块
  NOTIFICATION_SEND = 'notification_send',
  NOTIFICATION_TEMPLATE_CREATE = 'notification_template_create',
  NOTIFICATION_TEMPLATE_UPDATE = 'notification_template_update',
  // OTP模块
  OTP_GENERATED = 'otp_generated',
  OTP_VERIFY_SUCCESS = 'otp_verify_success',
  OTP_VERIFY_FAILED = 'otp_verify_failed',
  OTP_BIND_INITIATED = 'otp_bind_initiated',
  OTP_BIND_SUCCESS = 'otp_bind_success',
  OTP_UNBIND_SUCCESS = 'otp_unbind_success',
  // 用户生命周期模块
  USER_EXPIRY_WARNING_SENT = 'user_expiry_warning_sent',
  USER_DEPARTURE = 'user_departure',
  USER_GRADUATION = 'user_graduation',
  // 学生档案模块
  STUDENT_PROFILE_CREATE = 'student_profile_create',
  STUDENT_PROFILE_UPDATE = 'student_profile_update',
  STUDENT_PROFILE_ARCHIVE = 'student_profile_archive',
  // 权限审批模块
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

  @ApiProperty({ description: '操作人ID' })
  @Column({ name: 'operatorId', type: 'uuid', nullable: true })
  operatorId: string;

  @ApiProperty({ description: '操作类型' })
  @Column({ type: 'varchar', length: 50 })
  action: string;

  @ApiProperty({ description: '操作内容描述' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: '操作IP地址' })
  @Column({ length: 50, nullable: true })
  ip: string;

  @ApiProperty({ description: '请求参数' })
  @Column({ name: 'requestParams', type: 'json', nullable: true })
  requestParams: any;

  @ApiProperty({ description: '响应状态' })
  @Column({ name: 'responseStatus', type: 'int', nullable: true })
  responseStatus: number;

  @ApiProperty({ description: '资源类型' })
  @Column({ name: 'resourceType', length: 50, nullable: true })
  resourceType: string;

  @ApiProperty({ description: '资源ID' })
  @Column({ name: 'resourceId', type: 'uuid', nullable: true })
  resourceId: string;

  @ApiProperty({ description: '详情' })
  @Column({ name: 'details', type: 'json', nullable: true })
  details: any;

  @ApiProperty({ description: '操作时间' })
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
