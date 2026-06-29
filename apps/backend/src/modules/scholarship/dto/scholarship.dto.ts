import {
  IsString,
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

// ============ Scholarship DTOs ============

export const SCHOLARSHIP_TYPES = [
  'merit',
  'need-based',
  'book',
  'transport',
  'boarding',
] as const;
export type ScholarshipType = (typeof SCHOLARSHIP_TYPES)[number];

export const SCHOLARSHIP_STATUSES = ['active', 'inactive', 'closed'] as const;
export type ScholarshipStatus = (typeof SCHOLARSHIP_STATUSES)[number];

export const APPLICATION_STATUSES = [
  'draft',
  'pending',
  'under_review',
  'approved',
  'rejected',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export class CreateScholarshipDto {
  @ApiProperty({ description: '奖学金名称', example: '优秀学生奖学金' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '类型',
    enum: SCHOLARSHIP_TYPES,
    example: 'merit',
  })
  @IsString()
  @IsEnum(SCHOLARSHIP_TYPES)
  scholarshipType: ScholarshipType;

  @ApiProperty({ description: '金额', example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '名额总数' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalQuota?: number;

  @ApiProperty({ description: '申请开始日期', example: '2025-09-01' })
  @IsDateString()
  applicationStartDate: string;

  @ApiProperty({ description: '申请截止日期', example: '2025-09-30' })
  @IsDateString()
  applicationEndDate: string;

  @ApiPropertyOptional({ description: '发放开始日期' })
  @IsOptional()
  @IsDateString()
  disbursementStartDate?: string;

  @ApiPropertyOptional({ description: '发放截止日期' })
  @IsOptional()
  @IsDateString()
  disbursementEndDate?: string;

  @ApiPropertyOptional({
    description: '状态',
    enum: SCHOLARSHIP_STATUSES,
    default: 'active',
  })
  @IsOptional()
  @IsEnum(SCHOLARSHIP_STATUSES)
  status?: ScholarshipStatus;

  @ApiPropertyOptional({
    description: '符合年级（逗号分隔）',
    example: '中一,中二,中三',
  })
  @IsOptional()
  @IsString()
  eligibleGrades?: string;

  @ApiPropertyOptional({ description: '符合班级（逗号分隔）' })
  @IsOptional()
  @IsString()
  eligibleClasses?: string;

  @ApiPropertyOptional({ description: '申请要求' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ description: '附件URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class UpdateScholarshipDto {
  @ApiPropertyOptional({ description: '奖学金名称' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '类型', enum: SCHOLARSHIP_TYPES })
  @IsOptional()
  @IsEnum(SCHOLARSHIP_TYPES)
  scholarshipType?: ScholarshipType;

  @ApiPropertyOptional({ description: '金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '名额总数' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalQuota?: number;

  @ApiPropertyOptional({ description: '申请开始日期' })
  @IsOptional()
  @IsDateString()
  applicationStartDate?: string;

  @ApiPropertyOptional({ description: '申请截止日期' })
  @IsOptional()
  @IsDateString()
  applicationEndDate?: string;

  @ApiPropertyOptional({ description: '发放开始日期' })
  @IsOptional()
  @IsDateString()
  disbursementStartDate?: string;

  @ApiPropertyOptional({ description: '发放截止日期' })
  @IsOptional()
  @IsDateString()
  disbursementEndDate?: string;

  @ApiPropertyOptional({ description: '状态', enum: SCHOLARSHIP_STATUSES })
  @IsOptional()
  @IsEnum(SCHOLARSHIP_STATUSES)
  status?: ScholarshipStatus;

  @ApiPropertyOptional({ description: '符合年级' })
  @IsOptional()
  @IsString()
  eligibleGrades?: string;

  @ApiPropertyOptional({ description: '符合班级' })
  @IsOptional()
  @IsString()
  eligibleClasses?: string;

  @ApiPropertyOptional({ description: '申请要求' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ description: '附件URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class ScholarshipQueryDto {
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

  @ApiPropertyOptional({ description: '状态', enum: SCHOLARSHIP_STATUSES })
  @IsOptional()
  @IsEnum(SCHOLARSHIP_STATUSES)
  status?: ScholarshipStatus;

  @ApiPropertyOptional({ description: '类型', enum: SCHOLARSHIP_TYPES })
  @IsOptional()
  @IsEnum(SCHOLARSHIP_TYPES)
  scholarshipType?: ScholarshipType;

  @ApiPropertyOptional({ description: '搜索关键词（名称/描述）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

// ============ Scholarship Application DTOs ============

export class ApplyScholarshipDto {
  @ApiProperty({ description: '申请理由' })
  @IsString()
  @MinLength(1)
  applicationReason: string;

  @ApiPropertyOptional({ description: '附件URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class ReviewScholarshipApplicationDto {
  @ApiProperty({ description: '审核状态', enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: '审核意见' })
  @IsOptional()
  @IsString()
  reviewComment?: string;

  @ApiPropertyOptional({ description: '批准金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;
}

export class ScholarshipApplicationQueryDto {
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

  @ApiPropertyOptional({ description: '审核状态', enum: APPLICATION_STATUSES })
  @IsOptional()
  @IsEnum(APPLICATION_STATUSES)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: '奖学金ID' })
  @IsOptional()
  @IsString()
  scholarshipId?: string;

  @ApiPropertyOptional({ description: '搜索关键词（学生姓名）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
