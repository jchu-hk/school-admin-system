import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
import { BackupService } from './backup.service';
import {
  TriggerBackupDto,
  BackupQueryDto,
  BackupSettingsDto,
  BackupStatisticsDto,
} from './backup.dto';
import { BackupRecord } from './backup.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('备份管理')
@Controller('backups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /**
   * 手动触发数据库备份
   */
  @Post('trigger')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '手动触发数据库备份' })
  @ApiResponse({ status: 201, description: '备份已触发', type: BackupRecord })
  @UseGuards(RolesGuard)
  @Roles('SYSTEM_ADMIN', 'OPS')
  async triggerBackup(
    @Body() dto: TriggerBackupDto,
    @Request() req,
  ): Promise<BackupRecord> {
    return this.backupService.triggerManualBackup(dto, req.user.id);
  }

  /**
   * 获取备份记录列表
   */
  @Get()
  @ApiOperation({ summary: '获取备份记录列表' })
  @ApiResponse({ status: 200, description: '备份记录列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: String })
  @ApiQuery({ name: 'type', required: false, enum: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getBackupList(
    @Query() query: BackupQueryDto,
  ): Promise<{ records: BackupRecord[]; total: number }> {
    return this.backupService.getBackupList(query);
  }

  /**
   * 获取备份详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取备份记录详情' })
  @ApiResponse({ status: 200, description: '备份记录详情', type: BackupRecord })
  async getBackupDetail(@Param('id') id: string): Promise<BackupRecord> {
    return this.backupService.getBackupDetail(id);
  }

  /**
   * 获取备份统计
   */
  @Get('stats/summary')
  @ApiOperation({ summary: '获取备份统计信息' })
  @ApiResponse({ status: 200, description: '备份统计', type: BackupStatisticsDto })
  async getStatistics(): Promise<BackupStatisticsDto> {
    return this.backupService.getStatistics();
  }

  /**
   * 验证备份文件完整性
   */
  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证备份文件完整性' })
  @ApiResponse({ status: 200, description: '验证结果' })
  async verifyBackup(
    @Param('id') id: string,
  ): Promise<{ valid: boolean; message: string }> {
    return this.backupService.verifyBackup(id);
  }

  /**
   * 获取备份设置
   */
  @Get('settings')
  @ApiOperation({ summary: '获取备份设置' })
  @ApiResponse({ status: 200, description: '备份设置' })
  async getSettings(): Promise<BackupSettingsDto> {
    return this.backupService.getSettings();
  }

  /**
   * 更新备份设置
   */
  @Post('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新备份设置' })
  @ApiResponse({ status: 200, description: '更新后的备份设置' })
  @UseGuards(RolesGuard)
  @Roles('SYSTEM_ADMIN')
  async updateSettings(
    @Body() dto: BackupSettingsDto,
  ): Promise<BackupSettingsDto> {
    return this.backupService.updateSettings(dto);
  }
}
