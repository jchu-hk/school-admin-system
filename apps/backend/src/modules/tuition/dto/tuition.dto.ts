import { IsString, IsEnum, IsOptional, IsUUID, IsInt, IsNumber, IsDateString } from 'class-validator';
import { TuitionStatus, PaymentMethod } from '../tuition.entity';

export { TuitionStatus, PaymentMethod };

export class CreateTuitionStandardDto {
  @IsString()
  schoolId: string;

  @IsString()
  @IsOptional()
  gradeId?: string;

  @IsString()
  title: string;

  @IsNumber()
  amount: number;

  @IsString()
  period: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateTuitionStandardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  period?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsOptional()
  isActive?: boolean;
}

export class CreateTuitionPaymentDto {
  @IsUUID()
  tuitionStandardId: string;

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

export class UpdateTuitionPaymentDto {
  @IsEnum(TuitionStatus)
  @IsOptional()
  status?: TuitionStatus;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  transactionNo?: string;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class PayTuitionDto {
  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  transactionNo?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class TuitionPaymentQueryDto {
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

  @IsEnum(TuitionStatus)
  @IsOptional()
  status?: TuitionStatus;

  @IsString()
  @IsOptional()
  schoolId?: string;
}

export class TuitionStandardQueryDto {
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

  @IsOptional()
  isActive?: boolean;
}
