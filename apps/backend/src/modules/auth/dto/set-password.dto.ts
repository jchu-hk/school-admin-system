import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({ description: '旧密码（首次设置时可选）', required: false })
  @IsString()
  oldPassword?: string;

  @ApiProperty({ description: '新密码', minLength: 8, maxLength: 32 })
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(32, { message: '密码最多32个字符' })
  newPassword: string;

  @ApiProperty({ description: '确认密码' })
  @IsString()
  @IsNotEmpty({ message: '确认密码不能为空' })
  confirmPassword: string;
}
