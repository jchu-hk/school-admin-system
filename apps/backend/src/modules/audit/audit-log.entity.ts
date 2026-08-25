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
  LEAVE_APPLY = 'leave_apply',
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
  // 双人见证模块（F-COMP-002）
  WITNESS_TRIGGERED = 'witness_triggered',
  WITNESS_APPROVED_STEP = 'witness_approved_step',
  WITNESS_REJECTED = 'witness_rejected',
  WITNESS_COMPLETED = 'witness_completed',
  WITNESS_ESCALATED = 'witness_escalated',
  WITNESS_CANCELLED = 'witness_cancelled',
  WITNESS_2FA_FAILED = 'witness_2fa_failed',
  // 合规模块 F-COMP-001（跨域 PDPO）
  COMPLIANCE_CHECK_ALLOWED = 'compliance_check_allowed',
  COMPLIANCE_CHECK_DENIED = 'compliance_check_denied',
  DAR_SUBMITTED = 'dar_submitted',
  DAR_REVIEWED = 'dar_reviewed',
  DAR_APPROVED = 'dar_approved',
  DAR_REJECTED = 'dar_rejected',
  DAR_COMPLETED = 'dar_completed',
  DAR_WITHDRAWN = 'dar_withdrawn',
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_REVOKED = 'consent_revoked',
  CONSENT_EXPIRED = 'consent_expired',
  // 收生管理 - SSPA 中一自行分配（F-ADM-001）
  SSPA_BATCH_CREATED = 'sspa_batch_created',
  SSPA_APPLICATION_CREATED = 'sspa_application_created',
  SSPA_APPLICATION_UPDATED = 'sspa_application_updated',
  SSPA_SCORE_ADDED = 'sspa_score_added',
  SSPA_RESULT_ANNOUNCED = 'sspa_result_announced',
  SSPA_OFFER_CONFIRMED = 'sspa_offer_confirmed',
  // 收生管理 - JUPAS 大学联招（F-ADM-002）
  JUPAS_APP_CREATED = 'jupas_app_created',
  JUPAS_APP_UPDATED = 'jupas_app_updated',
  JUPAS_CHOICE_UPDATED = 'jupas_choice_updated',
  JUPAS_LETTER_CREATED = 'jupas_letter_created',
  JUPAS_LETTER_UPDATED = 'jupas_letter_updated',
  JUPAS_LETTER_SUBMITTED = 'jupas_letter_submitted',
  JUPAS_APPEAL_FILED = 'jupas_appeal_filed',
  JUPAS_APPEAL_RESOLVED = 'jupas_appeal_resolved',
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
