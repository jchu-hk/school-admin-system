import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Gender, StudentStatus, AllocationType } from '../student.entity';

// ============ Student DTOs ============

export class CreateStudentDto {
  @ApiProperty({ description: '中文姓名', example: '王小明' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name_zh: string;

  @ApiPropertyOptional({ description: '英文姓名', example: 'WONG SIU MING' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name_en?: string;

  @ApiProperty({ description: '性别', enum: Gender, example: 'male' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    description: '学号（留空则自动生成，学号唯一即使软删除后也不可重用）',
    example: '2026-0001',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  student_id?: string;

  @ApiProperty({ description: '出生日期', example: '2011-03-15' })
  @IsDateString()
  birth_date: string;

  @ApiPropertyOptional({
    description: '家庭地址',
    example: '香港仔田灣大樓A座12樓',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: '联系电话', example: '91234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'parent@example.com' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ description: '入学日期', example: '2026-09-01' })
  @IsDateString()
  admission_date: string;

  @ApiPropertyOptional({ description: '监护人姓名', example: '王大明' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  guardian_name?: string;

  @ApiPropertyOptional({ description: '监护人电话', example: '91234568' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  guardian_phone?: string;

  @ApiPropertyOptional({ description: '监护人关系', example: '父亲' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  guardian_relationship?: string;

  @ApiPropertyOptional({ description: '紧急联系人', example: '王小華' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  emergency_contact?: string;

  @ApiPropertyOptional({ description: '紧急联系电话', example: '91234569' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  emergency_phone?: string;

  @ApiPropertyOptional({ description: '香港身份证', example: 'A123456(7)' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  hk_id?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: '是否同时创建系统账户（默认false）',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  create_user_account?: boolean;

  @ApiPropertyOptional({ description: '班级ID（可选，创建后将通过班级分配接口分配班级）' })
  @IsString()
  @IsOptional()
  class_id?: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ description: '中文姓名' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name_zh?: string;

  @ApiPropertyOptional({ description: '英文姓名' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name_en?: string;

  @ApiPropertyOptional({ description: '性别', enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: '出生日期' })
  @IsDateString()
  @IsOptional()
  birth_date?: string;

  @ApiPropertyOptional({ description: '家庭地址' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: '监护人姓名' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  guardian_name?: string;

  @ApiPropertyOptional({ description: '监护人电话' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  guardian_phone?: string;

  @ApiPropertyOptional({ description: '监护人关系' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  guardian_relationship?: string;

  @ApiPropertyOptional({ description: '紧急联系人' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  emergency_contact?: string;

  @ApiPropertyOptional({ description: '紧急联系电话' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  emergency_phone?: string;

  @ApiPropertyOptional({ description: '香港身份证' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  hk_id?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: '状态', enum: StudentStatus })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  class_id?: string;
}

export class StudentQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ description: '搜索关键词（姓名、学号）' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  class_id?: string;

  @ApiPropertyOptional({ description: '学年', example: '2026-2027' })
  @IsString()
  @IsOptional()
  academic_year?: string;

  @ApiPropertyOptional({ description: '状态', enum: StudentStatus })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;

  @ApiPropertyOptional({ description: '性别', enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: '排序字段', default: 'created_at' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: '排序方向',
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

// ============ Class Allocation DTOs ============

export class CreateClassAllocationDto {
  @ApiProperty({ description: '班级ID' })
  @IsUUID()
  class_id: string;

  @ApiProperty({ description: '学年ID' })
  @IsUUID()
  academic_year_id: string;

  @ApiPropertyOptional({
    description: '分配类型',
    enum: AllocationType,
    default: AllocationType.MAIN,
  })
  @IsEnum(AllocationType)
  @IsOptional()
  allocation_type?: AllocationType;

  @ApiProperty({ description: '生效日期', example: '2026-09-01' })
  @IsDateString()
  effective_date: string;
}

export class ClassAllocationQueryDto {
  @ApiPropertyOptional({ description: '学年', example: '2026-2027' })
  @IsString()
  @IsOptional()
  academic_year?: string;
}
