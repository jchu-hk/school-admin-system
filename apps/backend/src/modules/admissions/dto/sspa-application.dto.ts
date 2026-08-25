import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SspaResult,
  SspaEdbResult,
} from '../entities/sspa-application.entity';

export class CreateSspaApplicationDto {
  @ApiProperty({ description: '批次ID' })
  @IsUUID()
  batchId: string;

  @ApiPropertyOptional({ description: '关联新生申请ID（可空）' })
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiProperty({ description: '学生姓名', example: '陳大文' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  studentNameZh: string;

  @ApiProperty({ description: '出生日期' })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ description: '学生身份证' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hkId?: string;

  @ApiProperty({ description: '家长姓名' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  parentName: string;

  @ApiProperty({ description: '联系电话' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  parentPhone: string;

  @ApiPropertyOptional({ description: '原学校' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  schoolOfOrigin?: string;

  @ApiPropertyOptional({ description: '兄弟姐妹在校' })
  @IsOptional()
  @IsBoolean()
  siblingEnrolled?: boolean;

  @ApiPropertyOptional({ description: '家长校友' })
  @IsOptional()
  @IsBoolean()
  parentAlumni?: boolean;

  @ApiPropertyOptional({ description: '其他成就说明' })
  @IsOptional()
  @IsString()
  otherAchievements?: string;
}

export class UpdateSspaApplicationDto {
  @ApiPropertyOptional({ description: '学生姓名' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  studentNameZh?: string;

  @ApiPropertyOptional({ description: '出生日期' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: '学生身份证' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hkId?: string;

  @ApiPropertyOptional({ description: '家长姓名' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  parentName?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  parentPhone?: string;

  @ApiPropertyOptional({ description: '原学校' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  schoolOfOrigin?: string;

  @ApiPropertyOptional({ description: '兄弟姐妹在校' })
  @IsOptional()
  @IsBoolean()
  siblingEnrolled?: boolean;

  @ApiPropertyOptional({ description: '家长校友' })
  @IsOptional()
  @IsBoolean()
  parentAlumni?: boolean;

  @ApiPropertyOptional({ description: '其他成就说明' })
  @IsOptional()
  @IsString()
  otherAchievements?: string;

  @ApiPropertyOptional({ description: 'EDB 结果' })
  @IsOptional()
  @IsEnum(SspaEdbResult)
  edbResult?: SspaEdbResult;
}

export class SspaApplicationQueryDto {
  @ApiPropertyOptional({ description: '批次ID筛选' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ description: '状态筛选' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '结果筛选' })
  @IsOptional()
  @IsEnum(SspaResult)
  result?: SspaResult;

  @ApiPropertyOptional({ description: '学生姓名模糊搜索' })
  @IsOptional()
  @IsString()
  search?: string;

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
