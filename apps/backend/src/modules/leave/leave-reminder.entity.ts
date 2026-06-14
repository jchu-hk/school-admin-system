import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** 提醒状态 */
export enum ReminderStatus {
  PENDING = 'pending', // 待发送
  SENT = 'sent', // 已发送
  CANCELLED = 'cancelled', // 已取消
}

/** 提醒类型 */
export enum ReminderType {
  LEAVE_APPROVAL = 'leave_approval', // 请假审批通过提醒
  LEAVE_START = 'leave_start', // 请假开始提醒
  LEAVE_END = 'leave_end', // 请假结束提醒
  LEAVE_CHECKIN = 'leave_checkin', // 销假提醒
}

@Entity('leave_reminders')
@Index(['status', 'remindAt']) // 索引用于定时任务查询
export class LeaveReminder {
  @ApiProperty({ description: '提醒ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '关联的请假申请ID' })
  @Column({ type: 'uuid' })
  leaveRequestId: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: '提醒类型', enum: ReminderType })
  @Column({
    type: 'enum',
    enum: ReminderType,
    default: ReminderType.LEAVE_APPROVAL,
  })
  type: ReminderType;

  @ApiProperty({ description: '提醒标题' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '提醒内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '计划提醒时间' })
  @Column({ type: 'timestamp' })
  @Index()
  remindAt: Date;

  @ApiProperty({ description: '提醒状态', enum: ReminderStatus })
  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  @Index()
  status: ReminderStatus;

  @ApiProperty({ description: '实际发送时间' })
  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @ApiProperty({ description: '接收人ID列表(JSON数组)' })
  @Column({ type: 'text', nullable: true })
  recipientIds: string;

  @ApiProperty({ description: '关联通知ID' })
  @Column({ type: 'uuid', nullable: true })
  notificationId: string;

  @ApiProperty({ description: '取消原因' })
  @Column({ type: 'text', nullable: true })
  cancelledReason: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
