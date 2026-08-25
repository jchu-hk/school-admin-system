import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaperType,
  PaperStorage,
  ExamPaperStatus,
  PaperRequestStatus,
  PaperReturnStatus,
} from '../paper-management.entity';

/* =====================================================================
 * 印刷申请（F-EXAM-002a/b）
 * ===================================================================== */

/** 创建印刷申请 / 需求统计（F-EXAM-002a/b） */
export class CreatePaperRequestDto {
  @ApiPropertyOptional({ description: '关联考试ID' })
  @IsOptional()
  @IsUUID()
  examId?: string;

  @ApiProperty({ description: '科目', example: '化學' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  subject: string;

  @ApiPropertyOptional({ description: '班级ID（可按班统计，可空表示全校/全科）' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({ description: '需求数量' })
  @IsInt()
  @Min(1)
  requiredCount: number;

  @ApiPropertyOptional({ description: '供应商' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplier?: string;
}

/** 审批印刷申请 */
export class ApprovePaperRequestDto {
  @ApiPropertyOptional({ description: '审批意见' })
  @IsOptional()
  @IsString()
  comment?: string;
}

/** 生成供应商印刷订单（F-EXAM-002b） */
export class OrderPaperRequestDto {
  @ApiProperty({ description: '供应商', example: '恒昌印务' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  supplier: string;

  @ApiPropertyOptional({ description: '下单数量（默认取需求数量）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderedCount?: number;

  @ApiPropertyOptional({ description: '印刷订单号' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderNo?: string;
}

/** 印刷申请查询 */
export class PaperRequestQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '科目' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: '申请状态', enum: PaperRequestStatus })
  @IsOptional()
  @IsEnum(PaperRequestStatus)
  status?: PaperRequestStatus;

  @ApiPropertyOptional({ description: '考试ID' })
  @IsOptional()
  @IsUUID()
  examId?: string;
}

/* =====================================================================
 * 试卷（F-EXAM-002c~f）
 * ===================================================================== */

/** 录入试卷（F-EXAM-002c，密封追踪起始） */
export class CreatePaperDto {
  @ApiPropertyOptional({ description: '关联考试ID' })
  @IsOptional()
  @IsUUID()
  examId?: string;

  @ApiProperty({ description: '试卷编码', example: 'PAP-2026-CHEM-001' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  paperCode: string;

  @ApiProperty({ description: '科目', example: '化學' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  subject: string;

  @ApiPropertyOptional({ description: '试卷标题（如 卷二）' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  paperName?: string;

  @ApiPropertyOptional({ description: '试卷类型', enum: PaperType, default: PaperType.NORMAL })
  @IsOptional()
  @IsEnum(PaperType)
  paperType?: PaperType;

  @ApiPropertyOptional({ description: '应印/实印数量', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  printQuantity?: number;

  @ApiPropertyOptional({ description: '供应商' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplier?: string;

  @ApiPropertyOptional({ description: '印刷订单号' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderNo?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

/** 试卷查询 */
export class PaperQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '科目' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: '试卷状态', enum: ExamPaperStatus })
  @IsOptional()
  @IsEnum(ExamPaperStatus)
  status?: ExamPaperStatus;

  @ApiPropertyOptional({ description: '考试ID' })
  @IsOptional()
  @IsUUID()
  examId?: string;
}

/** 密封试卷（F-EXAM-002c） */
export class SealPaperDto {
  @ApiProperty({ description: '密封号码', example: 'SEAL-2026-001' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sealNo: string;

  @ApiPropertyOptional({ description: '存储位置（密封后通常入保险箱）', enum: PaperStorage })
  @IsOptional()
  @IsEnum(PaperStorage)
  storageLocation?: PaperStorage;
}

/** 状态流转（F-EXAM-002c/f） */
export class UpdatePaperStatusDto {
  @ApiProperty({ description: '目标状态', enum: ExamPaperStatus })
  @IsEnum(ExamPaperStatus)
  status: ExamPaperStatus;

  @ApiPropertyOptional({ description: '备注（写入保管链）' })
  @IsOptional()
  @IsString()
  note?: string;
}

/** 分发（F-EXAM-002e，监考签收） */
export class DistributePaperDto {
  @ApiPropertyOptional({ description: '考试ID' })
  @IsOptional()
  @IsUUID()
  examId?: string;

  @ApiProperty({ description: '监考员（用户）ID' })
  @IsUUID()
  invigilatorId: string;

  @ApiProperty({ description: '分发数量', default: 0 })
  @IsInt()
  @Min(0)
  distributedCount: number;

  @ApiPropertyOptional({ description: '签收凭证（手写/电子签名引用）' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  signature?: string;
}

/** 回收（F-EXAM-002f） */
export class ReturnPaperDto {
  @ApiProperty({ description: '回收数量', default: 0 })
  @IsInt()
  @Min(0)
  returnedCount: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  note?: string;
}

/** 审批销毁（F-EXAM-002f） */
export class DestroyPaperDto {
  @ApiProperty({ description: '销毁审批人ID' })
  @IsUUID()
  approvedById: string;

  @ApiProperty({ description: '销毁原因' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: '保存期限（归档时设置保留至日期）' })
  @IsOptional()
  @Type(() => Date)
  retentionUntil?: Date;
}

/** 分发/回收记录查询 */
export class DistributionQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '试卷ID' })
  @IsOptional()
  @IsUUID()
  paperId?: string;

  @ApiPropertyOptional({ description: '监考员ID' })
  @IsOptional()
  @IsUUID()
  invigilatorId?: string;

  @ApiPropertyOptional({ description: '返收状态', enum: PaperReturnStatus })
  @IsOptional()
  @IsEnum(PaperReturnStatus)
  returnStatus?: PaperReturnStatus;
}
