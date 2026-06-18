import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { TuitionStandard } from './tuition-standard.entity';
import { InstallmentPlan } from './installment-plan.entity';

@Entity('tuition_payments')
@Index(['status'])
export class TuitionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tuition_standard_id' })
  standardId: string;

  @ManyToOne(() => TuitionStandard, (standard) => standard.payments)
  @JoinColumn({ name: 'tuition_standard_id' })
  standard: TuitionStandard;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'parent_id', type: 'uuid' })
  parentId: string;

  // Legacy fields (no @Column - not in DB schema, used by tuition service)
  studentName?: string;
  grade?: string;
  className?: string;
  academicYear?: string;

  @Column({ name: 'totalAmount', type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'paidAmount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'arrearsAmount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  arrearsAmount: number;

  @Column({ name: 'discountAmount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  discountAmount: number;

  @Column({ name: 'payment_method', length: 50, nullable: true })
  paymentMethod: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ name: 'transaction_no', length: 100, nullable: true })
  transactionNo: string;

  @Column({ name: 'operator_id', type: 'uuid', nullable: true })
  operatorId: string;

  @Column({ name: 'payment_deadline', type: 'date', nullable: true })
  paymentDeadline: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'partial', 'overdue'],
    default: 'pending',
  })
  status: 'pending' | 'paid' | 'partial' | 'overdue';

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // ============ Installment Fields (Issue #98) ============
  @Column({
    name: 'sub_status',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  subStatus: string;

  @Column({ name: 'installment_plan_id', type: 'uuid', nullable: true })
  installmentPlanId: string;

  @OneToOne(() => InstallmentPlan, (plan) => plan.tuitionPayment)
  @JoinColumn({ name: 'installment_plan_id' })
  installmentPlan: InstallmentPlan;

  @Column({ name: 'created_at', type: 'timestamp', default: 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: 'NOW()' })
  updatedAt: Date;
}
