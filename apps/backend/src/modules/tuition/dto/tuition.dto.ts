import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============ Subsidy Types (AC-01) ============
export enum SubsidyTypeEnum {
  NONE = 'none',
  FULL = 'full',
  PARTIAL = 'partial',
  EXEMPTED = 'exempted',
}

// ============ Tuition Standard DTOs ============

export class CreateTuitionStandardDto {
  @ApiPropertyOptional({ description: '学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({ description: '年级', example: '中四' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  grade: string;

  @ApiProperty({ description: '学年', example: '2025-2026' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  academicYear: string;

  @ApiProperty({ description: '学费金额', example: 50000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '货币', default: 'HKD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: '缴费截止日期' })
  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // ============ AC-01: Subsidy Fields ============
  @ApiPropertyOptional({ description: '资助类型', enum: SubsidyTypeEnum })
  @IsOptional()
  @IsEnum(SubsidyTypeEnum)
  subsidyType?: SubsidyTypeEnum;

  @ApiPropertyOptional({ description: '资助金额', example: 550 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subsidyAmount?: number;

  @ApiPropertyOptional({ description: '豁免金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exemptedAmount?: number;

  @ApiPropertyOptional({ description: '资助备注' })
  @IsOptional()
  @IsString()
  subsidyRemark?: string;
}

export class UpdateTuitionStandardDto {
  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  academicYear?: string;

  @ApiPropertyOptional({ description: '学费金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '货币' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: '缴费截止日期' })
  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // ============ AC-01: Subsidy Fields ============
  @ApiPropertyOptional({ description: '资助类型', enum: SubsidyTypeEnum })
  @IsOptional()
  @IsEnum(SubsidyTypeEnum)
  subsidyType?: SubsidyTypeEnum;

  @ApiPropertyOptional({ description: '资助金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subsidyAmount?: number;

  @ApiPropertyOptional({ description: '豁免金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exemptedAmount?: number;

  @ApiPropertyOptional({ description: '资助备注' })
  @IsOptional()
  @IsString()
  subsidyRemark?: string;
}

export class TuitionStandardQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============ Tuition Payment DTOs ============

export class CreateTuitionPaymentDto {
  @ApiProperty({ description: '学费标准ID' })
  @IsString()
  standardId: string;

  @ApiProperty({ description: '学生ID' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: '学生姓名', example: '张三' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  studentName: string;

  @ApiProperty({ description: '年级', example: '中四' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  grade: string;

  @ApiPropertyOptional({ description: '班级' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  className?: string;

  @ApiProperty({ description: '学年', example: '2025-2026' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  academicYear: string;

  @ApiProperty({ description: '应缴金额', example: 50000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '实缴金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ description: '缴费日期' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: '缴费方式',
    enum: ['cash', 'bank_transfer', 'online', 'other'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  // ============ AC-01: Subsidy Fields ============
  @ApiPropertyOptional({ description: '资助类型', enum: SubsidyTypeEnum })
  @IsOptional()
  @IsEnum(SubsidyTypeEnum)
  subsidyType?: SubsidyTypeEnum;

  @ApiPropertyOptional({ description: '资助金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subsidyAmount?: number;
}

export class UpdateTuitionPaymentDto {
  @ApiPropertyOptional({ description: '学生姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  studentName?: string;

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @ApiPropertyOptional({ description: '班级' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  className?: string;

  @ApiPropertyOptional({ description: '应缴金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '实缴金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ description: '缴费日期' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ description: '缴费方式' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: '状态',
    enum: ['pending', 'paid', 'partial', 'overdue', 'exempted'],
  })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'partial', 'overdue', 'exempted'])
  status?: 'pending' | 'paid' | 'partial' | 'overdue' | 'exempted';

  // ============ AC-01: Subsidy Fields ============
  @ApiPropertyOptional({ description: '资助类型', enum: SubsidyTypeEnum })
  @IsOptional()
  @IsEnum(SubsidyTypeEnum)
  subsidyType?: SubsidyTypeEnum;

  @ApiPropertyOptional({ description: '资助金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subsidyAmount?: number;

  @ApiPropertyOptional({ description: '资助备注' })
  @IsOptional()
  @IsString()
  subsidyRemark?: string;

  // ============ AC-03: Dispute Fields ============
  @ApiPropertyOptional({ description: '争议原因' })
  @IsOptional()
  @IsString()
  disputeReason?: string;

  @ApiPropertyOptional({ description: '争议解决方案', enum: ['adjusted', 'waived', 'maintained'] })
  @IsOptional()
  @IsEnum(['adjusted', 'waived', 'maintained'])
  disputeResolution?: 'adjusted' | 'waived' | 'maintained';
}

export class TuitionPaymentQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'partial', 'overdue', 'exempted'])
  status?: 'pending' | 'paid' | 'partial' | 'overdue' | 'exempted';

  @ApiPropertyOptional({ description: '搜索关键词（学生姓名）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  // ============ Sub-status filter (AC-02/AC-03) ============
  @ApiPropertyOptional({ description: '子状态', enum: ['none', 'installment_plan', 'overdue', 'disputed', 'paused'] })
  @IsOptional()
  @IsString()
  subStatus?: string;
}

// ============ AC-01: Apply Subsidy DTO ============
export class ApplySubsidyDto {
  @ApiProperty({ description: '资助类型', enum: SubsidyTypeEnum })
  @IsEnum(SubsidyTypeEnum)
  subsidyType: SubsidyTypeEnum;

  @ApiPropertyOptional({ description: '资助金额（全额资助默认HK$550）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subsidyAmount?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

// ============ AC-03: Dispute DTOs ============
export class CreateDisputeDto {
  @ApiProperty({ description: '争议原因' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ description: '解决方案', enum: ['adjusted', 'waived', 'maintained'] })
  @IsEnum(['adjusted', 'waived', 'maintained'])
  resolution: 'adjusted' | 'waived' | 'maintained';

  @ApiPropertyOptional({ description: '调整后金额（仅当resolution=adjusted时有效）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newAmount?: number;

  @ApiPropertyOptional({ description: '处理备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
