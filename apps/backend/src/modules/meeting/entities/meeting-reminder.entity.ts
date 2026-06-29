import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ReminderSourceType {
  MEETING = 'meeting',
  TASK = 'task',
  DECISION = 'decision',
}

export enum ReminderTriggerType {
  MEETING_24H = 'meeting_24h',
  MEETING_1H = 'meeting_1h',
  TASK_DUE_DATE = 'task_due_date',
  TASK_OVERDUE = 'task_overdue',
  TASK_ESCALATION_L2 = 'task_escalation_l2',
  TASK_ESCALATION_L3 = 'task_escalation_l3',
  TASK_ESCALATION_L4 = 'task_escalation_l4',
  DECISION_3DAYS = 'decision_3days',
  DECISION_OVERDUE = 'decision_overdue',
  RECURRING_GENERATED = 'recurring_generated',
}

export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NotificationChannel {
  APP_PUSH = 'app_push',
  EMAIL = 'email',
  SMS = 'sms',
}

@Entity('meeting_reminders')
@Index(['sourceType', 'sourceId'])
@Index(['recipientId'])
@Index(['status', 'triggerTime'])
@Index(['sourceType', 'sourceId', 'recipientId', 'triggerType'], {
  unique: true,
})
export class MeetingReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reminder_id', length: 50, unique: true })
  reminderId: string; // 格式: REM-{类型}-{日期}-{序号}

  @Column({
    type: 'enum',
    enum: ReminderSourceType,
    name: 'source_type',
  })
  sourceType: ReminderSourceType;

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId: string;

  @Column({ name: 'source_title', length: 200, nullable: true })
  sourceTitle: string;

  @Column({ name: 'meeting_id', type: 'uuid', nullable: true })
  meetingId: string;

  @Column({
    type: 'enum',
    enum: ReminderTriggerType,
    name: 'trigger_type',
  })
  triggerType: ReminderTriggerType;

  @Column({ name: 'trigger_time', type: 'timestamptz' })
  triggerTime: Date;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @Column({ name: 'recipient_name', length: 100, nullable: true })
  recipientName: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    name: 'channel',
    array: true,
    default: '{}',
  })
  channels: NotificationChannel[];

  @Column({ name: 'notification_title', length: 200 })
  notificationTitle: string;

  @Column({ name: 'notification_body', type: 'text' })
  notificationBody: string;

  @Column({ name: 'meeting_context', type: 'text', nullable: true })
  meetingContext: string;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  status: ReminderStatus;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date;

  @Column({ name: 'sent_channels', type: 'jsonb', nullable: true })
  sentChannels: {
    channel: NotificationChannel;
    status: 'success' | 'failed';
    sentAt: Date;
    errorMessage?: string;
  }[];

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'escalation_level', type: 'int', default: 1 })
  escalationLevel: number;

  @Column({ name: 'escalation_notified', type: 'jsonb', nullable: true })
  escalationNotified: { id: string; name: string }[];

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
