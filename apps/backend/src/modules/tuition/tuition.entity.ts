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

export enum TuitionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  CARD = 'card',
  OTHER = 'other',
}

@Entity('tuition_standards')
export class TuitionStandard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @Column({ name: 'grade_id', nullable: true })
  gradeId: string;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('tuition_payments')
export class TuitionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tuition_standard_id' })
  tuitionStandardId: string;

  @ManyToOne(() => TuitionStandard)
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
  status: TuitionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  arrearsAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

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
