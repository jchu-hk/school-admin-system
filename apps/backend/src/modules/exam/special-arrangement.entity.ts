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
 * 特别安排类型（special_arrangement_type_enum）
 * EXTRA_TIME 额外时间 / SEP_ROOM 独立考场 / SCRIBE 抄写员 / READER 读卷员 / BRAILLE 盲文试卷 / WHEELCHAIR 轮椅通道
 * 审批要求：EXTRA_TIME/SCRIBE/READER/BRAILLE 需 HKEAA；SEP_ROOM 学校+HKEAA；WHEELCHAIR 仅学校。
 */
export enum SpecialArrangementType {
  EXTRA_TIME = 'EXTRA_TIME',
  SEP_ROOM = 'SEP_ROOM',
  SCRIBE = 'SCRIBE',
  READER = 'READER',
  BRAILLE = 'BRAILLE',
  WHEELCHAIR = 'WHEELCHAIR',
}

/**
 * 审批权威（approval_authority_enum）
 * school 学校级 / hkeaa 香港考试及评核局级
 */
export enum ApprovalAuthority {
  SCHOOL = 'school',
  HKEAA = 'hkeaa',
}

/**
 * 审批动作
 */
export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

/**
 * 特别安排单状态机（special_exam_arrangements.status）
 *
 * DRAFT ──► PENDING_APPROVAL ──► APPROVED ──► ACTIVE ──► COMPLETED
 *   │            │                 │
 *   │            ▼                 ▼
 *   └─► CANCELLED              REJECTED
 */
export enum SpecialArrangementStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * 特别安排单（special_exam_arrangements）
 *
 * arrangements 元素结构：
 * { type, description, duration_extension?, room?, invigilator_assigned?, approval_ref?, status }
 */
@Entity('special_exam_arrangements')
@Index(['studentId'])
@Index(['examId'])
@Index(['status'])
export class SpecialExamArrangement {
  @ApiProperty({ description: '安排单ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '安排单号', example: 'SEA-2026-S6-CHEM-001' })
  @Column({ length: 50, unique: true, name: 'arrangement_id' })
  arrangementId: string;

  @ApiProperty({ description: '学生ID' })
  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ApiPropertyOptional({ description: '关联考试ID' })
  @Column({ type: 'uuid', nullable: true, name: 'exam_id' })
  examId: string;

  @ApiProperty({ description: '科目', example: '化學' })
  @Column({ length: 100 })
  subject: string;

  @ApiPropertyOptional({ description: '试卷（如 卷二）' })
  @Column({ length: 100, nullable: true, name: 'paper_name' })
  paperName: string;

  @ApiPropertyOptional({ description: '考试日期', example: '2026-04-18' })
  @Column({ type: 'date', nullable: true, name: 'exam_date' })
  examDate: Date;

  @ApiPropertyOptional({ description: 'SEN 类型（ASD/ADHD…）' })
  @Column({ length: 50, nullable: true, name: 'sen_type' })
  senType: string;

  @ApiPropertyOptional({ description: '严重程度（mild/moderate/severe…）' })
  @Column({ length: 20, nullable: true, name: 'sen_severity' })
  senSeverity: string;

  @ApiProperty({ description: '安排明细数组（JSONB）', default: [] })
  @Column({ type: 'jsonb', default: '[]' })
  arrangements: Array<Record<string, unknown>>;

  @ApiProperty({
    description: '安排单状态',
    enum: SpecialArrangementStatus,
    default: SpecialArrangementStatus.DRAFT,
  })
  @Column({
    type: 'enum',
    enum: SpecialArrangementStatus,
    default: SpecialArrangementStatus.DRAFT,
  })
  status: SpecialArrangementStatus;

  @ApiPropertyOptional({ description: '校内审批人（学校级审批）' })
  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedBy: string;

  @ApiPropertyOptional({ description: '校内审批时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @ApiProperty({
    description: '是否需要并已获 HKEAA 审批',
    default: false,
  })
  @Column({ type: 'boolean', default: false, name: 'hkeaa_approved' })
  hkeaaApproved: boolean;

  @ApiPropertyOptional({ description: '创建人' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * 特别安排审批记录（special_arrangement_approvals）
 * 支持学校级与 HKEAA 级多级审批。
 */
@Entity('special_arrangement_approvals')
@Index(['arrangementId'])
@Index(['approverType'])
export class SpecialArrangementApproval {
  @ApiProperty({ description: '审批记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '安排单ID' })
  @Column({ type: 'uuid', name: 'arrangement_id' })
  arrangementId: string;

  @ApiProperty({ description: '审批权威', enum: ApprovalAuthority })
  @Column({
    type: 'enum',
    enum: ApprovalAuthority,
    name: 'approver_type',
  })
  approverType: ApprovalAuthority;

  @ApiProperty({ description: '审批级别', default: 1 })
  @Column({ type: 'int', default: 1, name: 'approval_level' })
  approvalLevel: number;

  @ApiProperty({ description: '审批动作', enum: ApprovalAction })
  @Column({ length: 20 })
  action: ApprovalAction;

  @ApiPropertyOptional({
    description: '外部审批引用（HKEAA）',
    example: 'SEA-2025-CHEM-555',
  })
  @Column({ length: 100, nullable: true, name: 'approval_ref' })
  approvalRef: string;

  @ApiPropertyOptional({ description: '校内审批人（HKEAA 可为空）' })
  @Column({ type: 'uuid', nullable: true, name: 'approver_id' })
  approverId: string;

  @ApiProperty({ description: '审批时间' })
  @Column({ type: 'timestamptz', name: 'approved_at' })
  approvedAt: Date;

  @ApiPropertyOptional({ description: '审批意见' })
  @Column({ type: 'text', nullable: true })
  comment: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
