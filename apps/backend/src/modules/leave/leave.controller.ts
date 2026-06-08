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
import { LeaveService } from './leave.service';
import { Leave, LeaveStatus } from './leave.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { ApproveLeaveDto, RejectLeaveDto } from './dto/approve-leave.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('请假管理')
@Controller('api/leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @ApiOperation({ summary: '创建请假申请' })
  @ApiResponse({ status: 201, description: '请假申请创建成功', type: Leave })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  create(
    @Body() createLeaveDto: CreateLeaveDto,
    @Request() req,
  ): Promise<Leave> {
    // Ensure createdBy is set to current user
    createLeaveDto.createdBy = req.user.id;
    return this.leaveService.create(createLeaveDto);
  }

  @Get()
  @ApiOperation({ summary: '获取请假列表' })
  @ApiResponse({ status: 200, description: '获取请假列表成功' })
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
    @Query('applicantId') applicantId?: string,
    @Query('status') status?: LeaveStatus,
  ): Promise<{ leaves: Leave[]; total: number }> {
    return this.leaveService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      applicantId,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取请假详情' })
  @ApiResponse({ status: 200, description: '获取请假详情成功', type: Leave })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Leave> {
    return this.leaveService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新请假申请' })
  @ApiResponse({ status: 200, description: '请假申请更新成功', type: Leave })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeaveDto: UpdateLeaveDto,
  ): Promise<Leave> {
    return this.leaveService.update(id, updateLeaveDto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '批准请假申请' })
  @ApiResponse({ status: 200, description: '请假申请已批准', type: Leave })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveLeaveDto: ApproveLeaveDto,
  ): Promise<Leave> {
    return this.leaveService.approve(id, approveLeaveDto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '拒绝请假申请' })
  @ApiResponse({ status: 200, description: '请假申请已拒绝', type: Leave })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rejectLeaveDto: RejectLeaveDto,
  ): Promise<Leave> {
    return this.leaveService.reject(id, rejectLeaveDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消请假申请' })
  @ApiResponse({ status: 200, description: '请假申请已取消', type: Leave })
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<Leave> {
    return this.leaveService.cancel(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除请假申请' })
  @ApiResponse({ status: 204, description: '请假申请已删除' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.leaveService.remove(id);
  }

  @Get('stats/substitute-teacher/:id')
  @ApiOperation({ summary: '获取代课老师统计' })
  @ApiResponse({ status: 200, description: '获取统计成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
  )
  getSubstituteTeacherStats(
    @Param('id', ParseUUIDPipe) substituteTeacherId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ totalClassHours: number; totalLeaves: number }> {
    return this.leaveService.getSubstituteTeacherStats(
      substituteTeacherId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats/leaves')
  @ApiOperation({ summary: '获取请假统计' })
  @ApiResponse({ status: 200, description: '获取统计成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  getLeaveStats(
    @Query('applicantId') applicantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalLeaves: number;
    totalDays: number;
    byType: Record<string, number>;
  }> {
    return this.leaveService.getLeaveStats(
      applicantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
