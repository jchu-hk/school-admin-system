import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Scholarship } from './scholarship.entity';

@Entity('scholarship_applications')
@Index(['scholarshipId', 'studentId'])
@Index(['status'])
export class ScholarshipApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'scholarship_id' })
  scholarshipId: string;

  @ManyToOne(() => Scholarship, (s) => s.applications)
  @JoinColumn({ name: 'scholarship_id' })
  scholarship: Scholarship;

  @Column({ name: 'student_id' })
  studentId: string;

  /** 申请状态: draft/pending/under_review/approved/rejected */
  @Column({
    type: 'enum',
    enum: ['draft', 'pending', 'under_review', 'approved', 'rejected'],
    default: 'draft',
  })
  status: 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected';

  @Column({ name: 'application_reason', type: 'text', nullable: true })
  applicationReason: string;

  @Column({
    name: 'attachment_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  attachmentUrl: string;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment: string;

  @Column({
    name: 'approved_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  approvedAmount: number;

  @Column({ name: 'created_by', length: 100 })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
