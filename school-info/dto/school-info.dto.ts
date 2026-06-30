import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSchoolInfoDto {
  @ApiProperty({ description: '学校名称' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: '学校英文名称' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ description: '学校地址' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: '传真号码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  fax?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: '学校网址' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiProperty({ description: '学校类型', enum: ['primary', 'secondary', 'kindergarten', 'international'] })
  @IsEnum(['primary', 'secondary', 'kindergarten', 'international'])
  schoolType: 'primary' | 'secondary' | 'kindergarten' | 'international';

  @ApiPropertyOptional({ description: '学校代码' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  schoolCode?: string;

  @ApiPropertyOptional({ description: '办学许可证号' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNo?: string;

  @ApiPropertyOptional({ description: '成立日期' })
  @IsOptional()
  @IsString()
  establishedDate?: string;

  @ApiPropertyOptional({ description: '校长姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  principalName?: string;

  @ApiPropertyOptional({ description: '副校长姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vicePrincipalName?: string;

  @ApiPropertyOptional({ description: '学校简介' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '办学理念' })
  @IsOptional()
  @IsString()
  mission?: string;

  @ApiPropertyOptional({ description: '校徽URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ description: '学校照片URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateSchoolInfoDto {
  @ApiPropertyOptional({ description: '学校名称' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: '学校英文名称' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ description: '学校地址' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: '传真号码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  fax?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: '学校网址' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({ description: '学校类型', enum: ['primary', 'secondary', 'kindergarten', 'international'] })
  @IsOptional()
  @IsEnum(['primary', 'secondary', 'kindergarten', 'international'])
  schoolType?: 'primary' | 'secondary' | 'kindergarten' | 'international';

  @ApiPropertyOptional({ description: '学校代码' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  schoolCode?: string;

  @ApiPropertyOptional({ description: '办学许可证号' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNo?: string;

  @ApiPropertyOptional({ description: '成立日期' })
  @IsOptional()
  @IsString()
  establishedDate?: string;

  @ApiPropertyOptional({ description: '校长姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  principalName?: string;

  @ApiPropertyOptional({ description: '副校长姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vicePrincipalName?: string;

  @ApiPropertyOptional({ description: '学校简介' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '办学理念' })
  @IsOptional()
  @IsString()
  mission?: string;

  @ApiPropertyOptional({ description: '校徽URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ description: '学校照片URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SchoolInfoQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '学校类型' })
  @IsOptional()
  @IsEnum(['primary', 'secondary', 'kindergarten', 'international'])
  schoolType?: 'primary' | 'secondary' | 'kindergarten' | 'international';

  @ApiPropertyOptional({ description: '搜索关键词(名称/代码)' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
