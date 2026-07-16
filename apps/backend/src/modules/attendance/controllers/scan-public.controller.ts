import {
  Controller,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QrScanService } from '../services/qr-scan.service';
import { ScanQrDto } from '../dto/qr-attendance.dto';

/**
 * 公开扫码端点（无需 JWT 认证）
 *
 * 所有 /attendance/qr 开头的路由都受 JwtAuthGuard + RolesGuard 保护，
 * 为了排除这些守卫的影响，使用独立的 Controller 路径
 */
@Controller('attendance/qr')
export class ScanPublicController {
  constructor(private readonly qrScanService: QrScanService) {}

  /**
   * 扫码签到（公开端点，无需登录）
   */
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scan(@Body() dto: ScanQrDto, @Request() req) {
    console.log('[ScanPublic] scan called');
    const staffUserId = 'anonymous-scanner';
    const ipAddress = req.ip;

    const result = await this.qrScanService.scan(
      dto.qr_code_data,
      staffUserId,
      dto.device_id,
      ipAddress,
    );

    return {
      success: true,
      data: result,
    };
  }
}
