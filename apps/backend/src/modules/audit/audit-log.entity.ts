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
}

@Entity('audit_logs')
export class AuditLog {
  @ApiProperty({ description: '日志ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '操作人ID' })
  @Column({ type: 'uuid', nullable: true })
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
  @Column({ type: 'json', nullable: true })
  requestParams: any;

  @ApiProperty({ description: '响应状态' })
  @Column({ type: 'int', nullable: true })
  responseStatus: number;

  @ApiProperty({ description: '操作时间' })
  @CreateDateColumn()
  createdAt: Date;
}
