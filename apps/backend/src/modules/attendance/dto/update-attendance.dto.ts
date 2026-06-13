import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus, AttendanceType } from '../attendance.entity';

export class UpdateAttendanceDto {
  @IsDateString()
  @IsOptional()
  attendanceDate?: string;

  @IsString()
  @IsOptional()
  checkInTime?: string;

  @IsString()
  @IsOptional()
  checkOutTime?: string;

  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @IsEnum(AttendanceType)
  @IsOptional()
  attendanceType?: AttendanceType;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}
