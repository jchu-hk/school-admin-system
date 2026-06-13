import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: '课程代码', example: 'MATH-2024-01' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: '课程名称', example: '高中数学' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '年级', example: '中四' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  grade: string;

  @ApiProperty({ description: '科目', example: '数学' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  subject: string;

  @ApiProperty({ description: '授课教师', example: '张老师' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  teacher: string;

  @ApiProperty({ description: '教室', example: 'A-101' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  classroom: string;

  @ApiProperty({ description: '上课时间', example: '周一 9:00-10:30' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  schedule: string;

  @ApiProperty({ description: '容量', example: 30 })
  @IsNumber()
  @Min(1)
  @Max(100)
  capacity: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ description: '课程描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ description: '课程代码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: '课程名称' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @ApiPropertyOptional({ description: '科目' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subject?: string;

  @ApiPropertyOptional({ description: '授课教师' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teacher?: string;

  @ApiPropertyOptional({ description: '教室' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  classroom?: string;

  @ApiPropertyOptional({ description: '上课时间' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  schedule?: string;

  @ApiPropertyOptional({ description: '容量' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  capacity?: number;

  @ApiPropertyOptional({ description: '已选人数' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  enrolled?: number;

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ description: '课程描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CourseQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '搜索关键词（课程名称或代码）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: '科目' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
