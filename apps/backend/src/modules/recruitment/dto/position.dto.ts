import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '../recruitment-position.entity';

export class SalaryRangeDto {
  @ApiPropertyOptional({ description: '最低薪资' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min?: number;

  @ApiPropertyOptional({ description: '最高薪资' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;

  @ApiPropertyOptional({ description: '货币', default: 'HKD' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreatePositionDto {
  @ApiProperty({ description: '职位名称', example: '中文科教师' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: '教授学科', example: '中文' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  subject: string;

  @ApiProperty({ description: '雇佣类型', enum: EmploymentType })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiProperty({ description: '最低薪资' })
  @IsNumber()
  @Min(0)
  salaryMin: number;

  @ApiProperty({ description: '最高薪资' })
  @IsNumber()
  @Min(0)
  salaryMax: number;

  @ApiPropertyOptional({ description: '薪资货币', default: 'HKD' })
  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @ApiProperty({ description: '工作地点' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  location: string;

  @ApiProperty({ description: '任职要求' })
  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @ApiProperty({ description: '工作职责' })
  @IsArray()
  @IsString({ each: true })
  responsibilities: string[];

  @ApiPropertyOptional({ description: '福利待遇' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiProperty({ description: '申请截止日期' })
  @IsDateString()
  applicationDeadline: string;
}

export class UpdatePositionDto {
  @ApiPropertyOptional({ description: '职位名称' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: '教授学科' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  subject?: string;

  @ApiPropertyOptional({ description: '雇佣类型', enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ description: '最低薪资' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: '最高薪资' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ description: '薪资货币' })
  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @ApiPropertyOptional({ description: '工作地点' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ description: '任职要求' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ description: '工作职责' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];

  @ApiPropertyOptional({ description: '福利待遇' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional({ description: '申请截止日期' })
  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;
}

export class PositionQueryDto {
  @ApiPropertyOptional({ description: '职位状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '学科筛选' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: '雇佣类型' })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 20;
}
