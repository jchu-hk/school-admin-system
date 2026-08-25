import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsDate,
} from 'class-validator';
import {
  ConsentType,
  ConsentChannel,
  ConsentGranter,
  ConsentStatus,
} from '../entities/consent-record.entity';

export class CreateConsentDto {
  @ApiProperty({ enum: ConsentType, description: '同意类型' })
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @ApiProperty({ description: '资料当事人用户ID（默认=当前登录用户）', required: false })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiProperty({ enum: ConsentGranter, description: '签署人', default: ConsentGranter.SELF, required: false })
  @IsOptional()
  @IsEnum(ConsentGranter)
  granter?: ConsentGranter;

  @ApiProperty({ enum: ConsentChannel, description: '签署渠道', default: ConsentChannel.PORTAL, required: false })
  @IsOptional()
  @IsEnum(ConsentChannel)
  channel?: ConsentChannel;

  @ApiProperty({ description: '关联学生ID（家长代签时）', required: false })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiProperty({ description: '同意文本/条款摘要', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  consentText?: string;

  @ApiProperty({ description: '过期时间（可选）', required: false, type: String })
  @IsOptional()
  @IsDate()
  expiresAt?: Date;
}

export class ConsentQueryDto {
  @ApiProperty({ enum: ConsentType, description: '按同意类型过滤', required: false })
  @IsOptional()
  @IsEnum(ConsentType)
  consentType?: ConsentType;

  @ApiProperty({ enum: ConsentStatus, description: '按状态过滤', required: false })
  @IsOptional()
  @IsEnum(ConsentStatus)
  status?: ConsentStatus;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', default: 20, required: false })
  @IsOptional()
  pageSize?: number;
}
