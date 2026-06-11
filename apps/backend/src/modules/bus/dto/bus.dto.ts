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
  IsBoolean,
  IsArray,
} from 'class-validator';
import { BusDirection, BusRecordStatus } from '../bus.entity';

export class CreateBusRouteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  startPoint: string;

  @IsString()
  @IsNotEmpty()
  endPoint: string;

  @IsArray()
  @IsOptional()
  viaStops?: string[];

  @IsInt()
  @Min(1)
  estimatedDuration: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateBusRouteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  startPoint?: string;

  @IsString()
  @IsOptional()
  endPoint?: string;

  @IsArray()
  @IsOptional()
  viaStops?: string[];

  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedDuration?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateBusScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @IsEnum(BusDirection)
  @IsNotEmpty()
  direction: BusDirection;

  @IsString()
  @IsNotEmpty()
  departureTime: string;

  @IsString()
  @IsNotEmpty()
  arrivalTime: string;

  @IsString()
  @IsNotEmpty()
  weekdays: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveFrom: string;

  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateBusScheduleDto {
  @IsString()
  @IsOptional()
  departureTime?: string;

  @IsString()
  @IsOptional()
  arrivalTime?: string;

  @IsString()
  @IsOptional()
  weekdays?: string;

  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateBusRecordDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  scheduleId: string;

  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @IsDateString()
  @IsNotEmpty()
  rideDate: string;

  @IsEnum(BusDirection)
  @IsNotEmpty()
  direction: BusDirection;

  @IsString()
  @IsOptional()
  pickupStop?: string;

  @IsString()
  @IsOptional()
  dropoffStop?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateBusRecordDto {
  @IsEnum(BusRecordStatus)
  @IsOptional()
  status?: BusRecordStatus;

  @IsString()
  @IsOptional()
  pickupStop?: string;

  @IsString()
  @IsOptional()
  dropoffStop?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BusRecordQueryDto {
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

  @IsEnum(BusRecordStatus)
  @IsOptional()
  status?: BusRecordStatus;

  @IsEnum(BusDirection)
  @IsOptional()
  direction?: BusDirection;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
