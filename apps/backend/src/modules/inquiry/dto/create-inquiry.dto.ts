import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID, MaxLength, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InquiryType } from '../inquiry.entity';

export class CreateInquiryDto {
  @ApiProperty({ description: '查询类型', enum: InquiryType })
  @IsNotEmpty()
  @IsEnum(InquiryType)
  inquiryType: InquiryType;

  @ApiProperty({ description: '查询标题', maxLength: 200 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '查询内容' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: '关联学生ID', required: false })
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
