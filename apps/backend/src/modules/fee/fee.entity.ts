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

export enum FeeStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
}

export enum ReductionType {
  SCHOLARSHIP = 'scholarship',
  FINANCIAL_AID = 'financial_aid',
  SIBLING_DISCOUNT = 'sibling_discount',
  EARLY_PAYMENT_DISCOUNT = 'early_payment_discount',
  SPECIAL_DISCOUNT = 'special_discount',
  OTHER = 'other',
}

@Entity('fee_items')
export class FeeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @Column({ name: 'grade_id', nullable: true })
  gradeId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ name: 'school_year', type: 'varchar', length: 20, nullable: true })
  schoolYear: string;

  @Column({ name: 'semester', type: 'varchar', length: 20, nullable: true })
  semester: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_mandatory', default: true })
  isMandatory: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('fee_collections')
export class FeeCollection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fee_item_id' })
  feeItemId: string;

  @ManyToOne(() => FeeItem)
  @JoinColumn({ name: 'fee_item_id' })
  feeItem: FeeItem;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'parent_id' })
  parentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column({
    type: 'enum',
    enum: FeeStatus,
    default: FeeStatus.PENDING,
  })
  status: FeeStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  reductionAmount: number;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

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

@Entity('fee_reductions')
export class FeeReduction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fee_collection_id' })
  feeCollectionId: string;

  @ManyToOne(() => FeeCollection)
  @JoinColumn({ name: 'fee_collection_id' })
  feeCollection: FeeCollection;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({
    type: 'enum',
    enum: ReductionType,
    name: 'reduction_type',
  })
  reductionType: ReductionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
