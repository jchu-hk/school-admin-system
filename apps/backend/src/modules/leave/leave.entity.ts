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

export enum LeaveType {
  SICK_LEAVE = 'sick_leave',
  PERSONAL_LEAVE = 'personal_leave',
  MATERNITY_LEAVE = 'maternity_leave',
  PATERNITY_LEAVE = 'paternity_leave',
  MARRIAGE_LEAVE = 'marriage_leave',
  BEREAVEMENT_LEAVE = 'bereavement_leave',
  OTHER = 'other',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// AI核验结果结构
export interface AiVerifyResult {
  verified: boolean;
  risk: 'low' | 'medium' | 'high';
  message: string;
  recognizedType?: string;
  anomalyFlags: string[];
  requireMedicalCertificate: boolean;
  verifiedAt: Date;
  details?: {
    historicalPattern?: {
      totalLeavesLast30Days: number;
      sickLeavesLast30Days: number;
      avgDaysPerLeave: number;
    };
    recommendations: string[];
  };
}

// 医生证明验证结果结构
export interface CertificateVerifyResult {
  valid: boolean;
  status: 'verified' | 'invalid' | 'suspicious' | 'error';
  message: string;
  confidence: number;
  riskFlags: string[];
  details?: {
    hospitalName?: string;
    doctorName?: string;
    diagnosisDate?: string;
    patientName?: string;
    suggestedRestDays?: number;
    certificateType?: string;
    certificateNumber?: string;
    rawOcrText?: string;
  };
  verifiedAt: Date;
}

@Entity('leaves')
export class Leave {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'applicant_id' })
  applicantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @Column({
    type: 'enum',
    enum: LeaveType,
    name: 'leave_type',
  })
  leaveType: LeaveType;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string;

  @Column({ type: 'int', name: 'total_days' })
  totalDays: number;

  @Column({ type: 'int', name: 'total_hours', nullable: true })
  totalHours: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;

  @Column({ name: 'substitute_teacher_id', nullable: true })
  substituteTeacherId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'substitute_teacher_id' })
  substituteTeacher: User;

  @Column({ type: 'int', name: 'substitute_teacher_class_hours', nullable: true })
  substituteTeacherClassHours: number;

  @Column({ name: 'approver_id', nullable: true })
  approverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'approval_comment', type: 'text', nullable: true })
  approvalComment: string;

  @Column({ name: 'attachment_url', nullable: true })
  attachmentUrl: string;

  // AI核验相关字段
  @Column({
    name: 'ai_verify_result',
    type: 'jsonb',
    nullable: true,
  })
  aiVerifyResult: AiVerifyResult;

  @Column({
    name: 'certificate_verify_result',
    type: 'jsonb',
    nullable: true,
  })
  certificateVerifyResult: CertificateVerifyResult;

  @Column({ name: 'certificate_url', nullable: true })
  certificateUrl: string;

  @Column({
    name: 'verified_at',
    type: 'timestamp',
    nullable: true,
  })
  verifiedAt: Date;

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
