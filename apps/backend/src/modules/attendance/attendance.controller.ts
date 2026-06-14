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
    return this.attendanceService.getMonthlyStats(targetYear, targetMonth, classId);
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

  @Post('check-in/:id')
  @ApiOperation({ summary: '签到' })
  @ApiResponse({ status: 200, description: '签到成功', type: Attendance })
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  checkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('checkInTime') checkInTime: string,
  ): Promise<Attendance> {
    return this.attendanceService.checkIn(id, checkInTime);
  }

  @Post('check-out/:id')
  @ApiOperation({ summary: '签退' })
  @ApiResponse({ status: 200, description: '签退成功', type: Attendance })
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  checkOut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('checkOutTime') checkOutTime: string,
  ): Promise<Attendance> {
    return this.attendanceService.checkOut(id, checkOutTime);
  }
}
