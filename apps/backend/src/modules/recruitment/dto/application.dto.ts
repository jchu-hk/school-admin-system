import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsEmail,
  Min,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../recruitment-application.entity';

export class EducationDto {
  @ApiProperty({ description: '学位', example: '学士' })
  @IsString()
  @MinLength(1)
  degree: string;

  @ApiProperty({ description: '学校', example: '香港中文大学' })
  @IsString()
  @MinLength(1)
  school: string;

  @ApiProperty({ description: '专业', example: '中文' })
  @IsString()
  @MinLength(1)
  major: string;

  @ApiProperty({ description: '毕业年份', example: '2015' })
  @IsString()
  year: string;
}

export class ExperienceDto {
  @ApiProperty({ description: '公司/学校', example: 'XX中学' })
  @IsString()
  @MinLength(1)
  company: string;

  @ApiProperty({ description: '职位', example: '中文科教师' })
  @IsString()
  @MinLength(1)
  position: string;

  @ApiProperty({ description: '时间段', example: '2015-2020' })
  @IsString()
  duration: string;

  @ApiProperty({ description: '工作描述', example: '教授中一至中三中文科' })
  @IsString()
  description: string;
}

export class CreateApplicationDto {
  @ApiProperty({ description: '职位ID' })
  @IsString()
  @IsNotEmpty()
  positionId: string;

  @ApiProperty({ description: '申请人姓名' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  applicantName: string;

  @ApiProperty({ description: '邮箱' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '电话' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  phone: string;

  @ApiPropertyOptional({ description: '简历文件URL' })
  @IsOptional()
  @IsString()
  cvUrl?: string;

  @ApiPropertyOptional({ description: '简历文件名' })
  @IsOptional()
  @IsString()
  cvFilename?: string;

  @ApiPropertyOptional({ description: '求职信' })
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiProperty({ description: '教育背景' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education: EducationDto[];

  @ApiPropertyOptional({ description: '工作经历' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];
}

export class UpdateApplicationStatusDto {
  @ApiProperty({ description: '新状态' })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({ description: '筛选备注' })
  @IsOptional()
  @IsString()
  screeningNotes?: string;
}

export class RejectApplicationDto {
  @ApiPropertyOptional({ description: '拒绝原因' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class ApplicationQueryDto {
  @ApiPropertyOptional({ description: '职位ID筛选' })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiPropertyOptional({ description: '申请状态筛选' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '关键词搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 20;
}
