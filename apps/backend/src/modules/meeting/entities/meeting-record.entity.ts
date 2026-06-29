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

export enum RecordStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RecordType {
  MINUTES = 'minutes', // 会议纪要
  DECISIONS = 'decisions', // 决策事项
  ACTION_ITEMS = 'action_items', // 行动项目
  ATTACHMENTS = 'attachments', // 附件
}

@Entity('meeting_records')
export class MeetingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'record_id', length: 100, unique: true })
  recordId: string; // 格式: RECMTG-{meeting_id}-{序号}

  @Column({ name: 'meeting_id', type: 'uuid' })
  meetingId: string;

  @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @Column({ name: 'recorder_id', type: 'uuid' })
  recorderId: string;

  @Column({ name: 'recorder_name', length: 100, nullable: true })
  recorderName: string;

  @Column({
    type: 'enum',
    enum: RecordType,
    name: 'record_type',
    default: RecordType.MINUTES,
  })
  recordType: RecordType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  decisions: any[]; // 决策事项列表

  @Column({ name: 'key_points', type: 'jsonb', nullable: true })
  keyPoints: string[]; // 关键讨论要点

  @Column({ name: 'next_meeting', type: 'jsonb', nullable: true })
  nextMeeting: {
    suggestedDate?: Date;
    suggestedLocation?: string;
    suggestedParticipants?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  attachments: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  }[];

  @Column({
    type: 'enum',
    enum: RecordStatus,
    default: RecordStatus.DRAFT,
  })
  status: RecordStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_by_name', length: 100, nullable: true })
  approvedByName: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'revision_reason', type: 'text', nullable: true })
  revisionReason: string; // 修订原因

  @Column({ name: 'previous_version_id', type: 'uuid', nullable: true })
  previousVersionId: string; // 前一版本ID

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
