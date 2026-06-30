import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ActivityType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  NOTE_ADDED = 'NOTE_ADDED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_CANCELLED = 'INTERVIEW_CANCELLED',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  SCORE_SUBMITTED = 'SCORE_SUBMITTED',
  OFFER_SENT = 'OFFER_SENT',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_DECLINED = 'OFFER_DECLINED',
}

@Entity('recruitment_activity_logs')
export class RecruitmentActivityLog {
  @ApiProperty({ description: '活动日志ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '申请ID' })
  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ApiProperty({ description: '活动类型' })
  @Column({
    type: 'enum',
    enum: ActivityType,
    name: 'activity_type',
  })
  activityType: ActivityType;

  @ApiProperty({ description: '操作人' })
  @Column({ length: 100, nullable: true, name: 'performed_by' })
  performedBy: string;

  @ApiProperty({ description: '描述' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: '旧状态' })
  @Column({ length: 50, nullable: true, name: 'old_value' })
  oldValue: string;

  @ApiProperty({ description: '新状态' })
  @Column({ length: 50, nullable: true, name: 'new_value' })
  newValue: string;

  @ApiProperty({ description: '附加数据' })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
