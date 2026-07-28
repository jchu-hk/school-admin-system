import {
  Controller,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrScanService } from '../services/qr-scan.service';
import { ScanQrDto } from '../dto/qr-attendance.dto';
import { User } from '../../user/user.entity';

/**
 * 公开扫码端点（无需 JWT 认证）
 *
 * 所有 /attendance/qr 开头的路由都受 JwtAuthGuard + RolesGuard 保护，
 * 为了排除这些守卫的影响，使用独立的 Controller 路径
 */
@Controller('attendance/qr')
export class ScanPublicController {
  private readonly logger = new Logger(ScanPublicController.name);
  private readonly SYSTEM_SCANNER_USERNAME = '__system_scanner__';
  private cachedSystemUserId: string | null = null;

  constructor(
    private readonly qrScanService: QrScanService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 获取系统扫码器用户ID（带缓存）
   */
  private async getSystemScannerUserId(): Promise<string> {
    if (this.cachedSystemUserId) {
      return this.cachedSystemUserId;
    }
    const user = await this.userRepository.findOne({
      where: { username: this.SYSTEM_SCANNER_USERNAME },
    });
    if (!user) {
      this.logger.error(
        `System scanner user '${this.SYSTEM_SCANNER_USERNAME}' not found in database`,
      );
      throw new InternalServerErrorException({
        error: 'SYSTEM_ERROR',
        message: '系统扫码器未配置，请联系管理员',
      });
    }
    this.cachedSystemUserId = user.id;
    return user.id;
  }

  /**
   * 扫码签到（公开端点，无需登录）
   */
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scan(@Body() dto: ScanQrDto, @Request() req) {
    this.logger.log('[ScanPublic] scan called');
    const staffUserId = await this.getSystemScannerUserId();
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
