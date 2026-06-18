import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsPhoneNumber } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: '手机号', required: false })
  @IsString()
  phone?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsString()
  email?: string;

  @ApiProperty({ description: 'OTP验证码', minLength: 6, maxLength: 6 })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @MinLength(6, { message: '验证码为6位数字' })
  @MaxLength(6, { message: '验证码为6位数字' })
  otp: string;

  @ApiProperty({ description: '新密码', minLength: 8, maxLength: 32 })
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(32, { message: '密码最多32个字符' })
  newPassword: string;
}
