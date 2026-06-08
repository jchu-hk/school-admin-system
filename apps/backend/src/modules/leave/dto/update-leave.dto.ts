import {
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { LeaveType, LeaveStatus } from '../leave.entity';

export class UpdateLeaveDto {
  @IsEnum(LeaveType)
  @IsOptional()
  leaveType?: LeaveType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsInt()
  @IsOptional()
  totalDays?: number;

  @IsInt()
  @IsOptional()
  totalHours?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsEnum(LeaveStatus)
  @IsOptional()
  status?: LeaveStatus;

  @IsUUID()
  @IsOptional()
  substituteTeacherId?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}
