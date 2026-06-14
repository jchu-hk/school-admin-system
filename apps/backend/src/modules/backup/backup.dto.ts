import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BackupStatus, BackupType } from './backup.entity';

/**
 * 手动触发备份 DTO
 */
export class TriggerBackupDto {
  @IsOptional()
  @IsString()
  description?: string; // 备份描述/备注
}

/**
 * 备份查询 DTO
 */
export class BackupQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(BackupStatus)
  status?: BackupStatus;

  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;

  @IsOptional()
  @IsString()
  startDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  endDate?: string; // YYYY-MM-DD
}

/**
 * 备份设置 DTO
 */
export class BackupSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  retentionDays?: number = 30; // 保留天数

  @IsOptional()
  @IsString()
  scheduleTime?: string; // 执行时间，如 "02:00"

  @IsOptional()
  @IsString()
  notificationEmail?: string; // 通知邮箱

  @IsOptional()
  @IsString()
  notificationWebhook?: string; // 通知webhook URL
}

/**
 * 备份统计响应 DTO
 */
export class BackupStatisticsDto {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalSize: string;
  averageSize: string;
  lastBackupTime: Date | null;
  lastBackupStatus: BackupStatus | null;
  successRate: number; // 成功率，0-100
}
