import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceStatus } from './attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import {
  BatchCreateAttendanceDto,
  ConfirmPreviewDto,
  BatchRevokeDto,
  WebhookPayloadDto,
} from './dto/batch-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('出勤管理')
@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ==================== 基础 CRUD ====================

  @Post()
  @ApiOperation({ summary: '创建出勤记录' })
  @ApiResponse({
    status: 201,
    description: '出勤记录创建成功',
    type: Attendance,
  })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  create(
    @Body() dto: CreateAttendanceDto,
    @Request() req,
  ): Promise<Attendance> {
    dto.createdBy = req.user.id;
    return this.attendanceService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取出勤列表' })
  @ApiResponse({ status: 200, description: '获取出勤列表成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('studentId') studentId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('classId') classId?: string,
    @Query('attendanceDate') attendanceDate?: string,
    @Query('status') status?: AttendanceStatus,
  ) {
    return this.attendanceService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      { studentId, teacherId, classId, attendanceDate, status },
    );
  }

  @Get('stats/daily')
  @ApiOperation({ summary: '每日出勤统计' })
  @ApiResponse({ status: 200, description: '获取每日统计成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  getDailyStats(
    @Query('date') date: string,
    @Query('classId') classId?: string,
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getDailyStats(targetDate, classId);
  }

  @Get('stats/monthly')
  @ApiOperation({ summary: '月度出勤统计' })
  @ApiResponse({ status: 200, description: '获取月度统计成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  getMonthlyStats(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('classId') classId?: string,
  ) {
    const now = new Date();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    return this.attendanceService.getMonthlyStats(
      targetYear,
      targetMonth,
      classId,
    );
  }

  @Get('stats/summary')
  @ApiOperation({ summary: '获取出勤统计' })
  @ApiResponse({ status: 200, description: '获取统计成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  getStats(
    @Query('classId') classId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getStats(classId, startDate, endDate);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: '获取学生出勤记录' })
  @ApiResponse({ status: 200, description: '获取学生出勤记录成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.findByStudent(
      studentId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      startDate,
      endDate,
    );
  }

  @Get('class/:classId/date/:date')
  @ApiOperation({ summary: '按班级和日期获取出勤记录（对接 eClass API）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  getByClassAndDate(
    @Param('classId') classId: string,
    @Param('date') date: string,
  ) {
    return this.attendanceService.findByClassAndDate(classId, date);
  }

  @Get('class/:classId/stats')
  @ApiOperation({ summary: '获取班级出勤统计' })
  @ApiResponse({ status: 200, description: '获取班级统计成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  getClassStats(
    @Param('classId') classId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getClassStats(classId, startDate, endDate);
  }

  @Get('affected-studients')
  @ApiOperation({ summary: '获取受影响学生列表（数据源同步失败时）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  getAffectedStudents(@Query('date') date?: string) {
    return this.attendanceService.getAffectedStudents(date);
  }

  @Get('reminders/unreported')
  @ApiOperation({ summary: '获取未上报的缺勤记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  getUnreportedAbsences(
    @Query('classId') classId?: string,
  ): Promise<Attendance[]> {
    return this.attendanceService.getUnreportedAbsences(classId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取出勤详情' })
  @ApiResponse({
    status: 200,
    description: '获取出勤详情成功',
    type: Attendance,
  })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Attendance> {
    return this.attendanceService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新出勤记录' })
  @ApiResponse({
    status: 200,
    description: '出勤记录更新成功',
    type: Attendance,
  })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<Attendance> {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除出勤记录' })
  @ApiResponse({ status: 204, description: '出勤记录已删除' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.attendanceService.remove(id);
  }

  // ==================== 批量操作（F-ATT-001 批量录入 + 确认预览 + 批量撤销）====================

  @Post('batch/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量录入确认预览（不保存）' })
  @ApiResponse({ status: 200, description: '返回预览摘要' })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  confirmPreview(@Body() dto: ConfirmPreviewDto) {
    return this.attendanceService.confirmPreview(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建出勤记录（确认预览后提交）' })
  @ApiResponse({ status: 201, description: '批量创建成功' })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  batchCreate(@Body() dto: BatchCreateAttendanceDto, @Request() req) {
    return this.attendanceService.batchCreate(dto, req.user.id);
  }

  @Delete('batch/:batchId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量撤销（仅15分钟内有效）' })
  @ApiResponse({ status: 200, description: '批量撤销成功' })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  batchRevoke(
    @Param('batchId') batchId: string,
    @Request() req,
  ) {
    return this.attendanceService.batchRevoke(batchId, req.user.id, req.user.role);
  }

  // ==================== Webhook（生物识别设备）====================

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '生物识别设备 Webhook 推送（门禁/刷脸）' })
  @ApiResponse({ status: 200, description: '处理成功' })
  // Webhook 不走 JWT 鉴权，使用 HMAC 验签
  handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Query('deviceId') deviceId?: string,
  ) {
    return this.attendanceService.handleWebhook(payload, deviceId);
  }
}
