import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotificationChannel,
  NotificationUrgency,
  NotificationCategory,
} from '../template.entity';
import { RecipientType } from '../notification.entity';

// ========== 通知发送 DTO ==========

export class SendNotificationDto {
  @ApiProperty({ description: '模板ID（可选，使用模板）' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ description: '通知标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ description: '通知内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '发送渠道', enum: NotificationChannel })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiProperty({ description: '优先级', enum: NotificationUrgency })
  @IsOptional()
  @IsEnum(NotificationUrgency)
  urgency?: NotificationUrgency;

  @ApiProperty({ description: '接收者类型', enum: RecipientType })
  @IsString()
  recipientType: string;

  @ApiProperty({ description: '接收者ID列表' })
  @IsOptional()
  @IsArray()
  recipientIds?: string[];

  @ApiProperty({ description: '变量替换（key-value）' })
  @IsOptional()
  variables?: Record<string, string>;

  @ApiProperty({ description: '关联业务类型' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiProperty({ description: '关联业务ID' })
  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;

  @ApiProperty({ description: '计划发送时间（可选）' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

// ========== 模板 DTO ==========

export class CreateTemplateDto {
  @ApiProperty({ description: '模板编号' })
  @IsString()
  @MaxLength(30)
  templateCode: string;

  @ApiProperty({ description: '模板名称' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '通知类别', enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiProperty({ description: '优先级', enum: NotificationUrgency })
  @IsOptional()
  @IsEnum(NotificationUrgency)
  urgency?: NotificationUrgency;

  @ApiProperty({ description: '支持的渠道' })
  @IsArray()
  @IsString({ each: true })
  channels: string[];

  @ApiProperty({ description: '备用渠道' })
  @IsOptional()
  @IsString()
  fallbackChannel?: string;

  @ApiProperty({ description: '微信模板ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  wechatTemplateId?: string;

  @ApiProperty({ description: 'APP推送标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  appPushTitle?: string;

  @ApiProperty({ description: 'APP推送内容（支持变量{{var}}）' })
  @IsOptional()
  @IsString()
  appPushContent?: string;

  @ApiProperty({ description: '短信内容（支持变量）' })
  @IsOptional()
  @IsString()
  smsContent?: string;

  @ApiProperty({ description: '邮件标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emailSubject?: string;

  @ApiProperty({ description: '邮件正文（支持变量）' })
  @IsOptional()
  @IsString()
  emailBody?: string;

  @ApiProperty({ description: 'WhatsApp内容（支持变量）' })
  @IsOptional()
  @IsString()
  whatsappContent?: string;

  @ApiProperty({ description: '变量列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @ApiProperty({ description: '最小发送间隔（分钟）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minIntervalMinutes?: number;

  @ApiProperty({ description: '每个家长每天最大发送次数' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxDailyPerParent?: number;

  @ApiProperty({ description: '免打扰开始时间（如 21:00）' })
  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @ApiProperty({ description: '免打扰结束时间（如 07:00）' })
  @IsOptional()
  @IsString()
  quietHoursEnd?: string;
}

export class UpdateTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ description: '优先级' })
  @IsOptional()
  @IsEnum(NotificationUrgency)
  urgency?: NotificationUrgency;

  @ApiProperty({ description: '支持的渠道' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];

  @ApiProperty({ description: 'APP推送标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  appPushTitle?: string;

  @ApiProperty({ description: 'APP推送内容' })
  @IsOptional()
  @IsString()
  appPushContent?: string;

  @ApiProperty({ description: '短信内容' })
  @IsOptional()
  @IsString()
  smsContent?: string;

  @ApiProperty({ description: '邮件标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emailSubject?: string;

  @ApiProperty({ description: '邮件正文' })
  @IsOptional()
  @IsString()
  emailBody?: string;

  @ApiProperty({ description: 'WhatsApp内容' })
  @IsOptional()
  @IsString()
  whatsappContent?: string;

  @ApiProperty({ description: '是否启用' })
  @IsOptional()
  isActive?: boolean;
}

// ========== 查询 DTO ==========

export class NotificationQueryDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({ description: '通知渠道', required: false })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiProperty({ description: '通知状态', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class DeliveryQueryDto {
  @ApiProperty({ description: '通知ID' })
  @IsUUID()
  notificationId: string;

  @ApiProperty({ description: '送达状态', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
