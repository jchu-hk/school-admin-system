import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  Matches,
  IsUUID,
} from 'class-validator';
import { UserRole, UserStatus } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  username: string;

  @ApiProperty({ description: '姓名' })
  @IsString()
  name: string;

  @ApiProperty({ description: '香港身份证号', example: 'A123456(7)' })
  @IsOptional()
  @Matches(/^[A-Z][0-9]{6}\([0-9A]\)$/, { message: '香港身份证格式不正确' })
  hkId?: string;

  @ApiProperty({ description: '手机号', example: '85291234567' })
  @IsOptional()
  @Matches(/^852[0-9]{8}$/, {
    message: '香港手机号格式不正确，应为852开头加8位数字',
  })
  phone?: string;

  @ApiProperty({ description: '邮箱' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'WhatsApp号' })
  @IsOptional()
  @Matches(/^852[0-9]{8}$/, {
    message: 'WhatsApp号格式不正确，应为852开头加8位数字',
  })
  whatsapp?: string;

  @ApiProperty({ description: '所属班级' })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiProperty({ description: '关联学生ID（家长角色使用）' })
  @IsOptional()
  @IsUUID()
  relatedStudentId?: string;

  @ApiProperty({ description: '用户角色', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: '用户状态',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ description: '初始密码' })
  @IsString()
  password: string;
}
