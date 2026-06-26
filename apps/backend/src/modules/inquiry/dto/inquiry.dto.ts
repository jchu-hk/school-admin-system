import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  IsNumber,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import {
  InquiryCategory,
  InquiryChannel,
  InquiryPriority,
  InquiryStatus,
  InquirySentiment,
  TransferStatus,
  TimeoutWarningLevel,
} from '../inquiry.entity';

export class CreateInquiryDto {
  @ApiProperty({ description: '家长ID', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ description: '关联学生ID', required: false })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiProperty({ description: '查询类别', enum: InquiryCategory })
  @IsEnum(InquiryCategory)
  category: InquiryCategory;

  @ApiProperty({ description: '查询主题', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ description: '查询内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '附件URL（图片/语音）', required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty({ description: '提交渠道', enum: InquiryChannel })
  @IsOptional()
  @IsEnum(InquiryChannel)
  channel?: InquiryChannel;

  @ApiProperty({ description: '优先级', enum: InquiryPriority })
  @IsOptional()
  @IsEnum(InquiryPriority)
  priority?: InquiryPriority;

  @ApiProperty({ description: '通话时长（分钟）', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  callDurationMinutes?: number;

  @ApiProperty({ description: '通话结果', required: false })
  @IsOptional()
  @IsString()
  callResult?: string;
}

export class UpdateInquiryDto {
  @ApiProperty({ description: '处理状态', enum: InquiryStatus })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiProperty({ description: '分配给谁处理' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiProperty({ description: '是否升级处理' })
  @IsOptional()
  @IsBoolean()
  escalationRequired?: boolean;

  @ApiProperty({ description: 'AI分析结果-意图分类', required: false })
  @IsOptional()
  @IsString()
  aiIntent?: string;

  @ApiProperty({ description: 'AI分析结果-情感倾向', required: false })
  @IsOptional()
  @IsString()
  aiSentiment?: string;

  @ApiProperty({ description: 'AI分析结果-置信度', required: false })
  @IsOptional()
  @IsNumber()
  aiConfidence?: number;

  @ApiProperty({ description: 'AI建议回复', required: false })
  @IsOptional()
  @IsString()
  aiSuggestedResponse?: string;
}

export class SatisfactionDto {
  @ApiProperty({ description: '满意度评分（1-5）' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: '满意度评价内容', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateReplyDto {
  @ApiProperty({ description: '回复内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '是否为AI生成' })
  @IsOptional()
  isAiGenerated?: boolean;
}

export class CreateTemplateDto {
  @ApiProperty({ description: '模板标题' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: '模板内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '模板分类' })
  @IsString()
  category?: string;
}

export class InquiryQueryDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({
    description: '查询类别',
    enum: InquiryCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(InquiryCategory)
  category?: InquiryCategory;

  @ApiProperty({
    description: '处理状态',
    enum: InquiryStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiProperty({
    description: '优先级',
    enum: InquiryPriority,
    required: false,
  })
  @IsOptional()
  @IsEnum(InquiryPriority)
  priority?: InquiryPriority;

  @ApiProperty({ description: '分配给谁', required: false })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}

// AC-04: 超时警告查询结果
export class TimeoutWarningDto {
  @ApiProperty({ description: '查询ID' })
  inquiryId: string;

  @ApiProperty({ description: '查询编号' })
  inquiryNo: string;

  @ApiProperty({ description: '家长名称' })
  parentName: string;

  @ApiProperty({ description: '类别' })
  category: InquiryCategory;

  @ApiProperty({ description: '等待时长(分钟)' })
  waitingMinutes: number;

  @ApiProperty({ description: '警告级别', enum: TimeoutWarningLevel })
  warningLevel: string;
}

// AC-04: 超时警告响应
export class TimeoutWarningsResponseDto {
  @ApiProperty({ description: '警告级别统计' })
  warningCounts: {
    total: number;
    warning: number;
    critical: number;
  };

  @ApiProperty({ description: '警告列表' })
  warnings: TimeoutWarningDto[];
}

// AC-05: 快速回复请求
export class QuickReplyDto {
  @ApiProperty({ description: '回复内容' })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiProperty({ description: '是否自动发送(AI回复)', required: false })
  @IsOptional()
  @IsBoolean()
  autoSend?: boolean;
}

// AC-06: 转交查询DTO
export class TransferInquiryDto {
  @ApiProperty({ description: '转交目标用户ID' })
  @IsUUID()
  transferTo: string;

  @ApiProperty({ description: '转交原因' })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiProperty({ description: '转交目标部门名称', required: false })
  @IsOptional()
  @IsString()
  departmentName?: string;
}

// AC-06: 转交历史记录
export class TransferHistoryDto {
  @ApiProperty({ description: '转交ID' })
  id: string;

  @ApiProperty({ description: '查询ID' })
  inquiryId: string;

  @ApiProperty({ description: '原处理人' })
  fromOfficerName: string;

  @ApiProperty({ description: '新处理人' })
  toOfficerName: string;

  @ApiProperty({ description: '转交原因' })
  reason: string;

  @ApiProperty({ description: '转交状态' })
  status: TransferStatus;

  @ApiProperty({ description: '转交时间' })
  transferredAt: Date;
}

// AC-01: 通话记录DTO
export class CallLogDto {
  @ApiProperty({ description: '通话时长(分钟)' })
  @IsInt()
  @Min(0)
  callDurationMinutes: number;

  @ApiProperty({ description: '通话结果', required: false })
  @IsOptional()
  @IsString()
  callResult?: string;

  @ApiProperty({ description: '家长情绪', enum: InquirySentiment })
  @IsEnum(InquirySentiment)
  sentiment: InquirySentiment;

  @ApiProperty({ description: '备注(不包含敏感内容)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// 队列项DTO (用于队列视图)
export class QueueItemDto {
  @ApiProperty({ description: '查询ID' })
  id: string;

  @ApiProperty({ description: '查询编号' })
  inquiryNo: string;

  @ApiProperty({ description: '家长名称' })
  parentName: string;

  @ApiProperty({ description: '类别' })
  category: InquiryCategory;

  @ApiProperty({ description: '渠道' })
  channel: InquiryChannel;

  @ApiProperty({ description: '优先级' })
  priority: InquiryPriority;

  @ApiProperty({ description: '状态' })
  status: InquiryStatus;

  @ApiProperty({ description: 'AI意图分类' })
  aiIntent: string;

  @ApiProperty({ description: '情绪' })
  sentiment: InquirySentiment;

  @ApiProperty({ description: '等待处理时长(分钟)' })
  waitingMinutes: number;

  @ApiProperty({ description: '超时警告级别' })
  timeoutWarning: string;

  @ApiProperty({ description: '是否升级' })
  escalationRequired: boolean;

  @ApiProperty({ description: '是否可自动回复' })
  autoResponseEligible: boolean;

  @ApiProperty({ description: 'AI建议回复' })
  aiSuggestedResponse: string;

  @ApiProperty({ description: '已分配给' })
  assignedToName: string;

  @ApiProperty({ description: '提交时间' })
  submittedAt: Date;
}

// 队列响应DTO
export class QueueResponseDto {
  @ApiProperty({ description: '队列统计' })
  stats: {
    total: number;
    pending: number;
    processing: number;
    autoReplied: number;
    escalated: number;
    timeoutWarning: number;
    timeoutCritical: number;
  };

  @ApiProperty({ description: '队列列表' })
  items: QueueItemDto[];

  @ApiProperty({ description: '总数' })
  total: number;
}

// 队列查询DTO
export class QueueQueryDto {
  @ApiProperty({ description: '分配给谁', required: false })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiProperty({ description: '是否只看超时警告', required: false })
  @IsOptional()
  @IsBoolean()
  timeoutOnly?: boolean;

  @ApiProperty({ description: '是否只看升级', required: false })
  @IsOptional()
  @IsBoolean()
  escalatedOnly?: boolean;

  @ApiProperty({ description: '排序方式', required: false })
  @IsOptional()
  @IsString()
  sortBy?: 'waitingMinutes' | 'priority' | 'submittedAt';

  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}
