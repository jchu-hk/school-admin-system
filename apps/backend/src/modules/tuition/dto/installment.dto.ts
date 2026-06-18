import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

// ============ Installment Plan DTOs ============

export class ApplyInstallmentDto {
  @ApiProperty({ description: '缴费记录ID' })
  @IsUUID()
  tuitionPaymentId: string;

  @ApiProperty({ description: '分期期数 (2-12)', example: 3 })
  @IsNumber()
  @Min(2)
  @Max(12)
  installmentCount: number;

  @ApiPropertyOptional({ description: '申请说明/理由' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: '附件URL列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

export class ReviewInstallmentDto {
  @ApiProperty({ description: '审核动作', enum: ['approve', 'reject'] })
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiPropertyOptional({ description: '审核备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: '拒绝原因' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateInstallmentStatusDto {
  @ApiProperty({ description: '目标状态', enum: ['active', 'cancelled', 'expired', 'completed'] })
  @IsEnum(['active', 'cancelled', 'expired', 'completed'])
  status: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}

export class PayInstallmentScheduleDto {
  @ApiProperty({ description: '交易记录ID' })
  @IsUUID()
  transactionId: string;
}

export class CreateDisputeDto {
  @ApiProperty({ description: '争议原因' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: '附件URL列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

export class ResolveDisputeDto {
  @ApiProperty({ description: '解决方案', enum: ['adjusted', 'maintained', 'waived'] })
  @IsEnum(['adjusted', 'maintained', 'waived'])
  resolution: 'adjusted' | 'maintained' | 'waived';

  @ApiPropertyOptional({ description: '调整后金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newAmount?: number;

  @ApiPropertyOptional({ description: '处理备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class InstallmentPlanQueryDto {
  @ApiPropertyOptional({ description: '状态筛选' })
  @IsOptional()
  @IsEnum(['pending_review', 'active', 'completed', 'cancelled', 'expired'])
  status?: string;

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
}

export class SubStatusQueryDto {
  @ApiPropertyOptional({ description: '子状态类型', enum: ['installment_plan', 'overdue', 'disputed'] })
  @IsOptional()
  @IsEnum(['installment_plan', 'overdue', 'disputed'])
  type?: string;

  @ApiPropertyOptional({ description: '是否只返回本人记录（家长用）' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  mine?: boolean;
}

// ============ Response DTOs ============

export class InstallmentScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sequence: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  dueDate: string;

  @ApiProperty()
  paidDate: string | null;

  @ApiProperty()
  status: string;
}

export class InstallmentPlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tuitionPaymentId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  installmentCount: number;

  @ApiProperty()
  installmentAmount: number;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string | null;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  reviewNotes?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: [InstallmentScheduleResponseDto] })
  schedules: InstallmentScheduleResponseDto[];
}

export class ApplyInstallmentResponseDto {
  @ApiProperty()
  planId: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: [InstallmentScheduleResponseDto] })
  schedules: InstallmentScheduleResponseDto[];

  @ApiProperty()
  message: string;
}

export class EarlyRepaymentResponseDto {
  @ApiProperty()
  remainingPrincipal: number;

  @ApiProperty()
  earlyRepaymentAmount: number;

  @ApiProperty()
  message: string;
}

export class SubStatusItemDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  overdueDays?: number;

  @ApiProperty()
  paymentId: string;
}

export class SubStatusResponseDto {
  @ApiProperty({ type: [SubStatusItemDto] })
  installmentPlan: SubStatusItemDto[];

  @ApiProperty({ type: [SubStatusItemDto] })
  overdue: SubStatusItemDto[];

  @ApiProperty({ type: [SubStatusItemDto] })
  disputed: SubStatusItemDto[];
}
