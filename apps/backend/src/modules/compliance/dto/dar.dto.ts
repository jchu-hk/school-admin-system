import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  DataAccessRequestType,
  DataAccessRequestStatus,
  DataScopeType,
} from '../entities/data-access-request.entity';

export class CreateDataAccessRequestDto {
  @ApiProperty({ enum: DataAccessRequestType, description: '申请类型（access/correction/erasure）' })
  @IsEnum(DataAccessRequestType)
  requestType: DataAccessRequestType;

  @ApiProperty({ enum: DataScopeType, description: '数据范围类型' })
  @IsEnum(DataScopeType)
  dataScope: DataScopeType;

  @ApiProperty({
    description: '资料当事人用户ID（默认=当前登录用户）',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiProperty({ description: '申请理由/说明', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  justification?: string;
}

export class ReviewDataAccessRequestDto {
  @ApiProperty({ description: '审批意见/拒绝原因', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CompleteDataAccessRequestDto {
  @ApiProperty({ description: '响应内容（access 数据摘录 / correction 更正结果 / erasure 执行结果）', required: false })
  @IsOptional()
  @IsString()
  responsePayload?: string;
}

export class DataAccessRequestQueryDto {
  @ApiProperty({ enum: DataAccessRequestStatus, description: '按状态过滤', required: false })
  @IsOptional()
  @IsEnum(DataAccessRequestStatus)
  status?: DataAccessRequestStatus;

  @ApiProperty({ enum: DataAccessRequestType, description: '按类型过滤', required: false })
  @IsOptional()
  @IsEnum(DataAccessRequestType)
  requestType?: DataAccessRequestType;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', default: 20, required: false })
  @IsOptional()
  pageSize?: number;
}
