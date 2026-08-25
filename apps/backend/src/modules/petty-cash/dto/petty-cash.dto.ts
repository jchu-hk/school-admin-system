import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import {
  ReimbursementCategory,
  PettyCashConfigStatus,
} from '../entities/petty-cash.entity';

// ==================== 报销申请 ====================

export class CreateReimbursementDto {
  @ApiProperty({ description: '报销金额', example: 856.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: '收款方', example: '光明文具公司' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  payee: string;

  @ApiPropertyOptional({ description: '支出说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '支出类别',
    enum: ReimbursementCategory,
  })
  @IsOptional()
  @IsEnum(ReimbursementCategory)
  category?: ReimbursementCategory;

  @ApiPropertyOptional({ description: '收据图片 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  receiptUrl?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SubmitReimbursementDto {
  @ApiPropertyOptional({
    description: '第一见证人用户ID（>HK$500 双人见证时必填，由 WitnessService 校验）',
  })
  @IsOptional()
  @IsUUID()
  witness1Id?: string;

  @ApiPropertyOptional({
    description: '第二见证人用户ID（>HK$500 双人见证时必填）',
  })
  @IsOptional()
  @IsUUID()
  witness2Id?: string;
}

export class ManualAmountDto {
  @ApiProperty({ description: '人工录入金额（OCR 失败降级）', example: 856.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class ApproveReimbursementDto {
  @ApiPropertyOptional({ description: '审批意见' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectReimbursementDto {
  @ApiProperty({ description: '拒绝原因' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}

export class CancelReimbursementDto {
  @ApiPropertyOptional({ description: '取消原因' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class QueryReimbursementDto {
  @ApiPropertyOptional({ description: '按申请人筛选' })
  @IsOptional()
  @IsUUID()
  applicantId?: string;

  @ApiPropertyOptional({
    description: '按工作流状态筛选',
    enum: [
      'draft', 'ocra_pending', 'manual_amount', 'witness_required',
      'witness_in_progress', 'pending_approval', 'approved', 'paid',
      'rejected', 'cancelled', 'blocked',
    ],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '关键词（收款方/描述/交易号）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '起始日期 YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: '结束日期 YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ==================== 备用金补充 ====================

export class TopUpDto {
  @ApiProperty({ description: '补充金额（≤HK$5,000）', example: 2000.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: '备用金补充单号（衔接 F-FIN-001）' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  referenceNo?: string;

  @ApiProperty({ description: '第一见证人用户ID' })
  @IsUUID()
  witness1Id: string;

  @ApiProperty({ description: '第二见证人用户ID' })
  @IsUUID()
  witness2Id: string;
}

export class QueryTransactionDto {
  @ApiPropertyOptional({ description: '学年ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ description: '流水类型（top_up/expense）' })
  @IsOptional()
  @IsString()
  txType?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number;
}

// ==================== 备用金配置 ====================

export class CreateConfigDto {
  @ApiProperty({ description: '学年ID' })
  @IsUUID()
  academicYearId: string;

  @ApiPropertyOptional({ description: '单笔基础限额', default: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSingleLimit?: number;

  @ApiPropertyOptional({ description: '当年 CPI 指数', default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cpiCurrent?: number;

  @ApiPropertyOptional({ description: '基准 CPI 指数', default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cpiBase?: number;

  @ApiPropertyOptional({ description: '备用金上限', default: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  floatCap?: number;

  @ApiPropertyOptional({ description: '备用金低额警示线', default: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  floatLowThreshold?: number;
}

export class UpdateConfigDto extends PartialType(CreateConfigDto) {}

export class ConfirmConfigDto {
  @ApiPropertyOptional({ description: '确认人（校务主任）用户ID' })
  @IsOptional()
  @IsUUID()
  confirmedBy?: string;
}
