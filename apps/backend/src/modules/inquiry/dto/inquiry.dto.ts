import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import {
  InquiryCategory,
  InquiryChannel,
  InquiryPriority,
  InquiryStatus,
} from '../inquiry.entity';

export class CreateInquiryDto {
  @ApiProperty({ description: '家长ID' })
  @IsUUID()
  parentId: string;

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
