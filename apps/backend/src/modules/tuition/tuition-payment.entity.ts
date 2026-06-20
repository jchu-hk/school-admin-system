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

// ============ AC-02/AC-03: Sub Status for tracking overdue and disputed ============
export enum SubStatus {
  NONE = 'none',
  INSTALLMENT_PLAN = 'installment_plan', // 分期中
  OVERDUE = 'overdue',                    // 逾期
  DISPUTED = 'disputed',                  // 争议中
  PAUSED = 'paused',                      // 暂停催款
}

export enum TuitionPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
  EXEMPTED = 'exempted', // AC-01:豁免状态
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  CARD = 'card',
  OTHER = 'other',
}

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

  // ============ AC-01: Tuition Status with EXEMPTED ============
  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'partial', 'overdue', 'exempted'],
    default: 'pending',
  })
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'exempted' | 'waived';

  // ============ AC-01: Subsidy/Exemption Fields ============
  @Column({
    name: 'subsidy_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  subsidyType: string;

  @Column({
    name: 'subsidy_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  subsidyAmount: number;

  @Column({
    name: 'subsidy_remark',
    type: 'text',
    nullable: true,
  })
  subsidyRemark: string;

  // ============ AC-03: Dispute Fields ============
  @Column({
    name: 'dispute_reason',
    type: 'text',
    nullable: true,
  })
  disputeReason: string;

  @Column({
    name: 'dispute_resolved_at',
    type: 'timestamp',
    nullable: true,
  })
  disputeResolvedAt: Date;

  @Column({
    name: 'dispute_resolution',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  disputeResolution: string;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // ============ AC-02/AC-03: Installment and Sub-Status Fields ============
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

  // ============ AC-02: Overdue Tracking ============
  @Column({
    name: 'overdue_days',
    type: 'int',
    default: 0,
  })
  overdueDays: number;

  @Column({
    name: 'last_overdue_check_at',
    type: 'timestamp',
    nullable: true,
  })
  lastOverdueCheckAt: Date;

  @Column({ name: 'created_at', type: 'timestamp', default: 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: 'NOW()' })
  updatedAt: Date;
}
