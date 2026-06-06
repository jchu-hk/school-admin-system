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
import { Role } from '../../role/role.entity';

export enum ApprovalRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum ApprovalStepStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SKIPPED = 'skipped',
}

export enum ApprovalRole {
  SCHOOL_ADMIN = 'school_admin',
  SYSTEM_ADMIN = 'system_admin',
}

export enum PermissionChangeType {
  GRANT = 'grant',
  REVOKE = 'revoke',
  UPDATE = 'update',
}

@Entity('permission_approval_requests')
export class PermissionApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ name: 'requester_id' })
  requesterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column({ name: 'target_user_id' })
  targetUserId: string;

  @Column({
    type: 'enum',
    enum: PermissionChangeType,
    name: 'change_type',
  })
  changeType: PermissionChangeType;

  @Column({ name: 'role_id', nullable: true })
  roleId: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'permission_ids', type: 'json', nullable: true })
  permissionIds: string[];

  @Column({ name: 'request_reason' })
  requestReason: string;

  @Column({ name: 'valid_from', nullable: true, type: 'timestamp' })
  validFrom: Date;

  @Column({ name: 'valid_until', nullable: true, type: 'timestamp' })
  validUntil: Date;

  @Column({
    type: 'enum',
    enum: ApprovalRequestStatus,
    default: ApprovalRequestStatus.PENDING,
  })
  status: ApprovalRequestStatus;

  @Column({ name: 'current_step', default: 0 })
  currentStep: number;

  @Column({ name: 'total_steps', default: 2 })
  totalSteps: number;

  @Column({ name: 'risk_level', default: 'medium' })
  riskLevel: string;

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @OneToMany(() => ApprovalStep, (step) => step.request, { cascade: true })
  steps: ApprovalStep[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('permission_approval_steps')
export class ApprovalStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PermissionApprovalRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: PermissionApprovalRequest;

  @Column({ name: 'request_id' })
  requestId: string;

  @Column({ name: 'step_order' })
  stepOrder: number;

  @Column({
    type: 'enum',
    enum: ApprovalRole,
  })
  approverRole: ApprovalRole;

  @Column({ name: 'approver_id', nullable: true })
  approverId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({
    type: 'enum',
    enum: ApprovalStepStatus,
    default: ApprovalStepStatus.PENDING,
  })
  status: ApprovalStepStatus;

  @Column({ name: 'comment', nullable: true })
  comment: string;

  @Column({ name: 'approved_at', nullable: true, type: 'timestamp' })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
