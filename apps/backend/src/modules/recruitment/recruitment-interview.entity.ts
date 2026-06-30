import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RecruitmentApplication } from './recruitment-application.entity';

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum InterviewType {
  ONSITE = 'ONSITE',
  ONLINE = 'ONLINE',
}

export enum OverallRecommendation {
  STRONG_RECOMMEND = 'STRONG_RECOMMEND',
  RECOMMEND = 'RECOMMEND',
  NO_COMMENT = 'NO_COMMENT',
  NOT_RECOMMEND = 'NOT_RECOMMEND',
}

@Entity('recruitment_interviews')
export class RecruitmentInterview {
  @ApiProperty({ description: '面试ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '申请ID' })
  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ApiProperty({ description: '申请信息' })
  @ManyToOne(() => RecruitmentApplication)
  @JoinColumn({ name: 'application_id' })
  application: RecruitmentApplication;

  @ApiProperty({ description: '面试时间' })
  @Column({ type: 'timestamp', name: 'interview_date' })
  interviewDate: Date;

  @ApiProperty({ description: '面试时长（分钟）' })
  @Column({ name: 'duration_minutes', default: 60 })
  durationMinutes: number;

  @ApiProperty({ description: '面试形式' })
  @Column({
    type: 'enum',
    enum: InterviewType,
    default: InterviewType.ONSITE,
    name: 'interview_type',
  })
  interviewType: InterviewType;

  @ApiProperty({ description: '面试官ID列表' })
  @Column({ type: 'jsonb', default: [] })
  interviewers: string[];

  @ApiProperty({ description: '面试地点' })
  @Column({ length: 500, nullable: true })
  location: string;

  @ApiProperty({ description: '会议链接（线上面试用）' })
  @Column({ length: 500, nullable: true, name: 'meeting_link' })
  meetingLink: string;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: '面试状态' })
  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED,
  })
  status: InterviewStatus;

  @ApiProperty({ description: '面试评分' })
  @Column({ type: 'jsonb', default: [] })
  scores: InterviewScore[];

  @ApiProperty({ description: '最终建议' })
  @Column({
    type: 'enum',
    enum: OverallRecommendation,
    nullable: true,
    name: 'overall_recommendation',
  })
  overallRecommendation: OverallRecommendation;

  @ApiProperty({ description: '最终备注' })
  @Column({ type: 'text', nullable: true, name: 'final_notes' })
  finalNotes: string;

  @ApiProperty({ description: '取消原因' })
  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  @ApiProperty({ description: '取消人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'cancelled_by' })
  cancelledBy: string;

  @ApiProperty({ description: '取消时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date;

  @ApiProperty({ description: '完成时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @ApiProperty({ description: '完成人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'completed_by' })
  completedBy: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid', nullable: true, name: 'school_id' })
  schoolId: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface InterviewScore {
  interviewerId: string;
  interviewerName?: string;
  scores: ScoreItem[];
  submittedAt: Date;
}

export interface ScoreItem {
  criterion: string;
  score: number;
  comment: string;
}
