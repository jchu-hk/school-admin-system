import { IsString, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AlertType,
  AlertSeverity,
  AlertStatus,
} from '../grade-audit-alert.entity';

export class QueryAlertsDto {
  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsOptional()
  @IsString()
  pageSize?: string;

  @ApiPropertyOptional({ enum: AlertType, description: '告警类型' })
  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @ApiPropertyOptional({ enum: AlertSeverity, description: '严重程度' })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({ enum: AlertStatus, description: '状态' })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({ description: '教师ID' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}

export class AcknowledgeAlertDto {
  @ApiProperty({ description: '确认意见' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateAlertStatusDto {
  @ApiProperty({ enum: AlertStatus, description: '新状态' })
  @IsEnum(AlertStatus)
  status: AlertStatus;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  comment?: string;
}
