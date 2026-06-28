import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DseReleaseStatus } from '../entities/dse-release.entity';
import { DseResultStatus, DseLevel } from '../entities/dse-result.entity';
import { DseReviewStatus, DseReviewType } from '../entities/dse-review.entity';
import { JupasStatus } from '../entities/dse-offer-tracking.entity';

// ==================== DSE Release DTOs ====================

export class CreateDseReleaseDto {
  @ApiProperty({ description: '学年', example: '2025-2026' })
  @IsString()
  @MinLength(5)
  academicYear: string;

  @ApiProperty({ description: 'DSE放榜日期' })
  @IsDateString()
  releaseDate: string;

  @ApiPropertyOptional({ description: '导入截止日期' })
  @IsOptional()
  @IsDateString()
  importDeadline?: string;

  @ApiPropertyOptional({ description: '覆核申请截止日期' })
  @IsOptional()
  @IsDateString()
  reviewDeadline?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateDseReleaseDto {
  @ApiPropertyOptional({ enum: DseReleaseStatus })
  @IsOptional()
  @IsEnum(DseReleaseStatus)
  releaseStatus?: DseReleaseStatus;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryDseReleaseDto {
  @ApiPropertyOptional({ enum: DseReleaseStatus })
  @IsOptional()
  @IsEnum(DseReleaseStatus)
  releaseStatus?: DseReleaseStatus;

  @ApiPropertyOptional({ description: '学年', example: '2025-2026' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ description: '学年', example: 2026 })
  @IsOptional()
  @IsNumber()
  releaseYear?: number;
}

// ==================== DSE Result DTOs ====================

export class DseSubjectScore {
  @ApiProperty({ description: '科目代码', example: 'CHIN' })
  @IsString()
  subjectCode: string;

  @ApiProperty({ description: '科目名称', example: '中國語文' })
  @IsString()
  subjectName: string;

  @ApiProperty({ description: '等级', enum: DseLevel })
  @IsString()
  level: string;
}

export class ImportDseResultDto {
  @ApiProperty({ description: '关联的放榜记录ID' })
  @IsUUID()
  releaseId: string;

  @ApiProperty({ description: '学生ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'HKEAA考生编号' })
  @IsString()
  @MinLength(1)
  hkeaaCandidateNo: string;

  @ApiProperty({ description: '中文科目等级', enum: DseLevel })
  @IsString()
  chineseLevel: string;

  @ApiProperty({ description: '英文科目等级', enum: DseLevel })
  @IsString()
  englishLevel: string;

  @ApiProperty({ description: '数学必修部分等级', enum: DseLevel })
  @IsString()
  mathCompulsoryLevel: string;

  @ApiPropertyOptional({ description: '数学延伸部分等级（M1/M2）' })
  @IsOptional()
  @IsString()
  mathExtendedLevel?: string;

  @ApiProperty({ description: '通识科目等级', enum: DseLevel })
  @IsString()
  liberalStudiesLevel: string;

  @ApiPropertyOptional({ description: '选修科目1' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DseSubjectScore)
  elective1?: DseSubjectScore;

  @ApiPropertyOptional({ description: '选修科目2' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DseSubjectScore)
  elective2?: DseSubjectScore;

  @ApiPropertyOptional({ description: '选修科目3' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DseSubjectScore)
  elective3?: DseSubjectScore;
}

export class BatchImportDseResultDto {
  @ApiProperty({ description: '放榜记录ID' })
  @IsUUID()
  releaseId: string;

  @ApiProperty({ description: '成绩数据列表', type: [ImportDseResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportDseResultDto)
  results: ImportDseResultDto[];
}

export class QueryDseResultDto {
  @ApiPropertyOptional({ description: '放榜记录ID' })
  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @ApiPropertyOptional({ description: '学生ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: '班级', example: '6A' })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional({ enum: DseResultStatus })
  @IsOptional()
  @IsEnum(DseResultStatus)
  resultStatus?: DseResultStatus;
}

export class UpdateDseResultDto {
  @ApiPropertyOptional({ enum: DseResultStatus })
  @IsOptional()
  @IsEnum(DseResultStatus)
  resultStatus?: DseResultStatus;

  @ApiPropertyOptional({ description: '是否已向家长公布' })
  @IsOptional()
  publishedToParent?: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

// ==================== DSE Review DTOs ====================

export class CreateDseReviewDto {
  @ApiProperty({ description: 'DSE成绩记录ID' })
  @IsUUID()
  dseResultId: string;

  @ApiProperty({ description: '覆核类型', enum: DseReviewType })
  @IsEnum(DseReviewType)
  reviewType: DseReviewType;

  @ApiProperty({ description: '申请科目' })
  @IsString()
  subjectName: string;

  @ApiProperty({ description: '申请理由' })
  @IsString()
  @MinLength(10)
  reason: string;

  @ApiPropertyOptional({ description: 'HKEAA覆核费用（HKD）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hkeaaFee?: number;
}

export class ApproveDseReviewDto {
  @ApiProperty({ description: '审批备注' })
  @IsString()
  @IsOptional()
  approvalRemark?: string;
}

export class UpdateDseReviewResultDto {
  @ApiProperty({ description: 'HKEAA新的等级', enum: DseLevel })
  @IsString()
  hkeaaNewLevel: string;

  @ApiProperty({ description: 'HKEAA结果说明' })
  @IsString()
  @IsOptional()
  hkeaaResultRemark?: string;
}

export class QueryDseReviewDto {
  @ApiPropertyOptional({ description: 'DSE成绩记录ID' })
  @IsOptional()
  @IsUUID()
  dseResultId?: string;

  @ApiPropertyOptional({ enum: DseReviewStatus })
  @IsOptional()
  @IsEnum(DseReviewStatus)
  status?: DseReviewStatus;

  @ApiPropertyOptional({ enum: DseReviewType })
  @IsOptional()
  @IsEnum(DseReviewType)
  reviewType?: DseReviewType;
}

// ==================== Offer Tracking DTOs ====================

export class CreateDseOfferTrackingDto {
  @ApiProperty({ description: 'DSE成绩记录ID' })
  @IsUUID()
  dseResultId: string;

  @ApiProperty({ description: '学生ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'JUPAS申请状态', enum: JupasStatus })
  @IsEnum(JupasStatus)
  jupasStatus: JupasStatus;

  @ApiPropertyOptional({ description: 'JUPAS申请编号' })
  @IsOptional()
  @IsString()
  jupasApplicationNo?: string;

  @ApiPropertyOptional({ description: '最终就读大学（匿名）' })
  @IsOptional()
  @IsString()
  institutionAnonymized?: string;

  @ApiPropertyOptional({ description: '就读课程（匿名）' })
  @IsOptional()
  @IsString()
  programAnonymized?: string;

  @ApiPropertyOptional({ description: '入学年份' })
  @IsOptional()
  @IsNumber()
  enrollmentYear?: number;

  @ApiPropertyOptional({ description: 'Offer确认日期' })
  @IsOptional()
  @IsDateString()
  offerDate?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateDseOfferTrackingDto {
  @ApiPropertyOptional({ enum: JupasStatus })
  @IsOptional()
  @IsEnum(JupasStatus)
  jupasStatus?: JupasStatus;

  @ApiPropertyOptional({ description: '最终就读大学（匿名）' })
  @IsOptional()
  @IsString()
  institutionAnonymized?: string;

  @ApiPropertyOptional({ description: '就读课程（匿名）' })
  @IsOptional()
  @IsString()
  programAnonymized?: string;

  @ApiPropertyOptional({ description: '入学年份' })
  @IsOptional()
  @IsNumber()
  enrollmentYear?: number;

  @ApiPropertyOptional({ description: 'Offer确认日期' })
  @IsOptional()
  @IsDateString()
  offerDate?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryDseOfferTrackingDto {
  @ApiPropertyOptional({ description: 'DSE成绩记录ID' })
  @IsOptional()
  @IsUUID()
  dseResultId?: string;

  @ApiPropertyOptional({ description: '班级' })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional({ enum: JupasStatus })
  @IsOptional()
  @IsEnum(JupasStatus)
  jupasStatus?: JupasStatus;
}

// ==================== Statistics DTOs ====================

export class QueryDseStatsDto {
  @ApiProperty({ description: '放榜记录ID' })
  @IsUUID()
  releaseId: string;

  @ApiPropertyOptional({ description: '班级（不传则统计全级）' })
  @IsOptional()
  @IsString()
  className?: string;
}

export class SubjectStatsDto {
  subject: string;
  candidates: number;
  level5PlusPct: string;
  level4PlusPct: string;
  passRate: string;
  schoolAvg: string;
  hkeaaAvg: string;
}

export class DseStatsResponseDto {
  releaseId: string;
  academicYear: string;
  releaseDate: string;
  totalStudents: number;
  resultsReceived: number;
  resultsPending: number;
  publishedCount: number;
  bySubjectStats: SubjectStatsDto[];
  classStats: Record<string, { avgBest5: number; count: number }>;
  jupasStats: {
    total: number;
    applied: number;
    offered: number;
    confirmed: number;
    notApplied: number;
  };
  reviewStats: {
    total: number;
    pending: number;
    submitted: number;
    completed: number;
  };
}
