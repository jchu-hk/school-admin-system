import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressBookDto {
  @ApiProperty({ description: '联系人姓名' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '联系人类型', enum: ['teacher', 'staff', 'parent', 'student', 'other'] })
  @IsEnum(['teacher', 'staff', 'parent', 'student', 'other'])
  contactType: 'teacher' | 'staff' | 'parent' | 'student' | 'other';

  @ApiPropertyOptional({ description: '部门/班级' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: '职位/角色' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobile?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: 'WhatsApp号' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  whatsapp?: string;

  @ApiPropertyOptional({ description: '家庭地址' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  homeAddress?: string;

  @ApiPropertyOptional({ description: '紧急联系人姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: '紧急联系人电话' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: '与紧急联系人的关系' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: '是否收藏/星标' })
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '关联用户ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '所属学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;
}

export class UpdateAddressBookDto {
  @ApiPropertyOptional({ description: '联系人姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '联系人类型', enum: ['teacher', 'staff', 'parent', 'student', 'other'] })
  @IsOptional()
  @IsEnum(['teacher', 'staff', 'parent', 'student', 'other'])
  contactType?: 'teacher' | 'staff' | 'parent' | 'student' | 'other';

  @ApiPropertyOptional({ description: '部门/班级' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: '职位/角色' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobile?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: 'WhatsApp号' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  whatsapp?: string;

  @ApiPropertyOptional({ description: '家庭地址' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  homeAddress?: string;

  @ApiPropertyOptional({ description: '紧急联系人姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: '紧急联系人电话' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: '与紧急联系人的关系' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: '是否收藏/星标' })
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '关联用户ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '所属学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;
}

export class AddressBookQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '联系人类型' })
  @IsOptional()
  @IsEnum(['teacher', 'staff', 'parent', 'student', 'other'])
  contactType?: 'teacher' | 'staff' | 'parent' | 'student' | 'other';

  @ApiPropertyOptional({ description: '部门/班级' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '搜索关键词(姓名/电话/邮箱)' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '是否只显示星标' })
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '所属学校ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;
}
