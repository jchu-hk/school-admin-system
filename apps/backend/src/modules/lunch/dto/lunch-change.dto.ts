import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LunchChangeType, LunchChangeStatus } from '../lunch-change.entity';
import { LunchMenuStatus } from '../lunch-menu.entity';

// ============ 变更记录 DTO ============

export class CreateLunchChangeDto {
  @ApiPropertyOptional({ description: '关联订单ID（加单时可不传）' })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: '学生ID' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ enum: LunchChangeType, description: '变更类型' })
  @IsEnum(LunchChangeType)
  @IsNotEmpty()
  changeType: LunchChangeType;

  @ApiPropertyOptional({ description: '原菜品名称（取消/修改时传）' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  originalItem?: string;

  @ApiPropertyOptional({ description: '新菜品名称（加单/修改时传）' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  newItem?: string;

  @ApiPropertyOptional({ description: '新数量' })
  @IsInt()
  @Min(1)
  @IsOptional()
  newQuantity?: number;

  @ApiPropertyOptional({ description: '新价格' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  newPrice?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: '申请人ID' })
  @IsUUID()
  @IsNotEmpty()
  createdBy: string;
}

export class ApproveLunchChangeDto {
  @ApiPropertyOptional({ description: '审核备注' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectLunchChangeDto {
  @ApiProperty({ description: '拒绝原因' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectReason: string;
}

export class LunchChangeQueryDto {
  @ApiPropertyOptional({ description: '页码' })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: '学生ID' })
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ enum: LunchChangeType, description: '变更类型' })
  @IsEnum(LunchChangeType)
  @IsOptional()
  changeType?: LunchChangeType;

  @ApiPropertyOptional({ enum: LunchChangeStatus, description: '状态' })
  @IsEnum(LunchChangeStatus)
  @IsOptional()
  status?: LunchChangeStatus;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsString()
  @IsOptional()
  endDate?: string;
}

// ============ 菜单 DTO ============

export class CreateLunchMenuDto {
  @ApiProperty({ description: '菜品名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: '菜品描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '价格' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: '图片URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '可用日期，逗号分隔（如 1,2,3,4,5）' })
  @IsString()
  @IsOptional()
  availableDays?: string;

  @ApiPropertyOptional({ description: '供应商' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  supplier?: string;

  @ApiProperty({ description: '创建人ID' })
  @IsUUID()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateLunchMenuDto {
  @ApiPropertyOptional({ description: '菜品名称' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: '菜品描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '价格' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: '图片URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '可用日期' })
  @IsString()
  @IsOptional()
  availableDays?: string;

  @ApiPropertyOptional({ description: '供应商' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  supplier?: string;

  @ApiPropertyOptional({ enum: LunchMenuStatus, description: '状态' })
  @IsEnum(LunchMenuStatus)
  @IsOptional()
  status?: LunchMenuStatus;
}

export class LunchMenuQueryDto {
  @ApiPropertyOptional({ description: '页码' })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: '供应商' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ enum: LunchMenuStatus, description: '状态' })
  @IsEnum(LunchMenuStatus)
  @IsOptional()
  status?: LunchMenuStatus;
}

// ============ 供应商报表 DTO ============

export class SupplierReportQueryDto {
  @ApiProperty({ description: '开始日期' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: '结束日期' })
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ description: '供应商' })
  @IsString()
  @IsOptional()
  supplier?: string;
}

// ============ 预测 DTO ============

export class PredictionQueryDto {
  @ApiPropertyOptional({ description: '预测天数（默认7）' })
  @IsInt()
  @Min(1)
  @MaxLength(30)
  @IsOptional()
  days?: number;
}
