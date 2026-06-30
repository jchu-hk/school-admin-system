import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InterviewType,
  OverallRecommendation,
} from '../recruitment-interview.entity';

export class ScoreItemDto {
  @ApiProperty({ description: '评分维度' })
  @IsString()
  criterion: string;

  @ApiProperty({ description: '评分（1-5）' })
  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @ApiProperty({ description: '评语' })
  @IsString()
  comment: string;
}

export class InterviewScoreDto {
  @ApiProperty({ description: '面试官ID' })
  @IsString()
  interviewerId: string;

  @ApiProperty({ description: '各项评分' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  scores: ScoreItemDto[];
}

export class CreateInterviewDto {
  @ApiProperty({ description: '申请ID' })
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty({ description: '面试时间' })
  @IsDateString()
  interviewDate: string;

  @ApiProperty({ description: '面试时长（分钟）' })
  @IsNumber()
  @Min(30)
  @Max(180)
  durationMinutes: number;

  @ApiProperty({ description: '面试形式', enum: InterviewType })
  @IsEnum(InterviewType)
  interviewType: InterviewType;

  @ApiProperty({ description: '面试官ID列表' })
  @IsArray()
  @IsString({ each: true })
  interviewers: string[];

  @ApiPropertyOptional({ description: '面试地点（线下面试）' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '会议链接（线上面试）' })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInterviewDto {
  @ApiPropertyOptional({ description: '面试时间' })
  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @ApiPropertyOptional({ description: '面试时长（分钟）' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(180)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: '面试形式', enum: InterviewType })
  @IsOptional()
  @IsEnum(InterviewType)
  interviewType?: InterviewType;

  @ApiPropertyOptional({ description: '面试官ID列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interviewers?: string[];

  @ApiPropertyOptional({ description: '面试地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '会议链接' })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelInterviewDto {
  @ApiPropertyOptional({ description: '取消原因' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class SubmitScoreDto {
  @ApiProperty({ description: '面试官ID' })
  @IsString()
  interviewerId: string;

  @ApiProperty({ description: '各项评分' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  scores: ScoreItemDto[];
}

export class CompleteInterviewDto {
  @ApiProperty({ description: '最终建议', enum: OverallRecommendation })
  @IsEnum(OverallRecommendation)
  overallRecommendation: OverallRecommendation;

  @ApiPropertyOptional({ description: '最终备注' })
  @IsOptional()
  @IsString()
  finalNotes?: string;
}

export class InterviewQueryDto {
  @ApiPropertyOptional({ description: '申请ID筛选' })
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional({ description: '面试状态筛选' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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
