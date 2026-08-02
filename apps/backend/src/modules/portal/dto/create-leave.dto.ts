import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PortalLeaveType, SubmitterRole } from '../entities/leave-request.entity';

export class CreateLeaveDto {
  @ApiProperty({ description: '请假类型', enum: PortalLeaveType })
  @IsEnum(PortalLeaveType)
  @IsNotEmpty()
  leaveType: PortalLeaveType;

  @ApiProperty({ description: '请假开始日期', example: '2026-07-15' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: '请假结束日期', example: '2026-07-15' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: '请假原因', example: '身体不适，需在家休息' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  reason: string;

  @ApiPropertyOptional({ description: '附件URL' })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @ApiPropertyOptional({ description: '请假期间联系方式', example: '91234567' })
  @IsString()
  @IsOptional()
  @Length(8, 20)
  @Matches(/^[0-9]+$/, { message: 'contactPhone must contain only digits' })
  contactPhone?: string;

  /** 家长代子女提交时必填 */
  @ApiPropertyOptional({ description: '目标学生ID（家长代提交时必填）' })
  @IsUUID()
  @IsOptional()
  studentId?: string;
}
