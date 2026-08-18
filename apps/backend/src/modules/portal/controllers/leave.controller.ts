import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
} from '@nestjs/swagger';
import { LeaveService } from '../services/leave.service';
import { CreateLeaveDto } from '../dto/create-leave.dto';
import { LeaveQueryDto, ApproveLeaveDto } from '../dto/update-leave.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('门户 — 电子请假')
@Controller('portal/leave')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '提交请假申请' })
  @ApiResponse({ status: 201, description: '请假提交成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  async create(@Body() dto: CreateLeaveDto, @Request() req) {
    return this.leaveService.create(
      dto,
      req.user.id,
      req.user.role,
      req.ip,
    );
  }

  @Get()
  @ApiOperation({ summary: '查询请假记录列表' })
  @ApiResponse({ status: 200, description: '返回请假记录列表' })
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  async findAll(@Query() query: LeaveQueryDto, @Request() req) {
    return this.leaveService.findAll(
      query,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取请假详情' })
  @ApiResponse({ status: 200, description: '返回请假详情' })
  @ApiResponse({ status: 404, description: '请假记录不存在' })
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.leaveService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '撤回请假（仅 pending 状态可撤回）' })
  @ApiResponse({ status: 200, description: '请假已撤回' })
  @ApiResponse({ status: 400, description: '不能撤回（非 pending 状态）' })
  @ApiResponse({ status: 403, description: '无权撤回此请假' })
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  async cancel(@Param('id') id: string, @Request() req) {
    return this.leaveService.cancel(id, req.user.id, req.user.role, req.ip);
  }

  // 兼容旧调用：DELETE /:id 同样执行软撤回（status → cancelled，非物理删除）
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '撤回请假（软删除，置为 cancelled；兼容 DELETE 旧路径）' })
  @ApiResponse({ status: 200, description: '请假已撤回' })
  @ApiResponse({ status: 400, description: '不能撤回（非 pending 状态）' })
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  async cancelLegacy(@Param('id') id: string, @Request() req) {
    return this.leaveService.cancel(id, req.user.id, req.user.role, req.ip);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '审批请假（approve/reject）' })
  @ApiResponse({ status: 200, description: '审批完成' })
  @ApiResponse({ status: 403, description: '无权审批' })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveLeaveDto,
    @Request() req,
  ) {
    return this.leaveService.approve(
      id,
      dto,
      req.user.id,
      req.user.role,
      'approve',
      req.ip,
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '驳回请假' })
  @ApiResponse({ status: 200, description: '已驳回' })
  @ApiResponse({ status: 403, description: '无权审批' })
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR)
  async reject(
    @Param('id') id: string,
    @Body() dto: ApproveLeaveDto,
    @Request() req,
  ) {
    return this.leaveService.approve(
      id,
      dto,
      req.user.id,
      req.user.role,
      'reject',
      req.ip,
    );
  }
}
