import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InquiryStatus, InquiryType } from '../inquiry.entity';

export class QueryInquiryDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: '查询类型', enum: InquiryType, required: false })
  @IsOptional()
  @IsEnum(InquiryType)
  inquiryType?: InquiryType;

  @ApiProperty({ description: '查询状态', enum: InquiryStatus, required: false })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiProperty({ description: '家长ID', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ description: '分配给', required: false })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
