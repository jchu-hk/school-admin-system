import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MeetingType {
  MANAGEMENT = 'management', // 校务会议
  ACADEMIC = 'academic', // 教学会议
  PARENTS = 'parents', // 家长会
  EMERGENCY = 'emergency', // 紧急会议
  COMMITTEE = 'committee', // 委员会
  OTHER = 'other',
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled', // 已安排
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
}

export enum RecurringPattern {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly', // 每两周
  MONTHLY = 'monthly',
}

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meeting_id', length: 50, unique: true })
  meetingId: string; // 格式: MTG-{年份}{月份}{日}-{序号}

  @Column({ name: 'meeting_title', length: 200 })
  meetingTitle: string;

  @Column({
    type: 'enum',
    enum: MeetingType,
    name: 'meeting_type',
    default: MeetingType.MANAGEMENT,
  })
  meetingType: MeetingType;

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.SCHEDULED,
  })
  status: MeetingStatus;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ length: 200 })
  location: string;

  @Column({ name: 'is_online', default: false })
  isOnline: boolean;

  @Column({ type: 'text', nullable: true })
  agenda: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'organizer_id', type: 'uuid' })
  organizerId: string;

  @Column({ name: 'organizer_name', length: 100, nullable: true })
  organizerName: string;

  @Column({
    name: 'recurring_pattern',
    type: 'enum',
    enum: RecurringPattern,
    default: RecurringPattern.NONE,
  })
  recurringPattern: RecurringPattern;

  @Column({ name: 'recurring_id', type: 'uuid', nullable: true })
  recurringId: string; // 周期性会议关联ID

  @Column({ name: 'recurring_end_date', type: 'date', nullable: true })
  recurringEndDate: Date; // 周期性会议结束日期

  @Column({ name: 'recurring_count', type: 'int', default: 0 })
  recurringCount: number; // 已生成场次数量

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'is_exception', default: false })
  isException: boolean; // 是否为例外日期（周期性会议的例外）

  @Column({ name: 'parent_meeting_id', type: 'uuid', nullable: true })
  parentMeetingId: string; // 例外日期对应的原会议

  @Column({ type: 'uuid', nullable: true })
  schoolId: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
