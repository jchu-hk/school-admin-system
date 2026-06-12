import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CertificateVerifyResponseDto {
  @ApiProperty({ description: '证明是否有效', example: true })
  valid: boolean;

  @ApiProperty({ description: '验证状态', example: 'verified' })
  status: 'verified' | 'invalid' | 'suspicious' | 'error';

  @ApiProperty({ description: '验证消息' })
  message: string;

  @ApiPropertyOptional({ description: '提取的详细信息' })
  details?: {
    @ApiPropertyOptional({ description: '医院/诊所名称' })
    hospitalName?: string;

    @ApiPropertyOptional({ description: '医生姓名' })
    doctorName?: string;

    @ApiPropertyOptional({ description: '诊断日期' })
    diagnosisDate?: string;

    @ApiPropertyOptional({ description: '患者姓名' })
    patientName?: string;

    @ApiPropertyOptional({ description: '建议休息天数' })
    suggestedRestDays?: number;

    @ApiPropertyOptional({ description: '证明类型' })
    certificateType?: string;

    @ApiPropertyOptional({ description: '证明编号' })
    certificateNumber?: string;

    @ApiPropertyOptional({ description: 'OCR识别的原始文本（调试用）' })
    rawOcrText?: string;
  };

  @ApiProperty({ description: '置信度分数 0-1' })
  confidence: number;

  @ApiProperty({ description: '风险标记' })
  riskFlags: string[];

  @ApiProperty({ description: '验证时间' })
  verifiedAt: Date;
}

export class UploadCertificateDto {
  @ApiPropertyOptional({ description: '关联的请假记录ID' })
  @IsString()
  @IsOptional()
  leaveId?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  notes?: string;
}
