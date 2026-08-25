import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { WitnessType } from '../entities/witness.entity';

export class CreateWitnessVerificationDto {
  @ApiProperty({
    enum: WitnessType,
    description: '触发场景（cash_receipt/cash_payment/petty_cash/safe_open/cheque_sign）',
  })
  @IsEnum(WitnessType)
  witnessType: WitnessType;

  @ApiProperty({ description: '交易金额（现金场景）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ description: '币种', default: 'HKD', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    description: '关联业务单据标识（报销单/收款单/备用金ID）',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessRef?: string;

  @ApiProperty({ description: '第一见证人用户ID', required: false })
  @IsOptional()
  @IsUUID()
  witness1Id?: string;

  @ApiProperty({ description: '第二见证人用户ID（如有）', required: false })
  @IsOptional()
  @IsUUID()
  witness2Id?: string;
}

export class ConfirmWitnessDto {
  @ApiProperty({ description: '短信 OTP 会话ID（须本人二次认证）' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: '短信 OTP 验证码' })
  @IsString()
  otp: string;

  @ApiProperty({ description: '见证意见', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class RejectWitnessDto {
  @ApiProperty({ description: '拒绝原因' })
  @IsString()
  @MaxLength(500)
  rejectionReason: string;
}

export class EscalateWitnessDto {
  @ApiProperty({ description: '替代见证人用户ID（升级处理后指定）', required: false })
  @IsOptional()
  @IsUUID()
  replacementWitnessId?: string;
}

export class CancelWitnessDto {
  @ApiProperty({ description: '作废原因', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
