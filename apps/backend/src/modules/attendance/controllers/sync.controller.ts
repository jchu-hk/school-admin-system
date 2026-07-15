import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SyncService } from '../services/sync.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

/** 批量同步请求体 DTO */
class SyncBatchItemDto {
  cacheId?: string;
  qrRawContent: string;
  qrStudentId: string;
  scannerDeviceId: string;
  scannerLocation?: string;
  scannedAt: string;
  cachedAt: string;
}

class SyncBatchRequestDto {
  deviceId: string;
  deviceName?: string;
  items: SyncBatchItemDto[];
}

@ApiTags('QR签到-离线同步')
@Controller('attendance/qr')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * 批量同步离线签到记录
   *
   * POST /attendance/qr/sync-batch
   *
   * 逐条校验（签名/过期/重复），每条记录独立结果。
   * 幂等：相同 qr_raw + scanned_at 不重复处理。
   */
  @Post('sync-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '批量同步离线签到数据',
    description:
      '扫码设备离线期间缓存的签到记录批量同步。' +
      '逐条校验（签名/过期/重复），每条记录独立结果。' +
      '幂等：相同 qr_raw + scanned_at 不重复处理。',
  })
  @ApiResponse({
    status: 200,
    description: '批量同步完成',
    schema: {
      type: 'object',
      properties: {
        syncedCount: { type: 'integer', example: 42 },
        failedCount: { type: 'integer', example: 3 },
        failedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'integer' },
              cacheId: { type: 'string' },
              success: { type: 'boolean', example: false },
              error: { type: 'string' },
              errorCode: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '参数校验失败（deviceId为空/items为空/超过500条）',
  })
  async syncBatch(
    @Body() dto: SyncBatchRequestDto,
  ): Promise<{
    syncedCount: number;
    failedCount: number;
    failedItems: Array<{
      index: number;
      cacheId?: string;
      success: boolean;
      attendanceId?: string;
      error?: string;
      errorCode?: string;
    }>;
  }> {
    return this.syncService.syncBatch(dto);
  }

  /**
   * 查询设备待同步状态
   */
  @Get('sync-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '查询同步状态统计',
    description: '获取待同步/失败的离线记录数量，可按设备筛选。',
  })
  @ApiQuery({
    name: 'deviceId',
    required: false,
    type: String,
    description: '设备标识（可选，不传则统计全部）',
  })
  @ApiResponse({
    status: 200,
    description: '同步状态统计',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        pending: { type: 'integer' },
        failed: { type: 'integer' },
      },
    },
  })
  async getSyncStatus(
    @Query('deviceId') deviceId?: string,
  ): Promise<{ total: number; pending: number; failed: number }> {
    return this.syncService.getPendingCount(deviceId);
  }

  /**
   * 重试失败的同步记录
   */
  @Post('sync-retry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SCHOOL_STAFF,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '重试失败的同步记录',
    description: '重新处理状态为failed/pending的记录。',
  })
  @ApiQuery({
    name: 'deviceId',
    required: false,
    type: String,
    description: '设备标识（可选）',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '最大重试条数（默认100）',
  })
  @ApiResponse({
    status: 200,
    description: '重试结果',
    schema: {
      type: 'object',
      properties: {
        retried: { type: 'integer' },
        succeeded: { type: 'integer' },
        failed: { type: 'integer' },
      },
    },
  })
  async retryFailed(
    @Query('deviceId') deviceId?: string,
    @Query('limit') limit?: number,
  ): Promise<{ retried: number; succeeded: number; failed: number }> {
    return this.syncService.retryFailed(deviceId, limit || 100);
  }
}
