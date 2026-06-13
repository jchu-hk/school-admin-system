import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AttendanceStatus } from '../attendance.entity';

export class BatchAttendanceDto {
  @IsString()
  @IsOptional()
  classId?: string;

  @IsDateString()
  @IsOptional()
  attendanceDate?: string;

  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @IsString()
  @IsOptional()
  remark?: string;
}
