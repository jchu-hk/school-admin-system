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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusService } from './bus.service';
import { BusRoute, BusSchedule, BusRecord, BusRecordStatus, BusDirection } from './bus.entity';
import {
  CreateBusRouteDto,
  UpdateBusRouteDto,
  CreateBusScheduleDto,
  UpdateBusScheduleDto,
  CreateBusRecordDto,
  UpdateBusRecordDto,
  BusRecordQueryDto,
} from './dto/bus.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('校车管理')
@Controller('bus')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BusController {
  constructor(private readonly busService: BusService) {}

  // ==================== Routes ====================

  @Post('routes')
  @ApiOperation({ summary: '创建校车路线' })
  @ApiResponse({ status: 201, description: '路线创建成功', type: BusRoute })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createRoute(@Body() createDto: CreateBusRouteDto): Promise<BusRoute> {
    return this.busService.createRoute(createDto);
  }

  @Get('routes')
  @ApiOperation({ summary: '获取校车路线列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [BusRoute] })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAllRoutes(): Promise<BusRoute[]> {
    return this.busService.findAllRoutes();
  }

  @Get('routes/:id')
  @ApiOperation({ summary: '获取校车路线详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: BusRoute })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findRouteById(@Param('id', ParseUUIDPipe) id: string): Promise<BusRoute> {
    return this.busService.findRouteById(id);
  }

  @Put('routes/:id')
  @ApiOperation({ summary: '更新校车路线' })
  @ApiResponse({ status: 200, description: '更新成功', type: BusRoute })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateBusRouteDto,
  ): Promise<BusRoute> {
    return this.busService.updateRoute(id, updateDto);
  }

  @Delete('routes/:id')
  @ApiOperation({ summary: '删除校车路线' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  deleteRoute(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.busService.deleteRoute(id);
  }

  // ==================== Schedules ====================

  @Post('schedules')
  @ApiOperation({ summary: '创建校车时刻表' })
  @ApiResponse({ status: 201, description: '时刻表创建成功', type: BusSchedule })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createSchedule(@Body() createDto: CreateBusScheduleDto): Promise<BusSchedule> {
    return this.busService.createSchedule(createDto);
  }

  @Get('routes/:routeId/schedules')
  @ApiOperation({ summary: '获取路线时刻表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [BusSchedule] })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findSchedulesByRoute(@Param('routeId', ParseUUIDPipe) routeId: string): Promise<BusSchedule[]> {
    return this.busService.findSchedulesByRoute(routeId);
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: '更新校车时刻表' })
  @ApiResponse({ status: 200, description: '更新成功', type: BusSchedule })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateBusScheduleDto,
  ): Promise<BusSchedule> {
    return this.busService.updateSchedule(id, updateDto);
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: '删除校车时刻表' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  deleteSchedule(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.busService.deleteSchedule(id);
  }

  // ==================== Records ====================

  @Post('records')
  @ApiOperation({ summary: '创建校车记录' })
  @ApiResponse({ status: 201, description: '记录创建成功', type: BusRecord })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  createRecord(@Body() createDto: CreateBusRecordDto): Promise<BusRecord> {
    return this.busService.createRecord(createDto);
  }

  @Get('records')
  @ApiOperation({ summary: '获取校车记录列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAllRecords(@Query() query: BusRecordQueryDto): Promise<{ records: BusRecord[]; total: number }> {
    return this.busService.findAllRecords(query);
  }

  @Get('records/:id')
  @ApiOperation({ summary: '获取校车记录详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: BusRecord })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findRecordById(@Param('id', ParseUUIDPipe) id: string): Promise<BusRecord> {
    return this.busService.findRecordById(id);
  }

  @Put('records/:id')
  @ApiOperation({ summary: '更新校车记录' })
  @ApiResponse({ status: 200, description: '更新成功', type: BusRecord })
  @Roles(UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  updateRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateBusRecordDto,
  ): Promise<BusRecord> {
    return this.busService.updateRecord(id, updateDto);
  }

  @Post('records/:id/board')
  @ApiOperation({ summary: '标记学生上车' })
  @ApiResponse({ status: 200, description: '上车成功', type: BusRecord })
  @Roles(UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  board(@Param('id', ParseUUIDPipe) id: string): Promise<BusRecord> {
    return this.busService.board(id);
  }

  @Post('records/:id/absent')
  @ApiOperation({ summary: '标记学生缺席' })
  @ApiResponse({ status: 200, description: '缺席标记成功', type: BusRecord })
  @Roles(UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  absent(@Param('id', ParseUUIDPipe) id: string): Promise<BusRecord> {
    return this.busService.absent(id);
  }

  @Post('records/:id/complete')
  @ApiOperation({ summary: '完成校车行程' })
  @ApiResponse({ status: 200, description: '完成成功', type: BusRecord })
  @Roles(UserRole.SCHOOL_STAFF)
  complete(@Param('id', ParseUUIDPipe) id: string): Promise<BusRecord> {
    return this.busService.complete(id);
  }

  @Post('records/:id/cancel')
  @ApiOperation({ summary: '取消校车记录' })
  @ApiResponse({ status: 200, description: '取消成功', type: BusRecord })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  cancelRecord(@Param('id', ParseUUIDPipe) id: string): Promise<BusRecord> {
    return this.busService.cancelRecord(id);
  }

  @Delete('records/:id')
  @ApiOperation({ summary: '删除校车记录' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  deleteRecord(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.busService.deleteRecord(id);
  }

  // ==================== Stats ====================

  @Get('stats')
  @ApiOperation({ summary: '获取校车统计' })
  @ApiResponse({ status: 200, description: '获取统计成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.busService.getStats(startDate, endDate);
  }

  @Get('stats/student/:studentId')
  @ApiOperation({ summary: '获取学生校车统计' })
  @ApiResponse({ status: 200, description: '获取统计成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  getStudentStats(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.busService.getStudentStats(studentId, startDate, endDate);
  }
}
