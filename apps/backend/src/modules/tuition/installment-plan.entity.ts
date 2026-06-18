import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { TuitionPayment } from './tuition-payment.entity';
import { InstallmentSchedule } from './installment-schedule.entity';
import { InstallmentPlanReview } from './installment-review.entity';

export enum InstallmentPlanStatus {
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('installment_plans')
@Index(['tuitionPaymentId'])
@Index(['studentId'])
@Index(['status'])
@Index(['parentId'])
export class InstallmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tuition_payment_id' })
  tuitionPaymentId: string;

  @ManyToOne(() => TuitionPayment)
  @JoinColumn({ name: 'tuition_payment_id' })
  tuitionPayment: TuitionPayment;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'parent_id', type: 'uuid' })
  parentId: string;

  @Column({ name: 'student_name', length: 100, nullable: true })
  studentName: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    name: 'installment_count',
    type: 'int',
  })
  installmentCount: number;

  @Column({
    name: 'installment_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  installmentAmount: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: InstallmentPlanStatus,
    default: InstallmentPlanStatus.PENDING_REVIEW,
  })
  status: InstallmentPlanStatus;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ name: 'review_by', type: 'uuid', nullable: true })
  reviewBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'review_by' })
  reviewer: User;

  @Column({ name: 'review_at', type: 'timestamp', nullable: true })
  reviewAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => InstallmentSchedule, (schedule) => schedule.plan)
  schedules: InstallmentSchedule[];

  @OneToMany(() => InstallmentPlanReview, (review) => review.plan)
  reviews: InstallmentPlanReview[];
}
