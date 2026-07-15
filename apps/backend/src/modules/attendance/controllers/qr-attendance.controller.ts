import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
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
} from '@nestjs/swagger';
import { QrGenerationService } from '../services/qr-generation.service';
import { QrScanService } from '../services/qr-scan.service';
import { GenerateQrDto, ScanQrDto, SyncBatchDto } from '../dto/qr-attendance.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { QrScanPermissionGuard } from '../guards/qr-permission.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('QR考勤')
@Controller('attendance/qr')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QrAttendanceController {
  constructor(
    private readonly qrGenerationService: QrGenerationService,
    private readonly qrScanService: QrScanService,
  ) {}

  // ==================== F-ATTQR-001: QR码生成 ====================

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '学生生成当日签到QR码' })
  @ApiResponse({ status: 200, description: 'QR码生成成功' })
  @ApiResponse({ status: 400, description: '当天已签到或速率限制' })
  @ApiResponse({ status: 409, description: '今日已签到' })
  @ApiResponse({ status: 429, description: '30秒内只能生成一次' })
  @Roles(UserRole.STUDENT)
  async generate(@Body() dto: GenerateQrDto, @Request() req) {
    const studentUserId = req.user.id;
    const ipAddress = req.ip;

    const result = await this.qrGenerationService.generate(
      studentUserId,
      dto.deviceId,
      ipAddress,
    );

    return {
      success: true,
      data: result,
    };
  }

  // ==================== F-ATTQR-002: 扫码签到 ====================

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '教职工扫码记录学生签到' })
  @ApiResponse({ status: 200, description: '签到成功' })
  @ApiResponse({ status: 400, description: 'QR码过期/无效' })
  @ApiResponse({ status: 403, description: '无扫码权限' })
  @ApiResponse({ status: 409, description: '重复签到' })
  @UseGuards(QrScanPermissionGuard)
  @Roles(
    UserRole.TEACHER,
    UserRole.SCHOOL_STAFF,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  async scan(@Body() dto: ScanQrDto, @Request() req) {
    const staffUserId = req.user.id;
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

  // ==================== 离线批量同步 ====================

  @Post('sync-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '离线设备批量同步签到数据' })
  @ApiResponse({ status: 200, description: '同步完成' })
  async syncBatch(@Body() dto: SyncBatchDto) {
    const result = await this.qrScanService.syncBatch(
      dto.device_id,
      dto.batch,
    );

    return {
      success: true,
      data: result,
    };
  }

  // ==================== 日报查询 ====================

  @Get('report/daily')
  @ApiOperation({ summary: '查询班级签到日报' })
  @ApiResponse({ status: 200, description: '获取日报成功' })
  @Roles(
    UserRole.TEACHER,
    UserRole.SCHOOL_STAFF,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  async getDailyReport(
    @Query('class_id') classId: string,
    @Query('date') date: string,
  ) {
    // This is a placeholder return - full implementation would query
    // attendance_qr_logs aggregated by class and date
    return {
      success: true,
      data: {
        class_name: '',
        report_date: date,
        total_students: 0,
        present_count: 0,
        absent_list: [],
        makeup_list: [],
        generated_at: new Date().toISOString(),
      },
    };
  }

  // ==================== 签到记录查询 ====================

  @Get('record')
  @ApiOperation({ summary: '查询签到记录' })
  @ApiResponse({ status: 200, description: '获取记录成功' })
  @Roles(
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.TEACHER,
    UserRole.SCHOOL_STAFF,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  async getQrRecords(
    @Query('student_id') studentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const [records, total] = await this.qrScanService['qrLogRepository'].findAndCount({
      where: { studentId } as any,
      order: { scannedAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return {
      success: true,
      data: {
        records: records.map((r) => ({
          date: r.scannedAt.toISOString().split('T')[0],
          checkin_time: r.scannedAt.toISOString().split('T')[1]?.substring(0, 8),
          source: r.source,
          result: r.result,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }
}
