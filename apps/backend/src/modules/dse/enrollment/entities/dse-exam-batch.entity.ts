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
 * 报考批次状态机（dse_exam_batches.status）
 * DRAFT -> OPEN -> (ONGOING) -> CLOSED -> SUBMITTED -> CONFIRMED
 * OPEN/CLOSED -> CANCELLED
 */
export enum DseBatchStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  ONGOING = 'ongoing',
  CLOSED = 'closed',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('dse_exam_batches')
@Index(['academicYear'])
@Index(['status'])
export class DseExamBatch {
  @ApiProperty({ description: '报考批次ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学年度', example: '2025-2026' })
  @Column({ length: 9, name: 'academic_year' })
  academicYear: string;

  @ApiProperty({ description: '批次编码', example: 'DSEB-2026' })
  @Column({ length: 50, unique: true, name: 'batch_code' })
  batchCode: string;

  @ApiProperty({ description: '批次名称' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: '报名开放时间' })
  @Column({ type: 'timestamptz', name: 'open_at' })
  openAt: Date;

  @ApiProperty({ description: '报名截止时间' })
  @Column({ type: 'timestamptz', name: 'close_at' })
  closeAt: Date;

  @ApiProperty({ description: '逾期报名费（每科）', default: 560 })
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 560.0,
    name: 'late_fee_per_subject',
  })
  lateFeePerSubject: number;

  @ApiProperty({ description: '最少科数', default: 6 })
  @Column({ type: 'smallint', default: 6, name: 'min_subjects' })
  minSubjects: number;

  @ApiProperty({ description: '最多科数', default: 8 })
  @Column({ type: 'smallint', default: 8, name: 'max_subjects' })
  maxSubjects: number;

  @ApiProperty({ description: '是否须签声明书', default: true })
  @Column({ type: 'boolean', default: true, name: 'require_declaration' })
  requireDeclaration: boolean;

  @ApiProperty({ description: '是否须报名照', default: true })
  @Column({ type: 'boolean', default: true, name: 'require_photo' })
  requirePhoto: boolean;

  @ApiProperty({ description: '批次状态', enum: DseBatchStatus })
  @Column({
    type: 'enum',
    enum: DseBatchStatus,
    default: DseBatchStatus.DRAFT,
    name: 'status',
  })
  status: DseBatchStatus;

  @ApiPropertyOptional({ description: '提交 HKEAA 时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt: Date;

  @ApiPropertyOptional({ description: 'HKEAA 确认时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date;

  @ApiPropertyOptional({ description: 'HKEAA 外部引用号' })
  @Column({ length: 100, nullable: true, name: 'hkeaa_ref' })
  hkeaaRef: string;

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
