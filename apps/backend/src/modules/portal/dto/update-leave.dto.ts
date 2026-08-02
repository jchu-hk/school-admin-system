import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PortalLeaveStatus } from '../entities/leave-request.entity';

export class LeaveQueryDto {
  @ApiPropertyOptional({ description: '按状态筛选', enum: PortalLeaveStatus })
  @IsEnum(PortalLeaveStatus)
  @IsOptional()
  status?: PortalLeaveStatus;

  @ApiPropertyOptional({ description: '开始日期筛选' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期筛选' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  limit?: number = 20;
}

export class ApproveLeaveDto {
  @ApiPropertyOptional({ description: '审批人ID（系统自动填充）' })
  @IsString()
  @IsOptional()
  approvedBy?: string;

  @ApiPropertyOptional({ description: '审批意见' })
  @IsString()
  @IsOptional()
  approvalComment?: string;
}
