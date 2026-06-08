import {
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { LeaveType } from '../leave.entity';

export class CreateLeaveDto {
  @IsUUID()
  @IsNotEmpty()
  applicantId: string;

  @IsEnum(LeaveType)
  @IsNotEmpty()
  leaveType: LeaveType;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsInt()
  @IsNotEmpty()
  totalDays: number;

  @IsInt()
  @IsOptional()
  totalHours?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  @IsOptional()
  substituteTeacherId?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
