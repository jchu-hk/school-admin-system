import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { AcademicYear } from '../../student/student.entity';
import { WitnessVerification } from '../../witness/entities/witness.entity';

// ==================== 零用现金报销（F-FIN-002）====================
// 对应 SPEC-SYSTEM-DESIGN §20.3 / DB-SCHEMA §20 / DATA-DICTIONARY §23

export enum PettyCashConfigStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ARCHIVED = 'archived',
}

export enum PettyCashWorkflowStatus {
  DRAFT = 'draft',
  OCRA_PENDING = 'ocra_pending',
  MANUAL_AMOUNT = 'manual_amount',
  WITNESS_REQUIRED = 'witness_required',
  WITNESS_IN_PROGRESS = 'witness_in_progress',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

/** 兼容保留别名（与 workflow_status 同值，见 DB-SCHEMA petty_cash_status_enum） */
export enum PettyCashStatus {
  DRAFT = 'draft',
  OCRA_PENDING = 'ocra_pending',
  MANUAL_AMOUNT = 'manual_amount',
  WITNESS_REQUIRED = 'witness_required',
  WITNESS_IN_PROGRESS = 'witness_in_progress',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

export enum OcrStatus {
  NOT_PERFORMED = 'not_performed',
  OK = 'ok',
  FAILED = 'failed',
  MATCH = 'match',
  MISMATCH = 'mismatch',
}

export enum WitnessLevel {
  SINGLE = 'single',
  DOUBLE = 'double',
  NONE = 'none',
}

export enum PettyCashTxType {
  TOP_UP = 'top_up',
  EXPENSE = 'expense',
}

export enum ReimbursementCategory {
  PRINTING = 'printing',
  STATIONERY = 'stationery',
  TRANSPORT = 'transport',
  BOOKS = 'books',
  MEALS = 'meals',
  UTILITIES = 'utilities',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

// ==================== 备用金配置（petty_cash_configs）====================
@Index(['academicYearId'])
@Entity('petty_cash_configs')
export class PettyCashConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'academic_year_id', type: 'uuid' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  /** 单笔基础限额 HK$3,000 */
  @Column({
    name: 'base_single_limit',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 3000,
  })
  baseSingleLimit: number;

  /** 当年 CPI 指数 */
  @Column({
    name: 'cpi_current',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1.0,
  })
  cpiCurrent: number;

  /** 基准 CPI 指数 */
  @Column({
    name: 'cpi_base',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1.0,
  })
  cpiBase: number;

  /** 实际限额 = base × (cpi_current / cpi_base) */
  @Column({
    name: 'effective_single_limit',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  effectiveSingleLimit: number;

  /** 备用金上限 HK$5,000 */
  @Column({
    name: 'float_cap',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 5000,
  })
  floatCap: number;

  /** 备用金低额警示线 */
  @Column({
    name: 'float_low_threshold',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 500,
  })
  floatLowThreshold: number;

  @Column({
    type: 'enum',
    enum: PettyCashConfigStatus,
    name: 'config_status',
    default: PettyCashConfigStatus.PENDING,
  })
  configStatus: PettyCashConfigStatus;

  @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
  confirmedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'confirmed_by' })
  confirmedByUser: User;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

// ==================== 零用现金报销申请（petty_cash_reimbursements）====================
@Index(['applicantId'])
@Index(['status'])
@Index(['createdAt'])
@Entity('petty_cash_reimbursements')
export class PettyCashReimbursement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 交易编号（PC-YYYYMMDD-NNNN） */
  @Column({ name: 'transaction_no', length: 30, unique: true })
  transactionNo: string;

  @Column({ name: 'applicant_id', type: 'uuid' })
  applicantId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 200 })
  payee: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** 支出类别（printing/stationery/transport/other 等） */
  @Column({ length: 50, nullable: true })
  category: string;

  /** 收据图片 URL */
  @Column({ name: 'receipt_url', length: 500, nullable: true })
  receiptUrl: string;

  /**
   * OCR 结果（ocr_amount / ocr_status: match,mismatch,not_found / original_text）
   * 本次因无 OCR 基础设施仅存图，OCR 字段置 not_performed。
   */
  @Column({ type: 'jsonb', name: 'ocr_result', default: {} })
  ocrResult: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: OcrStatus,
    name: 'ocr_status',
    default: OcrStatus.NOT_PERFORMED,
  })
  ocrStatus: OcrStatus;

  /** 提交时生效的单笔限额快照 */
  @Column({
    name: 'single_limit',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  singleLimit: number;

  /** 提交时备用金余额 */
  @Column({
    name: 'float_balance_before',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  floatBalanceBefore: number;

  /** 见证级别（依据金额与限额） */
  @Column({
    type: 'enum',
    enum: WitnessLevel,
    name: 'witness_level',
    default: WitnessLevel.SINGLE,
  })
  witnessLevel: WitnessLevel;

  @Column({ name: 'witness_verification_id', type: 'uuid', nullable: true })
  witnessVerificationId: string;

  @ManyToOne(() => WitnessVerification, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'witness_verification_id' })
  witnessVerification: WitnessVerification;

  /** 兼容保留状态（与 workflow_status 同值） */
  @Column({
    type: 'enum',
    enum: PettyCashStatus,
    default: PettyCashStatus.DRAFT,
  })
  status: PettyCashStatus;

  @Column({
    type: 'enum',
    enum: PettyCashWorkflowStatus,
    name: 'workflow_status',
    default: PettyCashWorkflowStatus.DRAFT,
  })
  workflowStatus: PettyCashWorkflowStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(
    () => PettyCashTransaction,
    (tx) => tx.reimbursement,
    { cascade: false },
  )
  transactions: PettyCashTransaction[];
}

// ==================== 备用金流水（petty_cash_transactions）====================
@Index(['academicYearId'])
@Index(['reimbursementId'])
@Entity('petty_cash_transactions')
export class PettyCashTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'academic_year_id', type: 'uuid' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ type: 'enum', enum: PettyCashTxType, name: 'tx_type' })
  txType: PettyCashTxType;

  /** 金额（top_up 正，expense 负） */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'reimbursement_id', type: 'uuid', nullable: true })
  reimbursementId: string;

  @ManyToOne(() => PettyCashReimbursement, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'reimbursement_id' })
  reimbursement: PettyCashReimbursement;

  /** 交易后余额 */
  @Column({
    name: 'float_balance_after',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  floatBalanceAfter: number;

  /** 备用金补充单号（衔接 F-FIN-001） */
  @Column({ name: 'reference_no', length: 30, nullable: true })
  referenceNo: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
