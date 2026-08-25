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
 * 试卷类型（paper_type_enum）
 * normal 普通 / braille 盲文 / large_print 大字版 / separate_room 分考场版
 */
export enum PaperType {
  NORMAL = 'normal',
  BRAILLE = 'braille',
  LARGE_PRINT = 'large_print',
  SEPARATE_ROOM = 'separate_room',
}

/**
 * 试卷存储位置（paper_storage_enum）
 * safe 保险箱 / room 考务室 / other 其他
 */
export enum PaperStorage {
  SAFE = 'safe',
  ROOM = 'room',
  OTHER = 'other',
}

/**
 * 试卷生命周期状态机（exam_papers.status）
 *
 * REQUIRED ──► PRINT_ORDERED ──► PRINTED ──► SEALED ──► IN_SAFE ──► DISTRIBUTED ──► USED
 *    │           │               │            │            │             │             │
 *    │           │               │            │            ▼             ▼             │
 *    └─► CANCELLED                └─► REJECTED   └─► LOST    └─► RETURNED   └─► ARCHIVED
 *                                                                                        │
 *                                                                                        ▼
 *                                                                                     DESTROYED
 *
 * @see SPEC-SYSTEM-DESIGN §18.3
 */
export enum ExamPaperStatus {
  /** 需求确认 */
  REQUIRED = 'required',
  /** 已下单印刷 */
  PRINT_ORDERED = 'print_ordered',
  /** 已印制 */
  PRINTED = 'printed',
  /** 已密封（记录 seal_no）*/
  SEALED = 'sealed',
  /** 已入保险箱 */
  IN_SAFE = 'in_safe',
  /** 已分发（监考员签收）*/
  DISTRIBUTED = 'distributed',
  /** 考试使用中 */
  USED = 'used',
  /** 已回收 */
  RETURNED = 'returned',
  /** 归档保存 */
  ARCHIVED = 'archived',
  /** 审批销毁 */
  DESTROYED = 'destroyed',
  /** 印刷退回 */
  REJECTED = 'rejected',
  /** 取消 */
  CANCELLED = 'cancelled',
  /** 遗失（触发告警）*/
  LOST = 'lost',
}

/**
 * 试卷（exam_papers）
 *
 * 一份具体试卷实体，覆盖印刷、密封、存储、分发、使用、回收、销毁全生命周期（F-EXAM-002b~f）。
 * custody_chain（JSONB）为可审计保管链：从密封到分发每步追加 {actor, action, at}。
 */
