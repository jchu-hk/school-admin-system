import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 报考记录状态机（dse_registrations.status）
 * DRAFT -> PREPARED -> (LATE) -> SUBMITTED -> HKEAA_CONFIRMED
 * PREPARED -> WITHDRAWN（截止后退选需医疗证明）
 * DRAFT/PREPARED -> CANCELLED
 */
export enum DseRegistrationStatus {
  DRAFT = 'draft',
  PREPARED = 'prepared',
  LATE = 'late',
  SUBMITTED = 'submitted',
  HKEAA_CONFIRMED = 'hkeaa_confirmed',
  WITHDRAWN = 'withdrawn',
  CANCELLED = 'cancelled',
}

/**
 * subject_selections 元素结构
 * { subject_code, subject_name, category, language, is_core, status, seat_no? }
 */
@Entity('dse_registrations')
@Index(['batchId'])
@Index(['studentId'])
@Index(['status'])
@Index(['batchId', 'studentId'], { unique: true })
export class DseRegistration {
  @ApiProperty({ description: '报考记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '报考批次ID' })
  @Column({ type: 'uuid', name: 'batch_id' })
  batchId: string;

  @ApiProperty({ description: '学生ID' })
  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ApiProperty({ description: '报考编号', example: 'DSE-2026-001234' })
  @Column({ length: 50, unique: true, name: 'registration_id' })
  registrationId: string;

  @ApiProperty({ description: '校号（来自 WebSAMS）' })
  @Column({ length: 50, name: 'student_no' })
  studentNo: string;

  @ApiPropertyOptional({ description: '香港中学会考/文凭试考生号' })
  @Column({ length: 30, nullable: true, name: 'hkdse_no' })
  hkdseNo: string;

  @ApiProperty({ description: '所选科目数组（JSONB）' })
  @Column({ type: 'jsonb', default: '[]', name: 'subject_selections' })
  subjectSelections: Array<Record<string, unknown>>;

  @ApiProperty({ description: '科目总数' })
  @Column({ type: 'smallint', name: 'total_subjects' })
  totalSubjects: number;

  @ApiPropertyOptional({
    description: '特别安排摘要（衔接 F-EXAM-003）',
    default: {},
  })
  @Column({ type: 'jsonb', default: '{}', name: 'special_arrangements' })
  specialArrangements: Record<string, unknown>;

  @ApiProperty({ description: '是否有特别需要/SEN', default: false })
  @Column({ type: 'boolean', default: false, name: 'has_special_needs' })
  hasSpecialNeeds: boolean;

  @ApiProperty({ description: '是否签署声明书', default: false })
  @Column({ type: 'boolean', default: false, name: 'declaration_signed' })
  declarationSigned: boolean;

  @ApiPropertyOptional({ description: '报名照' })
  @Column({ length: 255, nullable: true, name: 'photo_url' })
  photoUrl: string;

  @ApiProperty({ description: '是否逾期报考', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_late' })
  isLate: boolean;

  @ApiProperty({ description: '逾期费合计', default: 0 })
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    name: 'late_fee_total',
  })
  lateFeeTotal: number;

  @ApiProperty({ description: '报考记录状态', enum: DseRegistrationStatus })
  @Column({
    type: 'enum',
    enum: DseRegistrationStatus,
    default: DseRegistrationStatus.DRAFT,
    name: 'status',
  })
  status: DseRegistrationStatus;

  @ApiPropertyOptional({ description: '提交时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt: Date;

  @ApiPropertyOptional({ description: 'HKEAA 确认时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date;

  @ApiPropertyOptional({ description: '退选原因（截止后需医疗证明）' })
  @Column({ type: 'text', nullable: true, name: 'withdraw_reason' })
  withdrawReason: string;

  @ApiPropertyOptional({ description: '创建人' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ApiPropertyOptional({ description: '更新人' })
  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
