import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { ApplicationStatus } from '../scholarship.entity';

export class ReviewApplicationDto {
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status: ApplicationStatus;

  @IsString()
  @IsOptional()
  reviewComment?: string;

  @IsUUID()
  @IsNotEmpty()
  reviewerId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  approvedAmount?: number;
}
