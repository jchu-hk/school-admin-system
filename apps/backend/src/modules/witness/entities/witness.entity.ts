import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/user.entity';

/**
 * 触发场景（witness_type）
 * 对应 DB-SCHEMA §17 witness_verifications.witness_type
 */
export enum WitnessType {
  CASH_RECEIPT = 'cash_receipt', // 现金收取（1 员工 + 1 见证人）
  CASH_PAYMENT = 'cash_payment', // 现金支付 >HK$500（2 授权员工）
  PETTY_CASH = 'petty_cash', // 备用金补充（2 授权员工）
  SAFE_OPEN = 'safe_open', // 保险箱开启（2 授权员工）
  CHEQUE_SIGN = 'cheque_sign', // 支票签署（2 授权签署人）
}

/**
 * 状态机（witness_status）
 * SD §17.5：TRIGGERED → AWAIT_FIRST → AWAIT_SECOND → COMPLETED / REJECTED
 */
export enum WitnessStatus {
  TRIGGERED = 'triggered',
  AWAIT_FIRST = 'await_first',
  AWAIT_SECOND = 'await_second',
  COMPLETED = 'completed',
  ESCALATED = 'escalated',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/** 见证步骤状态（step_status） */
export enum WitnessStepStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('witness_verifications')
export class WitnessVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: WitnessType, name: 'witness_type' })
  witnessType: WitnessType;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'amount', nullable: true })
  amount: string;

  @Column({ length: 3, default: 'HKD', name: 'currency' })
  currency: string;

  @Column({ length: 100, name: 'business_ref', nullable: true })
  businessRef: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ name: 'requester_id' })
  requesterId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'witness_1_id' })
  witness1: User;

  @Column({ name: 'witness_1_id', type: 'uuid', nullable: true })
  witness1Id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'witness_2_id' })
  witness2: User;

  @Column({ name: 'witness_2_id', type: 'uuid', nullable: true })
  witness2Id: string;

  @Column({ name: 'required_witnesses', default: 2 })
  requiredWitnesses: number;

  @Column({ type: 'enum', enum: WitnessStatus, default: WitnessStatus.TRIGGERED })
  status: WitnessStatus;

  @Column({ name: 'escalation_notified', default: false })
  escalationNotified: boolean;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ length: 500, name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @OneToMany(() => WitnessStep, (step) => step.verification, { cascade: true })
  steps: WitnessStep[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('witness_steps')
export class WitnessStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WitnessVerification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_id' })
  verification: WitnessVerification;

  @Column({ name: 'verification_id' })
  verificationId: string;

  @Column({ name: 'step_order' })
  stepOrder: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'witness_id' })
  witness: User;

  @Column({ name: 'witness_id' })
  witnessId: string;

  @Column({ name: 'otp_verified', default: false })
  otpVerified: boolean;

  @Column({ type: 'enum', enum: WitnessStepStatus, default: WitnessStepStatus.PENDING })
  status: WitnessStepStatus;

  @Column({ length: 500, nullable: true })
  comment: string;

  @Column({ length: 50, nullable: true })
  ip: string;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
