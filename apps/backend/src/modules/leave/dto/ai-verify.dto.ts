import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '../leave.entity';

export class AiVerifyDto {
  @ApiPropertyOptional({ description: '请假记录ID（可选）' })
  @IsUUID()
  @IsOptional()
  leaveId?: string;

  @ApiProperty({ description: '请假类型', enum: LeaveType })
  @IsEnum(LeaveType)
  @IsNotEmpty()
  type: LeaveType;

  @ApiProperty({ description: '请假原因' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: '请假天数' })
  @IsInt()
  @Min(0.5)
  @Max(365)
  @IsNotEmpty()
  days: number;

  @ApiPropertyOptional({ description: '申请人ID（用于查询历史记录）' })
  @IsUUID()
  @IsOptional()
  applicantId?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsString()
  @IsOptional()
  endDate?: string;
}

export class AiVerifyResponseDto {
  @ApiProperty({ description: '核验是否通过', example: true })
  verified: boolean;

  @ApiProperty({
    description: '风险等级',
    enum: ['low', 'medium', 'high'],
    example: 'low',
  })
  risk: 'low' | 'medium' | 'high';

  @ApiProperty({ description: '核验消息', example: '请假申请核验通过' })
  message: string;

  @ApiPropertyOptional({ description: 'AI识别的请假类型' })
  recognizedType?: string;

  @ApiPropertyOptional({ description: '核验详情' })
  details?: {
    anomalyFlags: string[];
    historicalPattern?: {
      totalLeavesLast30Days: number;
      sickLeavesLast30Days: number;
      avgDaysPerLeave: number;
    };
    recommendations: string[];
  };

  @ApiProperty({ description: '是否建议需要医生证明' })
  requireMedicalCertificate: boolean;

  @ApiProperty({ description: '核验时间' })
  verifiedAt: Date;
}
