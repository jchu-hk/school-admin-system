import { IsString, IsEnum, IsOptional, IsUUID, IsInt, IsBoolean } from 'class-validator';
import { InquiryType, InquiryStatus, InquiryPriority } from '../inquiry.entity';

// Re-export enums for convenience
export { InquiryType, InquiryStatus, InquiryPriority };

export class CreateInquiryDto {
  @IsUUID()
  parentId: string;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsEnum(InquiryType)
  inquiryType: InquiryType;

  @IsString()
  title: string;

  @IsString()
  content: string;
}

export class UpdateInquiryDto {
  @IsEnum(InquiryStatus)
  @IsOptional()
  status?: InquiryStatus;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsInt()
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  ratingComment?: string;

  @IsEnum(InquiryPriority)
  @IsOptional()
  priority?: InquiryPriority;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;
}

export class CreateInquiryReplyDto {
  @IsUUID()
  inquiryId: string;

  @IsString()
  content: string;
}

export class InquiryQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsEnum(InquiryStatus)
  @IsOptional()
  status?: InquiryStatus;

  @IsEnum(InquiryType)
  @IsOptional()
  inquiryType?: InquiryType;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsEnum(InquiryPriority)
  @IsOptional()
  priority?: InquiryPriority;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;
}
