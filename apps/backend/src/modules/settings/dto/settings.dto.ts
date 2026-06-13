import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// SystemConfig DTOs
export class CreateSystemConfigDto {
  @ApiProperty({ description: '配置键' })
  @IsString()
  @MaxLength(100)
  key: string;

  @ApiProperty({ description: '配置值' })
  @IsString()
  value: string;

  @ApiProperty({ description: '配置类别' })
  @IsString()
  @MaxLength(50)
  category: string;

  @ApiPropertyOptional({ description: '配置描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '配置类型',
    enum: ['string', 'number', 'boolean', 'json'],
  })
  @IsOptional()
  @IsEnum(['string', 'number', 'boolean', 'json'])
  type?: 'string' | 'number' | 'boolean' | 'json';
}

export class UpdateSystemConfigDto {
  @ApiPropertyOptional({ description: '配置值' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: '配置描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

// SystemLog DTOs
export class CreateSystemLogDto {
  @ApiProperty({ description: '日志级别' })
  @IsEnum(['info', 'warn', 'error'])
  level: 'info' | 'warn' | 'error';

  @ApiProperty({ description: '日志消息' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: '模块名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  module?: string;

  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '元数据' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'IP地址' })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class SystemLogQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '日志级别' })
  @IsOptional()
  @IsEnum(['info', 'warn', 'error'])
  level?: 'info' | 'warn' | 'error';

  @ApiPropertyOptional({ description: '模块' })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  endTime?: string;
}

// SystemUser DTOs
export class CreateSystemUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @MaxLength(100)
  username: string;

  @ApiProperty({ description: '邮箱' })
  @IsString()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ description: '密码' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: '角色' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: '电话' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '部门' })
  @IsOptional()
  @IsString()
  department?: string;
}

export class UpdateSystemUserDto {
  @ApiPropertyOptional({ description: '用户名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: '密码' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: '角色' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ description: '电话' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '部门' })
  @IsOptional()
  @IsString()
  department?: string;
}

export class SystemUserQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '角色' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
