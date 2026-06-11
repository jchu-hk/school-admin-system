import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ScholarshipStatus } from '../scholarship.entity';

export class CreateScholarshipDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  scholarshipType: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  totalQuota?: number;

  @IsDateString()
  @IsNotEmpty()
  applicationStartDate: string;

  @IsDateString()
  @IsNotEmpty()
  applicationEndDate: string;

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
  @IsNotEmpty()
  createdBy: string;
}
