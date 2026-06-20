import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FeeStatus, ReductionType } from '../fee.entity';

// ============ Fee Type DTOs ============

export class CreateFeeTypeDto {
  @ApiProperty({ description: '费用类型名称', example: '午膳费' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '费用类型代码', example: 'LUNCH_FEE' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '默认金额', example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultAmount?: number;

  @ApiPropertyOptional({ description: '货币', default: 'HKD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFeeTypeDto {
  @ApiPropertyOptional({ description: '费用类型名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '费用类型代码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '默认金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultAmount?: number;

  @ApiPropertyOptional({ description: '货币' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FeeTypeQueryDto {
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

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

// ============ Fee Record DTOs ============

export class CreateFeeRecordDto {
  @ApiProperty({ description: '费用类型ID' })
  @IsUUID()
  feeTypeId: string;

  @ApiProperty({ description: '学生ID' })
  @IsString()
  @MinLength(1)
  studentId: string;

  @ApiProperty({ description: '学生姓名', example: '张三' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  studentName: string;

  @ApiProperty({ description: '年级', example: '中一' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  grade: string;

  @ApiPropertyOptional({ description: '班级' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  className?: string;

  @ApiPropertyOptional({ description: '费用类型名称', example: '午膳费' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  feeTypeName?: string;

  @ApiProperty({ description: '金额', example: 3000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '货币', default: 'HKD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: '缴费日期' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: '缴费方式',
    enum: ['cash', 'bank_transfer', 'online', 'other'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({ description: '收据编号' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  receiptNumber?: string;

  @ApiPropertyOptional({
    description: '状态',
    enum: ['paid', 'pending', 'overdue'],
  })
  @IsOptional()
  @IsEnum(['paid', 'pending', 'overdue'])
  status?: 'paid' | 'pending' | 'overdue';
}

export class UpdateFeeRecordDto {
  @ApiPropertyOptional({ description: '学生姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  studentName?: string;

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @ApiPropertyOptional({ description: '班级' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  className?: string;

  @ApiPropertyOptional({ description: '金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '货币' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: '缴费日期' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ description: '缴费方式' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({ description: '收据编号' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  receiptNumber?: string;

  @ApiPropertyOptional({
    description: '状态',
    enum: ['paid', 'pending', 'overdue'],
  })
  @IsOptional()
  @IsEnum(['paid', 'pending', 'overdue'])
  status?: 'paid' | 'pending' | 'overdue';
}

export class FeeRecordQueryDto {
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

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: '费用类型名称' })
  @IsOptional()
  @IsString()
  feeType?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsEnum(['paid', 'pending', 'overdue'])
  status?: 'paid' | 'pending' | 'overdue';

  @ApiPropertyOptional({ description: '搜索关键词（学生姓名）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

// ============ Fee Item DTOs ============

export class CreateFeeItemDto {
  @ApiProperty({ description: '学校ID' })
  @IsString()
  schoolId: string;

  @ApiPropertyOptional({ description: '年级ID' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiProperty({ description: '费用名称', example: '2024年度午膳费' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '费用类别', example: 'lunch' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  category: string;

  @ApiProperty({ description: '金额', example: 3500 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: '学年', example: '2024-2025' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  schoolYear?: string;

  @ApiPropertyOptional({ description: '学期', example: '上学期' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  semester?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '是否必缴', default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class UpdateFeeItemDto {
  @ApiPropertyOptional({ description: '费用名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '费用类别' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: '金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  schoolYear?: string;

  @ApiPropertyOptional({ description: '学期' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  semester?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '是否必缴' })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class FeeItemQueryDto {
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

  @ApiPropertyOptional({ description: '学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ description: '年级ID' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ description: '费用类别' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  schoolYear?: string;

  @ApiPropertyOptional({ description: '学期' })
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '搜索关键词（名称）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

// ============ Fee Collection DTOs ============

export class CreateFeeCollectionDto {
  @ApiProperty({ description: '费用项目ID' })
  @IsUUID()
  feeItemId: string;

  @ApiProperty({ description: '学生ID' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: '家长ID' })
  @IsUUID()
  parentId: string;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateFeeCollectionDto {
  @ApiPropertyOptional({ description: '状态', enum: FeeStatus })
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @ApiPropertyOptional({ description: '已付金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class RecordPaymentDto {
  @ApiProperty({ description: '付款金额', example: 1750 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: '付款方式', enum: ['cash', 'bank_transfer', 'online', 'other'] })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class FeeCollectionQueryDto {
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

  @ApiPropertyOptional({ description: '学生ID' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ description: '费用项目ID' })
  @IsOptional()
  @IsUUID()
  feeItemId?: string;

  @ApiPropertyOptional({ description: '状态', enum: FeeStatus })
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @ApiPropertyOptional({ description: '学年' })
  @IsOptional()
  @IsString()
  schoolYear?: string;

  @ApiPropertyOptional({ description: '学期' })
  @IsOptional()
  @IsString()
  semester?: string;
}

// ============ Fee Reduction DTOs ============

export class CreateFeeReductionDto {
  @ApiProperty({ description: '费用征收记录ID' })
  @IsUUID()
  feeCollectionId: string;

  @ApiProperty({ description: '学生ID' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: '减免类型', enum: ReductionType })
  @IsEnum(ReductionType)
  reductionType: ReductionType;

  @ApiProperty({ description: '减免金额', example: 500 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '减免原因' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class ApproveReductionDto {
  @ApiPropertyOptional({ description: '审批备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class FeeReductionQueryDto {
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

  @ApiPropertyOptional({ description: '学生ID' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ description: '费用征收记录ID' })
  @IsOptional()
  @IsUUID()
  feeCollectionId?: string;

  @ApiPropertyOptional({ description: '减免类型', enum: ReductionType })
  @IsOptional()
  @IsEnum(ReductionType)
  reductionType?: ReductionType;

  @ApiPropertyOptional({ description: '是否已审批' })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}
