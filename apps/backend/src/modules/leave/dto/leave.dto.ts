import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { LeaveType, LeaveStatus } from '../leave.entity';

export class CreateLeaveDto {
  @ApiProperty({ description: '学生ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: '班级ID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ description: '请假类型', enum: LeaveType })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ description: '开始日期' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '结束日期' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: '请假原因' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({ description: '证明材料URL' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiProperty({ description: '跟进提醒日期', required: false })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiProperty({ description: '跟进内容摘要', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  followUpContent?: string;
}

export class ApproveLeaveDto {
  @ApiProperty({ description: '审批意见' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @ApiProperty({ description: '代课老师ID（可选）', required: false })
  @IsOptional()
  @IsUUID()
  substituteTeacherId?: string;
}

export class LeaveApprovalResponseDto {
  @ApiProperty({ description: '请假申请' })
  application: LeaveApplication;

  @ApiProperty({ description: '代课老师当日已排课时数', required: false })
  substituteTeacherClassHours?: number;
}

export class RejectLeaveDto {
  @ApiProperty({ description: '拒绝原因' })
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class LeaveQueryDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({ description: '请假类型', enum: LeaveType, required: false })
  @IsOptional()
  @IsEnum(LeaveType)
  leaveType?: LeaveType;

  @ApiProperty({ description: '审批状态', enum: LeaveStatus, required: false })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiProperty({ description: '学生ID', required: false })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiProperty({ description: '班级ID', required: false })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class LeaveStatisticsDto {
  @ApiProperty({ description: '开始日期' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: '结束日期' })
  @IsString()
  endDate: string;

  @ApiProperty({ description: '班级ID（可选）', required: false })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({ description: '年级（可选）', required: false })
  @IsOptional()
  @IsString()
  grade?: string;
}

export class SetFollowUpDto {
  @ApiProperty({ description: '跟进提醒日期' })
  @IsDateString()
  followUpDate: string;

  @ApiProperty({ description: '跟进内容摘要' })
  @IsString()
  @MaxLength(200)
  followUpContent: string;
}
