import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { FeeStatus, ReductionType } from '../fee.entity';

export { FeeStatus, ReductionType };

export class CreateFeeItemDto {
  @IsString()
  schoolId: string;

  @IsString()
  @IsOptional()
  gradeId?: string;

  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  schoolYear?: string;

  @IsString()
  @IsOptional()
  semester?: string;
}

export class UpdateFeeItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  schoolYear?: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  isMandatory?: boolean;
}

export class CreateFeeCollectionDto {
  @IsUUID()
  feeItemId: string;

  @IsUUID()
  studentId: string;

  @IsUUID()
  parentId: string;

  @IsNumber()
  totalAmount: number;

  @IsDateString()
  @IsOptional()
  paymentDeadline?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateFeeCollectionDto {
  @IsEnum(FeeStatus)
  @IsOptional()
  status?: FeeStatus;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class PayFeeDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  transactionNo?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreateFeeReductionDto {
  @IsUUID()
  feeCollectionId: string;

  @IsUUID()
  studentId: string;

  @IsEnum(ReductionType)
  reductionType: ReductionType;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ApproveFeeReductionDto {
  @IsOptional()
  isApproved?: boolean;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class FeeCollectionQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsEnum(FeeStatus)
  @IsOptional()
  status?: FeeStatus;

  @IsString()
  @IsOptional()
  schoolId?: string;
}

export class FeeItemQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsUUID()
  @IsOptional()
  schoolId?: string;

  @IsUUID()
  @IsOptional()
  gradeId?: string;

  @IsString()
  @IsOptional()
  schoolYear?: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsOptional()
  isActive?: boolean;
}
