import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { GradeType, GradeScale } from '../grade.entity'

export class CreateGradeDto {
  @ApiProperty({ description: '学生ID' })
  @IsUUID()
  studentId: string

  @ApiProperty({ description: '课程ID' })
  @IsString()
  courseId: string

  @ApiProperty({ description: '学期' })
  @IsString()
  term: string

  @ApiProperty({ description: '成绩类型' })
  @IsEnum(GradeType)
  type: GradeType

  @ApiProperty({ description: '成绩名称' })
  @IsString()
  title: string

  @ApiProperty({ description: '成绩分数' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number

  @ApiPropertyOptional({ description: '满分' })
  @IsOptional()
  @IsNumber()
  maxScore?: number

  @ApiPropertyOptional({ description: '等级' })
  @IsOptional()
  @IsEnum(GradeScale)
  grade?: GradeScale

  @ApiPropertyOptional({ description: '教师ID' })
  @IsOptional()
  @IsUUID()
  teacherId?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string
}

export class QueryGradesDto {
  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @IsString()
  page?: string

  @ApiPropertyOptional({ description: '每页数量' })
  @IsOptional()
  @IsString()
  pageSize?: string

  @ApiPropertyOptional({ description: '学生ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string

  @ApiPropertyOptional({ description: '课程ID' })
  @IsOptional()
  @IsString()
  courseId?: string

  @ApiPropertyOptional({ description: '学期' })
  @IsOptional()
  @IsString()
  term?: string

  @ApiPropertyOptional({ description: '成绩类型' })
  @IsOptional()
  @IsEnum(GradeType)
  type?: GradeType
}
