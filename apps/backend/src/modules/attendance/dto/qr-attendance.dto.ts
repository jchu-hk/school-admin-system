import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** QR码生成请求 */
export class GenerateQrDto {
  @ApiPropertyOptional({ description: '学生端设备标识（可选，用于安全风控）' })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

/** QR码扫码签到请求 */
export class ScanQrDto {
  @ApiProperty({ description: 'QR码原始数据' })
  @IsNotEmpty()
  @IsString()
  qr_code_data: string;

  @ApiPropertyOptional({ description: '扫码设备标识' })
  @IsString()
  @IsOptional()
  device_id?: string;
}

/** 离线批量同步请求 */
export class SyncBatchDto {
  @ApiProperty({ description: '设备标识' })
  @IsNotEmpty()
  @IsString()
  device_id: string;

  @ApiProperty({ description: '批量记录', type: [Object] })
  batch: Array<{
    qr_raw: string;
    scanned_at: string;
  }>;
}
