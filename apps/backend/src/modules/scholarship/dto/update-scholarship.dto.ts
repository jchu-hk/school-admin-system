import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
} from 'class-validator';
import { ScholarshipStatus } from '../scholarship.entity';

export class UpdateScholarshipDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  scholarshipType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  totalQuota?: number;

  @IsDateString()
  @IsOptional()
  applicationStartDate?: string;

  @IsDateString()
  @IsOptional()
  applicationEndDate?: string;

  @IsDateString()
  @IsOptional()
  disbursementStartDate?: string;

  @IsDateString()
  @IsOptional()
  disbursementEndDate?: string;

  @IsEnum(ScholarshipStatus)
  @IsOptional()
  status?: ScholarshipStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eligibleGrades?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eligibleClasses?: string[];

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}
