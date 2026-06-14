import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
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

export class CreateScholarshipDto {
  @ApiProperty({ description: '奖学金名称', example: '优秀学生奖学金' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '奖学金代码', example: 'MERIT-2025' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '奖学金金额', example: 10000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '货币', default: 'HKD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({ description: '学年', example: '2025-2026' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  academicYear: string;

  @ApiPropertyOptional({ description: '申请截止日期' })
  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @ApiPropertyOptional({ description: '申请资格条件' })
  @IsOptional()
  @IsString()
  eligibilityCriteria?: string;

  @ApiPropertyOptional({ description: '总预算' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBudget?: number;

  @ApiPropertyOptional({ description: '状态', enum: ['open', 'closed', 'pending', 'awarded'] })
  @IsOptional()
  @IsEnum(['open', 'closed', 'pending', 'awarded'])
  status?: 'open' | 'closed' | 'pending' | 'awarded';

  @ApiPropertyOptional({ description: '学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;
}

export class UpdateScholarshipDto {
  @ApiPropertyOptional({ description: '奖学金名称' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: '奖学金代码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '奖学金金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '货币' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  academicYear?: string;

  @ApiPropertyOptional({ description: '申请截止日期' })
  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @ApiPropertyOptional({ description: '申请资格条件' })
  @IsOptional()
  @IsString()
  eligibilityCriteria?: string;

  @ApiPropertyOptional({ description: '总预算' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBudget?: number;

  @ApiPropertyOptional({ description: '已用预算' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usedBudget?: number;

  @ApiPropertyOptional({ description: '状态', enum: ['open', 'closed', 'pending', 'awarded'] })
  @IsOptional()
  @IsEnum(['open', 'closed', 'pending', 'awarded'])
  status?: 'open' | 'closed' | 'pending' | 'awarded';
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

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsEnum(['open', 'closed', 'pending', 'awarded'])
  status?: 'open' | 'closed' | 'pending' | 'awarded';

  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

// ============ Scholarship Application DTOs ============

export class ApplyScholarshipDto {
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
}

export class ReviewScholarshipApplicationDto {
  @ApiProperty({ description: '审核状态', enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: '审核意见' })
  @IsOptional()
  @IsString()
  reviewerComment?: string;

  @ApiPropertyOptional({ description: '批准金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  awardedAmount?: number;
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

  @ApiPropertyOptional({ description: '审核状态' })
  @IsOptional()
  @IsEnum(['pending', 'reviewing', 'approved', 'rejected', 'awarded'])
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'awarded';

  @ApiPropertyOptional({ description: '奖学金ID' })
  @IsOptional()
  @IsString()
  scholarshipId?: string;

  @ApiPropertyOptional({ description: '搜索关键词（学生姓名）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