@Entity('exam_papers')
@Index(['examId'])
@Index(['subject'])
@Index(['status'])
export class ExamPaper {
  @ApiProperty({ description: '试卷ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({ description: '关联校内考试ID（可空，DSE 官方卷可不挂本校排期）' })
  @Column({ type: 'uuid', nullable: true, name: 'exam_id' })
  examId: string;

  @ApiProperty({ description: '试卷编码', example: 'PAP-2026-CHEM-001' })
  @Column({ length: 50, unique: true, name: 'paper_code' })
  paperCode: string;

  @ApiProperty({ description: '科目', example: '化學' })
  @Column({ length: 100 })
  subject: string;

  @ApiPropertyOptional({ description: '试卷标题（如 卷二）' })
  @Column({ length: 200, nullable: true, name: 'paper_name' })
  paperName: string;

  @ApiProperty({
    description: '试卷类型',
    enum: PaperType,
    default: PaperType.NORMAL,
  })
  @Column({
    type: 'enum',
    enum: PaperType,
    name: 'paper_type',
    default: PaperType.NORMAL,
  })
  paperType: PaperType;

  @ApiProperty({ description: '应印/实印数量', default: 0 })
  @Column({ type: 'int', default: 0, name: 'print_quantity' })
  printQuantity: number;

  @ApiPropertyOptional({ description: '印刷供应商' })
  @Column({ length: 100, nullable: true })
  supplier: string;

  @ApiPropertyOptional({ description: '印刷订单号（F-EXAM-002b）' })
  @Column({ length: 100, nullable: true, name: 'order_no' })
  orderNo: string;

  @ApiPropertyOptional({ description: '密封号码（F-EXAM-002c）' })
  @Column({ length: 100, nullable: true, name: 'seal_no' })
  sealNo: string;

  @ApiProperty({
    description: '保管链记录（JSONB）[{actor, action, at}]',
    default: [],
  })
  @Column({ type: 'jsonb', default: '[]', name: 'custody_chain' })
  custodyChain: Array<{
    actor?: string;
    action: string;
    at: string;
    note?: string;
  }>;

  @ApiPropertyOptional({
    description: '存储位置（paper_storage_enum）',
    enum: PaperStorage,
  })
  @Column({
    type: 'enum',
    enum: PaperStorage,
    nullable: true,
    name: 'storage_location',
  })
  storageLocation: PaperStorage;

  @ApiProperty({
    description: '试卷状态',
    enum: ExamPaperStatus,
  })
  @Column({
    type: 'enum',
    enum: ExamPaperStatus,
    default: ExamPaperStatus.REQUIRED,
  })
  status: ExamPaperStatus;

  @ApiPropertyOptional({ description: '审批销毁时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'destroy_approved_at' })
  destroyApprovedAt: Date;

  @ApiPropertyOptional({ description: '销毁审批人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'destroy_approved_by' })
  destroyApprovedBy: string;

  @ApiPropertyOptional({ description: '保存期限（保留至日期）' })
  @Column({ type: 'date', nullable: true, name: 'retention_until' })
  retentionUntil: Date;

  @ApiPropertyOptional({ description: '备注' })
  @Column({ type: 'text', nullable: true })
  remark: string;

  @ApiPropertyOptional({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '更新人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * 试卷印刷申请状态机（exam_paper_requests.status）
 * draft ──► approved ──► ordered ──► received
 *    │                        │
 *    └─► cancelled           （下单后可 cancelled？设计仅限 draft，见服务校验）
 */
export enum PaperRequestStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

/**
 * 试卷印刷申请（exam_paper_requests）
 * 试卷需求统计与印刷申请（F-EXAM-002a/b），记录每科/每班的应印需求与供应商订单状态。
 */
@Entity('exam_paper_requests')
@Index(['examId'])
@Index(['classId'])
@Index(['status'])
export class ExamPaperRequest {
  @ApiProperty({ description: '申请ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({ description: '关联考试ID' })
  @Column({ type: 'uuid', nullable: true, name: 'exam_id' })
  examId: string;

  @ApiProperty({ description: '申请单号', example: 'EPR-2026-CHEM-001' })
  @Column({ length: 50, unique: true, name: 'request_code' })
  requestCode: string;

  @ApiProperty({ description: '科目', example: '化學' })
  @Column({ length: 100 })
  subject: string;

  @ApiPropertyOptional({ description: '班级ID（可按班统计，可空表示全校/全科）' })
  @Column({ type: 'uuid', nullable: true, name: 'class_id' })
  classId: string;

  @ApiProperty({ description: '需求数量' })
  @Column({ type: 'int', name: 'required_count' })
  requiredCount: number;

  @ApiProperty({ description: '下单数量', default: 0 })
  @Column({ type: 'int', default: 0, name: 'ordered_count' })
  orderedCount: number;

  @ApiPropertyOptional({ description: '供应商' })
  @Column({ length: 100, nullable: true })
  supplier: string;

  @ApiPropertyOptional({ description: '印刷订单号' })
  @Column({ length: 100, nullable: true, name: 'order_no' })
  orderNo: string;

  @ApiProperty({
    description: '印刷申请状态',
    enum: PaperRequestStatus,
    default: PaperRequestStatus.DRAFT,
  })
  @Column({
    type: 'enum',
    enum: PaperRequestStatus,
    default: PaperRequestStatus.DRAFT,
  })
  status: PaperRequestStatus;

  @ApiPropertyOptional({ description: '审批人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedBy: string;

  @ApiPropertyOptional({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '更新人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * 返收状态（paper_return_status_enum）
 * pending 待返收 / partial 部分返收 / complete 全部返收 / missing 遗失
 */
export enum PaperReturnStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETE = 'complete',
  MISSING = 'missing',
}

/**
 * 试卷分发/回收记录（exam_paper_distributions）
 * 考试日分发、监考员签收，及考后回收记录（F-EXAM-002e/f）。
 */
@Entity('exam_paper_distributions')
@Index(['paperId'])
@Index(['invigilatorId'])
@Index(['returnStatus'])
export class ExamPaperDistribution {
  @ApiProperty({ description: '记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '试卷ID' })
  @Column({ type: 'uuid', name: 'paper_id' })
  paperId: string;

  @ApiPropertyOptional({ description: '考试ID' })
  @Column({ type: 'uuid', nullable: true, name: 'exam_id' })
  examId: string;

  @ApiPropertyOptional({ description: '监考员（用户）ID' })
  @Column({ type: 'uuid', nullable: true, name: 'invigilator_id' })
  invigilatorId: string;

  @ApiPropertyOptional({ description: '分发时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'distributed_at' })
  distributedAt: Date;

  @ApiProperty({ description: '分发数量', default: 0 })
  @Column({ type: 'int', default: 0, name: 'distributed_count' })
  distributedCount: number;

  @ApiPropertyOptional({ description: '签收凭证（手写/电子签名引用）' })
  @Column({ length: 255, nullable: true })
  signature: string;

  @ApiPropertyOptional({ description: '回收时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'returned_at' })
  returnedAt: Date;

  @ApiProperty({ description: '回收数量', default: 0 })
  @Column({ type: 'int', default: 0, name: 'returned_count' })
  returnedCount: number;

  @ApiProperty({
    description: '返收状态',
    enum: PaperReturnStatus,
    default: PaperReturnStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: PaperReturnStatus,
    default: PaperReturnStatus.PENDING,
    name: 'return_status',
  })
  returnStatus: PaperReturnStatus;

  @ApiPropertyOptional({ description: '销毁时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'destroyed_at' })
  destroyedAt: Date;

  @ApiPropertyOptional({ description: '备注' })
  @Column({ type: 'text', nullable: true })
  note: string;

  @ApiPropertyOptional({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
