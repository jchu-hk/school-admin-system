import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsBoolean,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DseBatchStatus,
} from '../entities/dse-exam-batch.entity';
import {
  DseRegistrationStatus,
} from '../entities/dse-registration.entity';
import { DseSubjectCategory } from '../entities/dse-subject.entity';

// ==================== DSE 报考批次 DTOs ====================

export class CreateDseBatchDto {
  @ApiProperty({ description: '学年度', example: '2025-2026' })
  @IsString()
  @MinLength(5)
  academicYear: string;

  @ApiProperty({ description: '批次编码', example: 'DSEB-2026' })
  @IsString()
  @MinLength(1)
  batchCode: string;

  @ApiProperty({ description: '批次名称' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: '报名开放时间' })
  @IsDateString()
  openAt: string;

  @ApiProperty({ description: '报名截止时间' })
  @IsDateString()
  closeAt: string;

  @ApiPropertyOptional({ description: '逾期报名费（每科）', default: 560 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lateFeePerSubject?: number;

  @ApiPropertyOptional({ description: '最少科数', default: 6 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minSubjects?: number;

  @ApiPropertyOptional({ description: '最多科数', default: 8 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxSubjects?: number;

  @ApiPropertyOptional({ description: '是否须签声明书', default: true })
  @IsOptional()
  @IsBoolean()
  requireDeclaration?: boolean;

  @ApiPropertyOptional({ description: '是否须报名照', default: true })
  @IsOptional()
  @IsBoolean()
  requirePhoto?: boolean;
}

export class UpdateDseBatchDto {
  @ApiPropertyOptional({ description: '批次名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '报名开放时间' })
  @IsOptional()
  @IsDateString()
  openAt?: string;

  @ApiPropertyOptional({ description: '报名截止时间' })
  @IsOptional()
  @IsDateString()
  closeAt?: string;

  @ApiPropertyOptional({ description: '逾期报名费（每科）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lateFeePerSubject?: number;

  @ApiPropertyOptional({ description: '最少科数' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minSubjects?: number;

  @ApiPropertyOptional({ description: '最多科数' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxSubjects?: number;

  @ApiPropertyOptional({ description: '是否须签声明书' })
  @IsOptional()
  @IsBoolean()
  requireDeclaration?: boolean;

  @ApiPropertyOptional({ description: '是否须报名照' })
  @IsOptional()
  @IsBoolean()
  requirePhoto?: boolean;
}

export class QueryDseBatchDto {
  @ApiPropertyOptional({ description: '学年度', example: '2025-2026' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ description: '状态', enum: DseBatchStatus })
  @IsOptional()
  @IsEnum(DseBatchStatus)
  status?: DseBatchStatus;
}

export class SubmitBatchDto {
  @ApiPropertyOptional({ description: 'HKEAA 外部引用号' })
  @IsOptional()
  @IsString()
  hkeaaRef?: string;

  @ApiPropertyOptional({ description: '提交备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

// ==================== DSE 报考记录 DTOs ====================

export class SubjectSelectionDto {
  @ApiProperty({ description: '科目代码', example: 'CN' })
  @IsString()
  subjectCode: string;

  @ApiPropertyOptional({ description: '科目分类', enum: DseSubjectCategory })
  @IsOptional()
  @IsEnum(DseSubjectCategory)
  category?: DseSubjectCategory;
}

export class CreateRegistrationDto {
  @ApiProperty({ description: '报考批次ID' })
  @IsUUID()
  batchId: string;

  @ApiProperty({ description: '学生ID' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ description: '校号（来自 WebSAMS）' })
  @IsOptional()
  @IsString()
  studentNo?: string;

  @ApiPropertyOptional({ description: '香港中学会考/文凭试考生号' })
  @IsOptional()
  @IsString()
  hkdseNo?: string;

  @ApiProperty({ description: '所选科目', type: [SubjectSelectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectSelectionDto)
  subjectSelections: SubjectSelectionDto[];

  @ApiProperty({ description: '是否签署声明书', default: false })
  @IsBoolean()
  declarationSigned: boolean;

  @ApiPropertyOptional({ description: '报名照' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: '特别安排ID列表（衔接 F-EXAM-003）' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  specialArrangementIds?: string[];

  @ApiPropertyOptional({ description: '特别安排摘要' })
  @IsOptional()
  specialArrangements?: Record<string, unknown>;
}

export class UpdateRegistrationDto {
  @ApiPropertyOptional({ description: '校号（来自 WebSAMS）' })
  @IsOptional()
  @IsString()
  studentNo?: string;

  @ApiPropertyOptional({ description: '香港中学会考/文凭试考生号' })
  @IsOptional()
  @IsString()
  hkdseNo?: string;

  @ApiPropertyOptional({ description: '所选科目', type: [SubjectSelectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectSelectionDto)
  subjectSelections?: SubjectSelectionDto[];

  @ApiPropertyOptional({ description: '是否签署声明书' })
  @IsOptional()
  @IsBoolean()
  declarationSigned?: boolean;

  @ApiPropertyOptional({ description: '报名照' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: '特别安排摘要' })
  @IsOptional()
  specialArrangements?: Record<string, unknown>;
}

export class QueryRegistrationDto {
  @ApiPropertyOptional({ description: '报考批次ID' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ description: '学生ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: '状态', enum: DseRegistrationStatus })
  @IsOptional()
  @IsEnum(DseRegistrationStatus)
  status?: DseRegistrationStatus;

  @ApiPropertyOptional({ description: '分页偏移', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: '分页数量', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class WithdrawRegistrationDto {
  @ApiProperty({ description: '退选原因' })
  @IsString()
  @MinLength(1)
  reason: string;

  @ApiPropertyOptional({ description: '医疗证明（截止后退选必填）' })
  @IsOptional()
  @IsString()
  medicalProofUrl?: string;
}

export class SubmitRegistrationDto {
  @ApiPropertyOptional({ description: '报名照（如批次要求且未提供）' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
