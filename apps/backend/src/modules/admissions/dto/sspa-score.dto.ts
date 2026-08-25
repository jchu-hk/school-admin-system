import {
  IsUUID,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SspaCriterion } from '../entities/sspa-score.entity';

export class SspaScoreItemDto {
  @ApiProperty({ description: '评分准则', enum: SspaCriterion })
  @IsEnum(SspaCriterion)
  criterion: SspaCriterion;

  @ApiProperty({ description: '分项得分' })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({ description: '备注（如校长酌情权审批留痕）' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpsertSspaScoresDto {
  @ApiProperty({ description: '分项评分列表' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SspaScoreItemDto)
  scores: SspaScoreItemDto[];

  @ApiPropertyOptional({ description: '评分人ID（可空，默认取当前用户）' })
  @IsOptional()
  @IsUUID()
  scoredById?: string;
}

export class ConfirmOfferDto {
  @ApiPropertyOptional({ description: '确认经办人ID（可空，默认取当前用户）' })
  @IsOptional()
  @IsUUID()
  confirmedById?: string;
}

export class AnnounceResultDto {
  @ApiProperty({ description: '正取申请ID列表' })
  @IsArray()
  @IsUUID('4', { each: true })
  accepted: string[];

  @ApiProperty({ description: '备取申请ID列表' })
  @IsArray()
  @IsUUID('4', { each: true })
  waitlist: string[];
}

export class RegisterSspaApplicationDto {
  @ApiPropertyOptional({ description: '关联新生申请ID（F-ENRL-001，转正后回填）' })
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiPropertyOptional({ description: '经办人ID（可空，默认取当前用户）' })
  @IsOptional()
  @IsUUID()
  registeredById?: string;
}
