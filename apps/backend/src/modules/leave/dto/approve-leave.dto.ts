import {
  IsBoolean,
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { LeaveStatus } from '../leave.entity';

export class ApproveLeaveDto {
  @IsBoolean()
  approved: boolean;

  @IsString()
  @IsOptional()
  approvalComment?: string;

  @IsUUID()
  @IsOptional()
  substituteTeacherId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  substituteTeacherClassHours?: number;

  @IsUUID()
  approverId: string;
}

export class RejectLeaveDto {
  @IsString()
  rejectionReason: string;

  @IsUUID()
  approverId: string;
}
