import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import {
  CreateLeaveDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  LeaveQueryDto,
  LeaveStatisticsDto,
  SetFollowUpDto,
} from './dto/leave.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { AuditService } from '../audit/audit.service';

@ApiTags('请假申请管理')
@Controller('api/leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeaveController {
  constructor(
    private readonly leaveService: LeaveService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建请假申请' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.PARENT, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  async create(@Body() dto: CreateLeaveDto, @Request() req) {
    const result = await this.leaveService.create(
      dto,
      req.user.id,
      req.user.schoolId,
    );
    await this.auditService.log(
      'leave_create' as any,
      req.user.id,
      `创建请假申请: ${result.applicationNo}`,
      req.ip,
      dto,
      HttpStatus.CREATED,
    );
    return result;
  }

  @Get()
  @ApiOperation({ summary: '获取请假申请列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAll(@Query() query: LeaveQueryDto, @Request() req) {
    return this.leaveService.findAll(query, req.user.id, req.user.role);
  }

  @Get('pending')
  @ApiOperation({ summary: '获取待处理请假申请' })
  @ApiResponse({ status: 200, description: '待处理列表' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  getPending(@Request() req) {
    return this.leaveService.getPendingApplications(req.user.schoolId);
  }

  @Get('ai-review-queue')
  @ApiOperation({ summary: '获取AI核验队列' })
  @ApiResponse({ status: 200, description: 'AI核验列表' })
  @Roles(UserRole.SCHOOL_DIRECTOR)
  getAIReviewQueue(@Request() req) {
    return this.leaveService.getAIReviewQueue(req.user.schoolId);
  }

  @Post(':id/ai-review/confirm')
  @ApiOperation({ summary: '确认AI核验通过' })
  @ApiResponse({ status: 200, description: '确认成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR)
  async confirmAIReview(@Param('id') id: string, @Request() req) {
    const result = await this.leaveService.confirmAIReview(id);
    await this.auditService.log(
      'leave_approve' as any,
      req.user.id,
      `AI核验确认: ${result.applicationNo}`,
      req.ip,
      { id },
      HttpStatus.OK,
    );
    return result;
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取请假统计' })
  @ApiResponse({ status: 200, description: '统计数据' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getStatistics(@Query() query: LeaveStatisticsDto, @Request() req) {
    return this.leaveService.getStatistics(query, req.user.schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取请假申请详情' })
  @ApiResponse({ status: 200, description: '申请详情' })
  @Roles(
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @Post(':id/class-teacher-approve')
  @ApiOperation({ summary: '班主任审批通过' })
  @ApiResponse({ status: 200, description: '审批成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async classTeacherApprove(
    @Param('id') id: string,
    @Body() dto: ApproveLeaveDto,
    @Request() req,
  ) {
    const result = await this.leaveService.classTeacherApprove(
      id,
      dto,
      req.user.id,
      req.user.role,
      req.user.classId,
    );
    await this.auditService.log(
      'leave_approve' as any,
      req.user.id,
      `班主任审批通过: ${result.applicationNo}`,
      req.ip,
      dto,
      HttpStatus.OK,
    );
    return result;
  }

  @Post(':id/director-approve')
  @ApiOperation({ summary: '校务主任审批通过（超过3天）' })
  @ApiResponse({ status: 200, description: '审批成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR)
  async directorApprove(
    @Param('id') id: string,
    @Body() dto: ApproveLeaveDto,
    @Request() req,
  ) {
    const result = await this.leaveService.directorApprove(
      id,
      dto,
      req.user.id,
    );
    await this.auditService.log(
      'leave_approve' as any,
      req.user.id,
      `校务主任审批通过: ${result.applicationNo}`,
      req.ip,
      dto,
      HttpStatus.OK,
    );
    return result;
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '拒绝请假申请' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectLeaveDto,
    @Request() req,
  ) {
    const result = await this.leaveService.reject(id, dto, req.user.id);
    await this.auditService.log(
      'leave_reject' as any,
      req.user.id,
      `拒绝请假申请: ${result.applicationNo}`,
      req.ip,
      dto,
      HttpStatus.OK,
    );
    return result;
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消请假申请（家长）' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @Roles(UserRole.PARENT)
  async cancel(@Param('id') id: string, @Request() req) {
    const result = await this.leaveService.cancel(id);
    await this.auditService.log(
      'leave_cancel' as any,
      req.user.id,
      `取消请假申请: ${result.applicationNo}`,
      req.ip,
      { id },
      HttpStatus.OK,
    );
    return result;
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: '销假（学生返校）' })
  @ApiResponse({ status: 200, description: '销假成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async checkIn(@Param('id') id: string, @Request() req) {
    const result = await this.leaveService.checkIn(id, req.user.id);
    await this.auditService.log(
      'leave_checkin' as any,
      req.user.id,
      `销假: ${result.applicationNo}`,
      req.ip,
      { id },
      HttpStatus.OK,
    );
    return result;
  }

  @Patch(':id/follow-up')
  @ApiOperation({ summary: '设置跟进提醒' })
  @ApiResponse({ status: 200, description: '设置成功' })
  @Roles(UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  async setFollowUp(
    @Param('id') id: string,
    @Body() dto: SetFollowUpDto,
    @Request() req,
  ) {
    const result = await this.leaveService.setFollowUp(id, dto);
    await this.auditService.log(
      'leave_update' as any,
      req.user.id,
      `设置跟进提醒: ${result.applicationNo}`,
      req.ip,
      dto,
      HttpStatus.OK,
    );
    return result;
  }
}
