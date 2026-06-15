import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsUUID,
  IsIn,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus, AttendanceType, SyncSource } from '../attendance.entity';

/** 批量录入单条记录 */
export class BatchRecordDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  studentName?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: AttendanceStatus;

  @IsString()
  @IsOptional()
  checkInTime?: string;

  @IsString()
  @IsOptional()
  checkOutTime?: string;

  @IsEnum(AttendanceType)
  @IsOptional()
  attendanceType?: AttendanceType;

  @IsString()
  @IsOptional()
  remark?: string;
}

/** 批量创建出勤记录（确认预览后提交）*/
export class BatchCreateAttendanceDto {
  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsDateString()
  @IsNotEmpty()
  attendanceDate: string;

  /** 批量记录列表（每班最多30-40条）*/
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchRecordDto)
  @Min(1)
  @Max(500)
  records: BatchRecordDto[];

  @IsEnum(SyncSource)
  @IsOptional()
  syncSource?: SyncSource;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  deviceName?: string;
}

/** 确认预览请求（不保存，返回预览摘要）*/
export class ConfirmPreviewDto {
  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsDateString()
  @IsNotEmpty()
  attendanceDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchRecordDto)
  @Min(1)
  @Max(500)
  records: BatchRecordDto[];
}

/** 批量撤销请求 */
export class BatchRevokeDto {
  @IsString()
  @IsNotEmpty()
  batchId: string;
}

/** Webhook 推送单条记录（生物识别设备）*/
export class WebhookRecordDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  studentName?: string;

  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @IsString()
  @IsNotEmpty()
  eventType: 'check_in' | 'check_out' | 'anomaly';

  @IsDateString()
  timestamp: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  deviceName?: string;
}

/** 生物识别设备 Webhook 推送 */
export class WebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  source: 'card' | 'face' | 'mobile';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookRecordDto)
  records: WebhookRecordDto[];
}
