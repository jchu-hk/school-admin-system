import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { EnrollmentStatus } from '../student-profile.entity';

export class CreateStudentProfileDto {
  @ApiPropertyOptional({ description: '学生用户ID' })
  @IsString()
  studentId: string;

  @ApiPropertyOptional({ description: '入学日期' })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @ApiPropertyOptional({ description: '学籍状态', enum: EnrollmentStatus })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  enrollmentStatus?: EnrollmentStatus;

  @ApiPropertyOptional({ description: '原就读学校' })
  @IsOptional()
  @IsString()
  previousSchool?: string;

  @ApiPropertyOptional({ description: '入学年级' })
  @IsOptional()
  @IsString()
  admissionGrade?: string;

  @ApiPropertyOptional({ description: '在学年级' })
  @IsOptional()
  @IsString()
  currentGrade?: string;

  @ApiPropertyOptional({ description: '毕业日期' })
  @IsOptional()
  @IsDateString()
  graduationDate?: string;

  @ApiPropertyOptional({ description: '在学证明编号' })
  @IsOptional()
  @IsString()
  enrollmentCertNo?: string;

  @ApiPropertyOptional({ description: '是否有过敏史' })
  @IsOptional()
  @IsBoolean()
  hasAllergy?: boolean;

  @ApiPropertyOptional({ description: '过敏原列表（JSON数组）' })
  @IsOptional()
  @IsString()
  allergens?: string;

  @ApiPropertyOptional({ description: '是否有长期用药' })
  @IsOptional()
  @IsBoolean()
  hasLongTermMedication?: boolean;

  @ApiPropertyOptional({ description: '长期用药说明' })
  @IsOptional()
  @IsString()
  longTermMedicationNotes?: string;

  @ApiPropertyOptional({ description: '是否有特殊健康需求（SEN）' })
  @IsOptional()
  @IsBoolean()
  hasSen?: boolean;

  @ApiPropertyOptional({ description: 'SEN类型' })
  @IsOptional()
  @IsString()
  senType?: string;

  @ApiPropertyOptional({ description: '紧急联系人姓名' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: '紧急联系人电话' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: '紧急联系人关系' })
  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;
}

export class UpdateStudentProfileDto {
  @ApiPropertyOptional({ description: '入学日期' })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @ApiPropertyOptional({ description: '学籍状态', enum: EnrollmentStatus })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  enrollmentStatus?: EnrollmentStatus;

  @ApiPropertyOptional({ description: '原就读学校' })
  @IsOptional()
  @IsString()
  previousSchool?: string;

  @ApiPropertyOptional({ description: '在学年级' })
  @IsOptional()
  @IsString()
  currentGrade?: string;

  @ApiPropertyOptional({ description: '毕业日期' })
  @IsOptional()
  @IsDateString()
  graduationDate?: string;

  @ApiPropertyOptional({ description: '在学证明编号' })
  @IsOptional()
  @IsString()
  enrollmentCertNo?: string;

  @ApiPropertyOptional({ description: '是否有过敏史' })
  @IsOptional()
  @IsBoolean()
  hasAllergy?: boolean;

  @ApiPropertyOptional({ description: '过敏原列表（JSON数组）' })
  @IsOptional()
  @IsString()
  allergens?: string;

  @ApiPropertyOptional({ description: '是否有长期用药' })
  @IsOptional()
  @IsBoolean()
  hasLongTermMedication?: boolean;

  @ApiPropertyOptional({ description: '长期用药说明' })
  @IsOptional()
  @IsString()
  longTermMedicationNotes?: string;

  @ApiPropertyOptional({ description: '是否有特殊健康需求（SEN）' })
  @IsOptional()
  @IsBoolean()
  hasSen?: boolean;

  @ApiPropertyOptional({ description: 'SEN类型' })
  @IsOptional()
  @IsString()
  senType?: string;

  @ApiPropertyOptional({ description: '紧急联系人姓名' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: '紧急联系人电话' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: '紧急联系人关系' })
  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ description: '归档档案' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ description: '归档原因' })
  @IsOptional()
  @IsString()
  archiveReason?: string;
}

export class ArchiveStudentProfileDto {
  @ApiProperty({ description: '归档原因' })
  @IsString()
  archiveReason: string;
}
