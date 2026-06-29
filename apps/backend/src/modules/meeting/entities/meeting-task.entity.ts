import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meeting } from './meeting.entity';
import { MeetingRecord } from './meeting-record.entity';

export enum MeetingTaskStatus {
  PENDING = 'pending', // 待接受
  ACCEPTED = 'accepted', // 已接受
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  OVERDUE = 'overdue', // 已逾期
}

export enum MeetingTaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DecisionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('meeting_tasks')
export class MeetingTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id', length: 100, unique: true })
  taskId: string; // 格式: TASK-MTG-{日期}-{序号}

  @Column({ name: 'meeting_id', type: 'uuid', nullable: true })
  meetingId: string;

  @ManyToOne(() => Meeting, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @Column({ name: 'record_id', type: 'uuid', nullable: true })
  recordId: string;

  @ManyToOne(() => MeetingRecord, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'record_id' })
  record: MeetingRecord;

  @Column({ name: 'decision_id', length: 50, nullable: true })
  decisionId: string; // 关联的决策事项ID

  @Column({ name: 'task_title', length: 200 })
  taskTitle: string;

  @Column({ name: 'task_description', type: 'text', nullable: true })
  taskDescription: string;

  @Column({ name: 'responsible_user_id', type: 'uuid' })
  responsibleUserId: string;

  @Column({ name: 'responsible_user_name', length: 100, nullable: true })
  responsibleUserName: string;

  @Column({ name: 'assigned_by_id', type: 'uuid' })
  assignedById: string;

  @Column({ name: 'assigned_by_name', length: 100, nullable: true })
  assignedByName: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: MeetingTaskPriority,
    name: 'priority',
    default: MeetingTaskPriority.MEDIUM,
  })
  priority: MeetingTaskPriority;

  @Column({
    type: 'enum',
    enum: MeetingTaskStatus,
    default: MeetingTaskStatus.PENDING,
  })
  status: MeetingTaskStatus;

  @Column({ name: 'completion_note', type: 'text', nullable: true })
  completionNote: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ name: 'related_students', type: 'jsonb', nullable: true })
  relatedStudents: string[]; // 关联学生ID列表

  @Column({ name: 'escalation_level', type: 'int', default: 1 })
  escalationLevel: number; // 当前升级级别

  @Column({ name: 'escalation_count', type: 'int', default: 0 })
  escalationCount: number; // 升级次数

  @Column({ name: 'last_reminder_at', type: 'timestamptz', nullable: true })
  lastReminderAt: Date;

  @Column({ name: 'defer_reason', type: 'text', nullable: true })
  deferReason: string; // 延期/拒绝原因

  @Column({ name: 'defer_new_due_date', type: 'date', nullable: true })
  deferNewDueDate: Date;

  @Column({ name: 'defer_approved_by', type: 'uuid', nullable: true })
  deferApprovedBy: string;

  @Column({ name: 'defer_approved_at', type: 'timestamptz', nullable: true })
  deferApprovedAt: Date;

  @Column({
    name: 'decision_status',
    type: 'enum',
    enum: DecisionStatus,
    nullable: true,
  })
  decisionStatus: DecisionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
