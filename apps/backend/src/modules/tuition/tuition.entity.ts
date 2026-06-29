import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum TuitionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
  EXEMPTED = 'exempted',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  CARD = 'card',
  OTHER = 'other',
}

export enum SubsidyType {
  NONE = 'none',
  FULL = 'full',
  PARTIAL = 'partial',
  EXEMPTED = 'exempted',
}

// Alias for backward compatibility
export const TuitionPaymentStatus = TuitionStatus;

export enum SubStatus {
  NONE = 'none',
  INSTALLMENT_PLAN = 'installment_plan',
  OVERDUE = 'overdue',
  DISPUTED = 'disputed',
  PAUSED = 'paused',
}

@Entity('tuition_standards')
export class TuitionStandard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @Column({ name: 'grade_id', nullable: true })
  gradeId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  grade: string;

  @Column({ name: 'academic_year', length: 20, nullable: true })
  academicYear: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  period: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => TuitionPayment, (payment) => payment.tuitionStandard)
  payments: TuitionPayment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  static readonly DEFAULT_FULL_SUBSIDY = 550;
}

@Entity('tuition_payments')
export class TuitionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tuition_standard_id' })
  tuitionStandardId: string;

  @ManyToOne(() => TuitionStandard, (standard) => standard.payments)
  @JoinColumn({ name: 'tuition_standard_id' })
  tuitionStandard: TuitionStandard;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'parent_id' })
  parentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column({
    type: 'enum',
    enum: TuitionStatus,
    default: TuitionStatus.PENDING,
  })
  status: TuitionStatus | string;

  @Column({ name: 'totalAmount', type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    name: 'paidAmount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  paidAmount: number;

  @Column({
    name: 'arrearsAmount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  arrearsAmount: number;

  @Column({
    name: 'discountAmount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  discountAmount: number;

  @Column({
    enum: PaymentMethod,
    name: 'payment_method',
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({
    name: 'transaction_no',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  transactionNo: string;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ name: 'payment_deadline', type: 'date', nullable: true })
  paymentDeadline: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  // Virtual fields (not in DB, populated by service)
  studentName?: string;
  grade?: string;
  className?: string;
  academicYear?: string;

  // Subsidy fields
  @Column({ name: 'subsidy_type', type: 'varchar', length: 50, nullable: true })
  subsidyType: string;

  @Column({
    name: 'subsidy_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  subsidyAmount: number;

  @Column({ name: 'subsidy_remark', type: 'text', nullable: true })
  subsidyRemark: string;

  // Dispute fields
  @Column({ name: 'dispute_reason', type: 'text', nullable: true })
  disputeReason: string;

  @Column({ name: 'dispute_resolved_at', type: 'timestamp', nullable: true })
  disputeResolvedAt: Date;

  @Column({
    name: 'dispute_resolution',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  disputeResolution: string;

  // Sub status fields
  @Column({ name: 'sub_status', type: 'varchar', length: 50, nullable: true })
  subStatus: string;

  // Virtual relation (not persisted, populated by service)
  installmentPlan?: any;

  @Column({ name: 'installment_plan_id', type: 'uuid', nullable: true })
  installmentPlanId: string;

  // Overdue tracking
  @Column({ name: 'overdue_days', type: 'int', default: 0 })
  overdueDays: number;

  @Column({ name: 'last_overdue_check_at', type: 'timestamp', nullable: true })
  lastOverdueCheckAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('tuition_arrears')
export class TuitionArrears {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'tuition_payment_id' })
  tuitionPaymentId: string;

  @ManyToOne(() => TuitionPayment)
  @JoinColumn({ name: 'tuition_payment_id' })
  tuitionPayment: TuitionPayment;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'overdue_days', default: 0 })
  overdueDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  lateFee: number;

  @Column({ name: 'is_reminded', default: false })
  isReminded: boolean;

  @Column({ name: 'last_reminder_at', type: 'timestamp', nullable: true })
  lastReminderAt: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
