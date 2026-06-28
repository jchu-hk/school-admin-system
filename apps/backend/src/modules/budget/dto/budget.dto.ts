import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsUUID,
  Min,
  Max,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BudgetCategory,
  BudgetStatus,
  ExpenseCategory,
  ExpenseStatus,
  BudgetAdjustType,
} from '../entities/budget.entity';

// ==================== Budget DTOs ====================

export class CreateBudgetDto {
  @ApiProperty({ description: '财政年度', example: 2026 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  fiscalYear: number;

  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: '部门名称' })
  @IsOptional()
  @IsString()
  departmentName?: string;

  @ApiProperty({ description: '预算科目', enum: BudgetCategory })
  @IsEnum(BudgetCategory)
  category: BudgetCategory;

  @ApiProperty({ description: '预算名称', example: '教职员薪金预算' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ description: '预算描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '批准金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  @ApiPropertyOptional({ description: '超支预警阈值（百分比）', example: 90 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overspendThreshold?: number;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: '预算名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '预算描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '批准金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  @ApiPropertyOptional({ description: '分配金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allocatedAmount?: number;

  @ApiPropertyOptional({ description: '预算状态', enum: BudgetStatus })
  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @ApiPropertyOptional({ description: '审批人' })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @ApiPropertyOptional({ description: '审批日期' })
  @IsOptional()
  @IsDateString()
  approvalDate?: string;

  @ApiPropertyOptional({ description: '审批意见' })
  @IsOptional()
  @IsString()
  approvalComment?: string;

  @ApiPropertyOptional({ description: '超支预警阈值（百分比）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overspendThreshold?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class ApproveBudgetDto {
  @ApiProperty({ description: '审批意见' })
  @IsString()
  @IsOptional()
  approvalComment?: string;
}

export class SubmitBudgetDto {
  @ApiProperty({ description: '提交审批' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class QueryBudgetDto {
  @ApiPropertyOptional({ description: '财政年度' })
  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  fiscalYear?: number;

  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: '预算科目', enum: BudgetCategory })
  @IsOptional()
  @IsEnum(BudgetCategory)
  category?: BudgetCategory;

  @ApiPropertyOptional({ description: '预算状态', enum: BudgetStatus })
  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @ApiPropertyOptional({ description: '关键词搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

// ==================== Expense DTOs ====================

export class CreateExpenseDto {
  @ApiProperty({ description: '关联的预算ID' })
  @IsUUID()
  budgetId: string;

  @ApiProperty({ description: '财政年度' })
  @IsNumber()
  fiscalYear: number;

  @ApiProperty({ description: '支出日期' })
  @IsDateString()
  expenseDate: string;

  @ApiProperty({ description: '支出描述' })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({ description: '支出类别', enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ description: '支出金额' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: '发票编号' })
  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @ApiPropertyOptional({ description: '供应商名称' })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional({ description: '收据URL' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ description: '支出描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '支出金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '发票编号' })
  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @ApiPropertyOptional({ description: '供应商名称' })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional({ description: '支出状态', enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ description: '收据URL' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class ApproveExpenseDto {
  @ApiProperty({ description: '审批意见' })
  @IsString()
  @IsOptional()
  approvalComment?: string;
}

export class QueryExpenseDto {
  @ApiPropertyOptional({ description: '预算ID' })
  @IsOptional()
  @IsUUID()
  budgetId?: string;

  @ApiPropertyOptional({ description: '财政年度' })
  @IsOptional()
  @IsNumber()
  fiscalYear?: number;

  @ApiPropertyOptional({ description: '支出类别', enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({ description: '支出状态', enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ==================== Adjustment DTOs ====================

export class CreateAdjustmentDto {
  @ApiProperty({ description: '预算ID' })
  @IsUUID()
  budgetId: string;

  @ApiProperty({ description: '财政年度' })
  @IsNumber()
  fiscalYear: number;

  @ApiProperty({ description: '调整类型', enum: BudgetAdjustType })
  @IsEnum(BudgetAdjustType)
  adjustType: BudgetAdjustType;

  @ApiProperty({ description: '调整金额' })
  @IsNumber()
  @Min(0.01)
  adjustAmount: number;

  @ApiProperty({ description: '调整原因' })
  @IsString()
  @MinLength(10)
  reason: string;
}

export class ApproveAdjustmentDto {
  @ApiProperty({ description: '审批意见' })
  @IsString()
  @IsOptional()
  approvalComment?: string;
}

export class QueryAdjustmentDto {
  @ApiPropertyOptional({ description: '预算ID' })
  @IsOptional()
  @IsUUID()
  budgetId?: string;

  @ApiPropertyOptional({ description: '财政年度' })
  @IsOptional()
  @IsNumber()
  fiscalYear?: number;

  @ApiPropertyOptional({ description: '调整状态', enum: BudgetStatus })
  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;
}

// ==================== Statistics DTOs ====================

export class BudgetStatsDto {
  fiscalYear: number;
  totalApproved: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationRate: string;
  overspendCount: number;
  byCategory: Record<string, {
    approved: number;
    spent: number;
    remaining: number;
    utilizationRate: string;
  }>;
}

export class BudgetComparisonDto {
  fiscalYear: number;
  category: BudgetCategory;
  budgetName: string;
  approvedAmount: number;
  actualSpent: number;
  variance: number;
  variancePct: string;
  isOverspend: boolean;
}

export class MonthlyTrendDto {
  month: string;
  category: string;
  planned: number;
  actual: number;
  variance: number;
}

// ==================== F-NEW-004: Annual Budget DTOs ====================

import { FiscalBudgetCategory, BudgetExecutionStatus } from '../entities/budget.entity';

export class CreateAnnualBudgetDto {
  @ApiProperty({ description: '财政年度', example: 2026 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  fiscalYear: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateBudgetAllocationDto {
  @ApiProperty({ description: '财政年度' })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  fiscalYear: number;

  @ApiProperty({ description: '预算科目（8大科目）', enum: FiscalBudgetCategory })
  @IsEnum(FiscalBudgetCategory)
  category: FiscalBudgetCategory;

  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: '部门名称' })
  @IsOptional()
  @IsString()
  departmentName?: string;

  @ApiProperty({ description: '分配金额（HKD）' })
  @IsNumber()
  @Min(0)
  allocatedAmount: number;

  @ApiPropertyOptional({ description: '预警阈值（默认80）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overspendThreshold?: number;
}

export class UpdateBudgetAllocationDto {
  @ApiPropertyOptional({ description: '分配金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allocatedAmount?: number;

  @ApiPropertyOptional({ description: '预警阈值' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overspendThreshold?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryBudgetAllocationDto {
  @ApiPropertyOptional({ description: '财政年度' })
  @IsOptional()
  @IsNumber()
  fiscalYear?: number;

  @ApiPropertyOptional({ description: '科目', enum: FiscalBudgetCategory })
  @IsOptional()
  @IsEnum(FiscalBudgetCategory)
  category?: FiscalBudgetCategory;

  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: '状态', enum: BudgetStatus })
  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;
}

export class RecordFiscalExpenseDto {
  @ApiProperty({ description: '财政年度' })
  @IsNumber()
  fiscalYear: number;

  @ApiProperty({ description: '预算科目（8大科目）', enum: FiscalBudgetCategory })
  @IsEnum(FiscalBudgetCategory)
  fiscalCategory: FiscalBudgetCategory;

  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: '支出日期' })
  @IsDateString()
  expenseDate: string;

  @ApiProperty({ description: '支出描述' })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiPropertyOptional({ description: '支出类别', enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  expenseCategory?: ExpenseCategory;

  @ApiProperty({ description: '支出金额（HKD）' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: '发票编号' })
  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @ApiPropertyOptional({ description: '供应商' })
  @IsOptional()
  @IsString()
  vendorName?: string;
}

export class InterCategoryTransferDto {
  @ApiProperty({ description: '财政年度' })
  @IsNumber()
  fiscalYear: number;

  @ApiProperty({ description: '来源科目', enum: FiscalBudgetCategory })
  @IsEnum(FiscalBudgetCategory)
  fromCategory: FiscalBudgetCategory;

  @ApiProperty({ description: '目标科目', enum: FiscalBudgetCategory })
  @IsEnum(FiscalBudgetCategory)
  toCategory: FiscalBudgetCategory;

  @ApiProperty({ description: '调拨金额' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: '调整原因' })
  @IsString()
  @MinLength(10)
  reason: string;
}

export class AnnualBudgetExecutionReportDto {
  fiscalYear: number;
  totalAllocated: number;
  totalSpent: number;
  executionRate: string;
  totalRemaining: number;
  byCategory: Array<{
    category: string;
    allocated: number;
    spent: number;
    remaining: number;
    executionRate: string;
    monthlyForecast: number;
    variance: number;
    status: BudgetExecutionStatus;
  }>;
  adjustments: Array<{
    date: string;
    fromCategory: string;
    toCategory: string;
    amount: number;
    approvedBy: string;
  }>;
}
