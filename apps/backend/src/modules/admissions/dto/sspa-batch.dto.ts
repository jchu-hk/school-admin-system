import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSspaBatchDto {
  @ApiProperty({ description: '年度，如 2026-2027', example: '2026-2027' })
  @IsString()
  @MinLength(7)
  @MaxLength(9)
  year: string;

  @ApiProperty({ description: '批次名称', example: '中一自行分配 2026/27' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: '评分权重（学业30/面试30/兄弟10/校友5/成就10/酌情15）',
    example: {
      academic: 30,
      interview: 30,
      sibling: 10,
      alumni: 5,
      achievement: 10,
      principal_discretion: 15,
    },
  })
  @IsOptional()
  @IsObject()
  scoringWeights?: Record<string, number>;

  @ApiProperty({ description: '学额' })
  @IsNumber()
  @Min(1)
  seats: number;

  @ApiPropertyOptional({ description: '申请表开放日' })
  @IsOptional()
  @IsDateString()
  openAt?: string;

  @ApiPropertyOptional({ description: '面试日' })
  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @ApiPropertyOptional({ description: '公布日期' })
  @IsOptional()
  @IsDateString()
  announcementDate?: string;
}

export class UpdateSspaBatchDto {
  @ApiPropertyOptional({ description: '批次名称' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '评分权重' })
  @IsOptional()
  @IsObject()
  scoringWeights?: Record<string, number>;

  @ApiPropertyOptional({ description: '学额' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  seats?: number;

  @ApiPropertyOptional({ description: '申请表开放日' })
  @IsOptional()
  @IsDateString()
  openAt?: string;

  @ApiPropertyOptional({ description: '面试日' })
  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @ApiPropertyOptional({ description: '公布日期' })
  @IsOptional()
  @IsDateString()
  announcementDate?: string;
}

export class SspaBatchQueryDto {
  @ApiPropertyOptional({ description: '年度筛选' })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiPropertyOptional({ description: '批次状态筛选' })
  @IsOptional()
  @IsString()
  status?: string;

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
