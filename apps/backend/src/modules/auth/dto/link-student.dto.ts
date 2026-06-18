import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { RelationshipType } from '../entities/parent-student-link.entity';

export class LinkStudentDto {
  @ApiProperty({ description: '学生ID' })
  @IsString()
  @IsNotEmpty({ message: '学生ID不能为空' })
  studentId: string;

  @ApiProperty({ description: '关系', enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;

  @ApiProperty({ description: '是否为主要联系人', default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class LinkedStudentResponseDto {
  id: string;
  studentId: string;
  studentName?: string;
  relationship: string;
  isPrimary: boolean;
  verifiedAt: Date | null;
}
