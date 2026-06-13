import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum ScholarshipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum DisbursementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DISBURSED = 'disbursed',
  FAILED = 'failed',
}

@Entity('scholarships')
export class Scholarship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'scholarship_type', type: 'varchar', length: 50 })
  scholarshipType: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount' })
  amount: number;

  @Column({ name: 'total_quota', type: 'int', nullable: true })
  totalQuota: number;

  @Column({ name: 'application_start_date', type: 'date' })
  applicationStartDate: Date;

  @Column({ name: 'application_end_date', type: 'date' })
  applicationEndDate: Date;

  @Column({ name: 'disbursement_start_date', type: 'date', nullable: true })
  disbursementStartDate: Date;

  @Column({ name: 'disbursement_end_date', type: 'date', nullable: true })
  disbursementEndDate: Date;

  @Column({
    type: 'enum',
    enum: ScholarshipStatus,
    default: ScholarshipStatus.ACTIVE,
  })
  status: ScholarshipStatus;

  @Column({ name: 'eligible_grades', type: 'simple-array', nullable: true })
  eligibleGrades: string[];

  @Column({ name: 'eligible_classes', type: 'simple-array', nullable: true })
  eligibleClasses: string[];

  @Column({ name: 'requirements', type: 'text', nullable: true })
  requirements: string;

  @Column({ name: 'attachment_url', nullable: true })
  attachmentUrl: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('scholarship_applications')
export class ScholarshipApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'scholarship_id' })
  scholarshipId: string;

  @ManyToOne(() => Scholarship)
  @JoinColumn({ name: 'scholarship_id' })
  scholarship: Scholarship;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', name: 'application_reason', nullable: true })
  applicationReason: string;

  @Column({ name: 'attachment_url', nullable: true })
  attachmentUrl: string;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'approved_amount',
    nullable: true,
  })
  approvedAmount: number;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('scholarship_disbursements')
export class ScholarshipDisbursement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => ScholarshipApplication)
  @JoinColumn({ name: 'application_id' })
  application: ScholarshipApplication;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount' })
  amount: number;

  @Column({
    type: 'enum',
    enum: DisbursementStatus,
    default: DisbursementStatus.PENDING,
  })
  status: DisbursementStatus;

  @Column({ name: 'bank_account', nullable: true })
  bankAccount: string;

  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'recipient_name', nullable: true })
  recipientName: string;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ name: 'disbursed_at', type: 'timestamp', nullable: true })
  disbursedAt: Date;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  @Column({ name: 'processed_by' })
  processedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'processed_by' })
  processor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
