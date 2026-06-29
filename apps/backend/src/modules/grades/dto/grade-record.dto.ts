import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsUUID,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RecordStatus } from '../grade-record.entity';

export class SubjectGradeDto {
  @ApiProperty({ description: '科目名称' })
  @IsString()
  subject: string;

  @ApiProperty({ description: '分数' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({ description: '等级' })
  @IsString()
  grade: string;

  @ApiProperty({ description: '班级排名' })
  @IsNumber()
  @Min(1)
  classRank: number;

  @ApiProperty({ description: '班级平均分' })
  @IsNumber()
  classAvg: number;

  @ApiPropertyOptional({ description: '教师评语' })
  @IsOptional()
  @IsString()
  teacherComment?: string;

  @ApiPropertyOptional({ description: '权重' })
  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class CreateGradeRecordDto {
  @ApiProperty({ description: '学生ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: '教师ID' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ description: '班级ID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ description: '学年', example: '2025-2026' })
  @IsString()
  academicYear: string;

  @ApiProperty({ description: '学期', example: '1' })
  @IsString()
  term: string;

  @ApiProperty({ description: '考试名称', example: '期中考试' })
  @IsString()
  examName: string;

  @ApiProperty({ type: [SubjectGradeDto], description: '各科成绩' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectGradeDto)
  subjects: SubjectGradeDto[];

  @ApiProperty({ description: '总分' })
  @IsNumber()
  @Min(0)
  overallScore: number;

  @ApiProperty({ description: '班级排名' })
  @IsNumber()
  @Min(1)
  classRank: number;

  @ApiProperty({ description: '年级排名' })
  @IsNumber()
  @Min(1)
  gradeRank: number;

  @ApiProperty({ description: '操行等级', example: 'B+' })
  @IsString()
  conductGrade: string;

  @ApiProperty({ description: '出勤率', example: '95%' })
  @IsString()
  attendanceRate: string;

  @ApiPropertyOptional({ enum: RecordStatus, description: '状态' })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class UpdateGradeRecordDto {
  @ApiPropertyOptional({ description: '各科成绩' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectGradeDto)
  subjects?: SubjectGradeDto[];

  @ApiPropertyOptional({ description: '总分' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overallScore?: number;

  @ApiPropertyOptional({ description: '班级排名' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  classRank?: number;

  @ApiPropertyOptional({ description: '年级排名' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  gradeRank?: number;

  @ApiPropertyOptional({ description: '操行等级' })
  @IsOptional()
  @IsString()
  conductGrade?: string;

  @ApiPropertyOptional({ description: '出勤率' })
  @IsOptional()
  @IsString()
  attendanceRate?: string;

  @ApiPropertyOptional({ enum: RecordStatus, description: '状态' })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class SubmitGradeRecordDto {
  @ApiProperty({ description: '提交理由（可选）' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RevokeGradeRecordDto {
  @ApiProperty({ description: '撤回理由（必填）' })
  @IsString()
  reason: string;
}

export class ApproveGradeRecordDto {
  @ApiProperty({ description: '审批意见' })
  @IsString()
  comment: string;
}

export class QueryGradeRecordsDto {
  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsOptional()
  @IsString()
  pageSize?: string;

  @ApiPropertyOptional({ description: '学生ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: '教师ID' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ description: '学期' })
  @IsOptional()
  @IsString()
  term?: string;

  @ApiPropertyOptional({ enum: RecordStatus, description: '状态' })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @ApiPropertyOptional({ description: '考试名称' })
  @IsOptional()
  @IsString()
  examName?: string;
}

export class ClassStatsDto {
  @ApiProperty({ description: '班级ID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ description: '学年' })
  @IsString()
  academicYear: string;

  @ApiProperty({ description: '学期' })
  @IsString()
  term: string;

  @ApiProperty({ description: '考试名称' })
  @IsString()
  examName: string;

  @ApiPropertyOptional({ description: '科目名称（可选，不填则返回全科目）' })
  @IsOptional()
  @IsString()
  subject?: string;
}

export class GeneratePdfDto {
  @ApiProperty({ description: '成绩记录ID' })
  @IsUUID()
  gradeRecordId: string;

  @ApiPropertyOptional({ description: '是否添加水印', default: false })
  @IsOptional()
  addWatermark?: boolean;

  @ApiPropertyOptional({ description: '水印文字', default: '仅供家长个人使用' })
  @IsOptional()
  @IsString()
  watermarkText?: string;
}
