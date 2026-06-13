import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AttendanceStatus, AttendanceType } from '../attendance.entity';

export class CreateAttendanceDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

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
  @IsNotEmpty()
  createdBy: string;
}
