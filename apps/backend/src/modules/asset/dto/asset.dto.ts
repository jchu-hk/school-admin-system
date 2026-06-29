import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetStatus, AssetCategory } from '../asset.entity';

// ============ Asset DTOs ============

export class CreateAssetDto {
  @ApiProperty({ description: '学校ID' })
  @IsString()
  schoolId: string;

  @ApiProperty({ description: '资产名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '资产编号' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ enum: AssetCategory, description: '资产类别' })
  @IsEnum(AssetCategory)
  @IsOptional()
  category?: AssetCategory;

  @ApiPropertyOptional({ description: '品牌' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: '型号' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: '序列号' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiPropertyOptional({ description: '数量', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: '单位' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: '资产价值' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional({ description: '购买日期' })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: '供应商' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ description: '存放位置' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ enum: AssetStatus, description: '状态' })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateAssetDto {
  @ApiPropertyOptional({ description: '资产名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '资产编号' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ enum: AssetCategory, description: '资产类别' })
  @IsEnum(AssetCategory)
  @IsOptional()
  category?: AssetCategory;

  @ApiPropertyOptional({ description: '品牌' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: '型号' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: '序列号' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiPropertyOptional({ description: '数量' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: '可用数量' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  availableQuantity?: number;

  @ApiPropertyOptional({ description: '单位' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: '资产价值' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional({ description: '购买日期' })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: '供应商' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ description: '存放位置' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ enum: AssetStatus, description: '状态' })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class AssetQueryDto {
  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '学校ID' })
  @IsString()
  @IsOptional()
  schoolId?: string;

  @ApiPropertyOptional({ enum: AssetCategory, description: '资产类别' })
  @IsEnum(AssetCategory)
  @IsOptional()
  category?: AssetCategory;

  @ApiPropertyOptional({ enum: AssetStatus, description: '状态' })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ description: '存放位置' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ============ Asset Rental DTOs ============

export class CreateAssetRentalDto {
  @ApiProperty({ description: '资产ID' })
  @IsString()
  assetId: string;

  @ApiProperty({ description: '借用人ID' })
  @IsString()
  borrowerId: string;

  @ApiProperty({ description: '借用人姓名' })
  @IsString()
  borrowerName: string;

  @ApiPropertyOptional({ description: '借用人部门' })
  @IsString()
  @IsOptional()
  borrowerDepartment?: string;

  @ApiProperty({ description: '借出日期' })
  @IsDateString()
  lendDate: string;

  @ApiPropertyOptional({ description: '应还日期' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: '借用数量', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: '借用用途' })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateAssetRentalDto {
  @ApiPropertyOptional({ description: '应还日期' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: '归还日期' })
  @IsDateString()
  @IsOptional()
  returnDate?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: '归还备注' })
  @IsString()
  @IsOptional()
  returnNote?: string;
}

export class ApproveRentalDto {
  @ApiPropertyOptional({ description: '审批备注' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: '应还日期' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class ReturnRentalDto {
  @ApiPropertyOptional({ description: '实际归还数量', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: '归还备注' })
  @IsString()
  @IsOptional()
  returnNote?: string;
}

export class AssetRentalQueryDto {
  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '资产ID' })
  @IsString()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional({ description: '借用人ID' })
  @IsString()
  @IsOptional()
  borrowerId?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
