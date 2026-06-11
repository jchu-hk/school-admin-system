import {
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';
import { LunchOrderStatus } from '../lunch.entity';

export class CreateLunchOrderDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsDateString()
  @IsNotEmpty()
  orderDate: string;

  @IsString()
  @IsNotEmpty()
  menuName: string;

  @IsNumber()
  @Min(0)
  menuPrice: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateLunchOrderDto {
  @IsEnum(LunchOrderStatus)
  @IsOptional()
  status?: LunchOrderStatus;

  @IsString()
  @IsOptional()
  menuName?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  menuPrice?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  confirmedBy?: string;
}

export class LunchOrderQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsEnum(LunchOrderStatus)
  @IsOptional()
  status?: LunchOrderStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
