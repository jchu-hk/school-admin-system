import { IsString, IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpType } from '../../otp/entities/otp.entity';

export class VerifyOtpDto {
  @ApiProperty({ description: '临时token', example: 'temp-token-xxx' })
  @IsString()
  @IsNotEmpty({ message: '临时token不能为空' })
  tempToken: string;

  @ApiProperty({ description: 'OTP验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'OTP验证码不能为空' })
  code: string;

  @ApiProperty({ description: 'OTP类型', enum: OtpType, example: OtpType.GOOGLE_AUTHENTICATOR })
  @IsEnum(OtpType)
  @IsNotEmpty({ message: 'OTP类型不能为空' })
  otpType: OtpType;

  @ApiProperty({ description: 'OTP会话ID', example: 'session-id-xxx' })
  @IsString()
  @IsNotEmpty({ message: '会话ID不能为空' })
  sessionId: string;
}
