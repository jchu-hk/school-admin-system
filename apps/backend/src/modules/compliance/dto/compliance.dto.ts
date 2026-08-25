import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
  IsIn,
} from 'class-validator';
import {
  DataClass,
  Purpose,
  CheckDecision,
  RiskLevel,
} from '../entities/compliance-check.entity';

export class ComplianceCheckDto {
  @ApiProperty({ description: '操作类型（view/export/print/update/sync_push 等）' })
  @IsString()
  @MaxLength(50)
  action: string;

  @ApiProperty({ enum: DataClass, description: '数据级别 P1/P2/P3' })
  @IsEnum(DataClass)
  dataClass: DataClass;

  @ApiProperty({ enum: Purpose, description: '使用目的' })
  @IsEnum(Purpose)
  purpose: Purpose;

  @ApiProperty({
    description: '资源类型（student_record/health/financial 等）',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  resourceType?: string;

  @ApiProperty({ description: '目标资源ID', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resourceId?: string;

  @ApiProperty({
    description: '请求字段列表（用于资料最小化校验）',
    type: [String],
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];
}

export class ComplianceCheckQueryDto {
  @ApiProperty({ enum: DataClass, description: '按数据级别过滤', required: false })
  @IsOptional()
  @IsEnum(DataClass)
  dataClass?: DataClass;

  @ApiProperty({ enum: CheckDecision, description: '按判定结果过滤', required: false })
  @IsOptional()
  @IsEnum(CheckDecision)
  decision?: CheckDecision;

  @ApiProperty({ description: '按用户ID过滤', required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ enum: RiskLevel, description: '按风险等级过滤', required: false })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', default: 20, required: false })
  @IsOptional()
  pageSize?: number;
}

/** 合规检查引擎返回的单条判定结果 */
export class ComplianceCheckResultDto {
  @ApiProperty({ description: '判定结果 allow/deny' })
  decision: CheckDecision;

  @ApiProperty({ description: '拒绝/放行原因（如 purpose_violation）' })
  reason: string | null;

  @ApiProperty({ enum: RiskLevel, description: '风险等级' })
  riskLevel: RiskLevel;

  @ApiProperty({ description: '各子检查项结果' })
  checkItems: Array<{ name: string; passed: boolean; detail?: string }>;

  @ApiProperty({ description: '判定记录ID' })
  checkId: string;
}
