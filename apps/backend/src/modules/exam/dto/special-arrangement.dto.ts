import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUUID,
  IsDateString,
  ValidateNested,
  MaxLength,
  MinLength,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SpecialArrangementType,
  SpecialArrangementStatus,
  ApprovalAuthority,
  ApprovalAction,
} from '../special-arrangement.entity';

/** 安排明细元素（arrangements 数组项） */
export class ArrangementItemDto {
  @ApiProperty({ description: '安排类型', enum: SpecialArrangementType })
  @IsEnum(SpecialArrangementType)
  type: SpecialArrangementType;

  @ApiProperty({ description: '安排描述', example: '25%额外时间' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description: string;

  @ApiPropertyOptional({ description: '额外时间比例（EXTRA_TIME）', example: '25%' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  durationExtension?: string;

  @ApiPropertyOptional({ description: '考场（SEP_ROOM）', example: '201室' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  room?: string;

  @ApiPropertyOptional({ description: '监考/抄写员/读卷员（SEP_ROOM/SCRIBE/READER）' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  invigilatorAssigned?: string;

  @ApiPropertyOptional({ description: 'HKEAA 审批引用', example: 'SEA-2025-CHEM-555' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  approvalRef?: string;
}

/** 创建 / 更新 特别考试安排 */
export class CreateSpecialArrangementDto {
  @ApiProperty({ description: '学生ID' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ description: '关联考试ID' })
  @IsOptional()
  @IsUUID()
  examId?: string;

  @ApiProperty({ description: '科目', example: '化學' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  subject: string;

  @ApiPropertyOptional({ description: '试卷（如 卷二）' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paperName?: string;

  @ApiPropertyOptional({ description: '考试日期', example: '2026-04-18' })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional({ description: 'SEN 类型' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  senType?: string;

  @ApiPropertyOptional({ description: 'SEN 严重程度' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  senSeverity?: string;

  @ApiProperty({ description: '安排明细', type: [ArrangementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArrangementItemDto)
  arrangements: ArrangementItemDto[];

  @ApiPropertyOptional({
    description: '是否需要并已获 HKEAA 审批',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hkeaaApproved?: boolean;
}

/** 审批操作请求体 */
export class ApproveArrangementDto {
  @ApiProperty({ description: '审批动作', enum: ApprovalAction })
  @IsEnum(ApprovalAction)
  action: ApprovalAction;

  @ApiPropertyOptional({ description: '审批权威类型', enum: ApprovalAuthority })
  @IsOptional()
  @IsEnum(ApprovalAuthority)
  approverType?: ApprovalAuthority;

  @ApiPropertyOptional({ description: '审批级别', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  approvalLevel?: number;

  @ApiPropertyOptional({ description: '外部审批引用（HKEAA）' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  approvalRef?: string;

  @ApiPropertyOptional({ description: '审批意见' })
  @IsOptional()
  @IsString()
  comment?: string;
}

/** 安排单查询 */
export class SpecialArrangementQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '科目' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: '安排单状态', enum: SpecialArrangementStatus })
  @IsOptional()
  @IsEnum(SpecialArrangementStatus)
  status?: SpecialArrangementStatus;

  @ApiPropertyOptional({ description: '学生ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: '考试ID' })
  @IsOptional()
  @IsUUID()
  examId?: string;
}
