import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  JupasLetterType,
  JupasLetterStatus,
} from '../entities/jupas-reference-letter.entity';
import { JupasAppealStatus } from '../entities/jupas-appeal.entity';

// ============================================================
// 申请（JupasApplication）
// ============================================================

export class CreateJupasApplicationDto {
  @ApiProperty({ description: '学年（2025-2026）' })
  @IsString()
  academicYear: string;

  @ApiProperty({ description: '学生ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'JUPAS 申请编号' })
  @IsString()
  jupasApplicationNo: string;

  @ApiPropertyOptional({ description: '学校推荐提交截止' })
  @IsOptional()
  @IsDateString()
  submissionDeadline?: string;
}

export class UpdateJupasApplicationDto {
  @ApiPropertyOptional({ description: 'JUPAS 申请编号' })
  @IsOptional()
  @IsString()
  jupasApplicationNo?: string;

  @ApiPropertyOptional({ description: '学校推荐提交截止' })
  @IsOptional()
  @IsDateString()
  submissionDeadline?: string;
}

export class JupasApplicationQueryDto {
  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ description: '学生ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'JUPAS 申请编号' })
  @IsOptional()
  @IsString()
  jupasApplicationNo?: string;

  @ApiPropertyOptional({ description: '申请状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

// ============================================================
// 志愿（JupasChoice）
// ============================================================

export class UpsertChoiceDto {
  @ApiPropertyOptional({ description: '志愿ID（更新时传入；新增留空）' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: '志愿优先级（1 最高）' })
  @IsInt()
  @Min(1)
  priority: number;

  @ApiProperty({ description: '院校' })
  @IsString()
  institution: string;

  @ApiProperty({ description: '课程名称' })
  @IsString()
  program: string;

  @ApiProperty({ description: '课程代码（JS4013…）' })
  @IsString()
  programCode: string;
}

export class UpsertChoicesDto {
  @ApiProperty({
    description: '志愿列表（优先级唯一，重复的 priority 将覆盖）',
    type: [UpsertChoiceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertChoiceDto)
  choices: UpsertChoiceDto[];
}

// ============================================================
// 推荐信（JupasReferenceLetter）
// ============================================================

export class CreateJupasLetterDto {
  @ApiProperty({ description: '所属申请ID' })
  @IsUUID()
  applicationId: string;

  @ApiProperty({ description: '推荐信类型', enum: JupasLetterType })
  @IsEnum(JupasLetterType)
  letterType: JupasLetterType;

  @ApiProperty({ description: '撰写教师/校长ID' })
  @IsUUID()
  teacherId: string;

  @ApiPropertyOptional({ description: '任教科目（教师信）' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class UpdateJupasLetterDto {
  @ApiPropertyOptional({ description: '推荐信正文' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '推荐信状态' })
  @IsOptional()
  @IsEnum(JupasLetterStatus)
  status?: JupasLetterStatus;

  @ApiPropertyOptional({ description: '请审视状态（提交/退回）' })
  @IsOptional()
  @IsEnum(JupasLetterStatus)
  reviewAction?: JupasLetterStatus;
}

export class AiAssistLetterDto {
  @ApiPropertyOptional({ description: '推荐信内容（用于实时字数统计）' })
  @IsOptional()
  @IsString()
  content?: string;
}

export class SubmitLetterDto {
  @ApiPropertyOptional({ description: '提交人ID' })
  @IsOptional()
  @IsUUID()
  submittedById?: string;
}

// ============================================================
// 上诉（JupasAppeal）
// ============================================================

export class CreateJupasAppealDto {
  @ApiProperty({ description: '上诉理由' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: '证据文件引用数组' })
  @IsOptional()
  @IsArray()
  evidence?: string[];
}

export class ReviewJupasAppealDto {
  @ApiProperty({ description: '处理结果' })
  @IsString()
  resolution: string;

  @ApiProperty({ description: '复核结论', enum: JupasAppealStatus })
  @IsEnum(JupasAppealStatus)
  status: JupasAppealStatus;

  @ApiPropertyOptional({ description: '复核人ID' })
  @IsOptional()
  @IsUUID()
  reviewedBy?: string;
}
