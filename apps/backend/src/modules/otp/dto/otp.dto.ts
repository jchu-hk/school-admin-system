import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { OtpType } from '../entities/otp.entity';

export class BindOtpDto {
  @ApiProperty({ enum: OtpType, description: 'OTP type' })
  @IsEnum(OtpType)
  otpType: OtpType;

  @ApiProperty({ description: 'Phone number for SMS OTP', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Email for email OTP', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'UKey ID for hardware UKey', required: false })
  @IsOptional()
  @IsString()
  ukeyId?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'OTP session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'OTP code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'OTP type' })
  @IsEnum(OtpType)
  otpType: OtpType;
}

export class ConfirmBindOtpDto {
  @ApiProperty({ description: 'OTP secret' })
  @IsString()
  secret: string;

  @ApiProperty({ description: 'OTP code for verification' })
  @IsString()
  code: string;

  @ApiProperty({ enum: OtpType, description: 'OTP type' })
  @IsEnum(OtpType)
  otpType: OtpType;
}

export class UnbindOtpDto {
  @ApiProperty({ enum: OtpType, description: 'OTP type to unbind' })
  @IsEnum(OtpType)
  otpType: OtpType;

  @ApiProperty({ description: 'Verification OTP code' })
  @IsString()
  code: string;
}

export class GenerateOtpDto {
  @ApiProperty({ description: 'Operation type that requires OTP' })
  @IsString()
  operationType: string;

  @ApiProperty({ description: 'Operation details', required: false })
  @IsOptional()
  operationDetails?: any;

  @ApiProperty({ enum: OtpType, description: 'OTP type to use' })
  @IsEnum(OtpType)
  otpType: OtpType;
}
