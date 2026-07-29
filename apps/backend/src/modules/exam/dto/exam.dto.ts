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
import { ExamStatus, ExamType } from '../exam.entity';

export class CreateExamDto {
  @ApiProperty({ description: '考试名称', example: '2024年度数学期中考试' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '科目', example: '数学' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  subject: string;

  @ApiProperty({ description: '考试日期', example: '2024-06-15' })
  @IsDateString()
  examDate: string;

  @ApiProperty({ description: '开始时间', example: '09:00' })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  startTime: string;

  @ApiProperty({ description: '结束时间', example: '11:00' })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  endTime: string;

  @ApiProperty({ description: '考场', example: 'A-101' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  classroom: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ description: '班级名称', example: '中四A班' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  className?: string;

  @ApiPropertyOptional({
    description: '考试类型',
    enum: ExamType,
    default: ExamType.TEST,
  })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional({
    description: '考试状态',
    enum: ExamStatus,
    default: ExamStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional({ description: '监考老师', example: '张老师' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  invigilator?: string;

  @ApiPropertyOptional({ description: '总分', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  totalMarks?: number;

  @ApiPropertyOptional({ description: '及格分' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: '学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;
}

export class UpdateExamDto {
  @ApiPropertyOptional({ description: '考试名称' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: '科目' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subject?: string;

  @ApiPropertyOptional({ description: '考试日期' })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  endTime?: string;

  @ApiPropertyOptional({ description: '考场' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  classroom?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ description: '班级名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  className?: string;

  @ApiPropertyOptional({ description: '考试类型', enum: ExamType })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional({ description: '考试状态', enum: ExamStatus })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional({ description: '监考老师' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  invigilator?: string;

  @ApiPropertyOptional({ description: '总分' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  totalMarks?: number;

  @ApiPropertyOptional({ description: '及格分' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class ExamQueryDto {
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

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '科目' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: '班级名称' })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional({ description: '考试状态', enum: ExamStatus })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional({ description: '考试类型', enum: ExamType })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
