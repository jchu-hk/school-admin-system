import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { GradeRecord } from './grade-record.entity';

export enum ReviewAction {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  REVOKE = 'revoke',
  RETURN = 'return',
}

export enum ReviewLevel {
  TEACHER = 1,
  HEAD_TEACHER = 2,
  PRINCIPAL = 3,
}

@Entity('grade_reviews')
export class GradeReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'grade_record_id' })
  gradeRecordId: string;

  @ManyToOne(() => GradeRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grade_record_id' })
  gradeRecord: GradeRecord;

  @Column({ name: 'reviewer_id' })
  reviewerId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ type: 'enum', enum: ReviewAction })
  action: ReviewAction;

  @Column({ type: 'enum', enum: ReviewLevel })
  level: ReviewLevel;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', default: {} })
  previousData: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  newData: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;
}
