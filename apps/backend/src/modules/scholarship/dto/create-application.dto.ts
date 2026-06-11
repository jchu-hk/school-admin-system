import { IsString, IsUUID, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  scholarshipId: string;

  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  applicationReason?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
