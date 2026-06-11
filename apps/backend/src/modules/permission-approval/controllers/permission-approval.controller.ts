import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PermissionApprovalService } from '../services/permission-approval.service';
import {
  CreatePermissionApprovalRequestDto,
  ApprovePermissionRequestDto,
  RejectPermissionRequestDto,
  CancelPermissionRequestDto,
} from '../dto/permission-approval.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('ABAC权限审批')
@Controller('permission-approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PermissionApprovalController {
  constructor(
    private readonly permissionApprovalService: PermissionApprovalService,
  ) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_STAFF)
  @ApiOperation({ summary: '创建权限变更申请' })
  async createRequest(
    @Request() req: any,
    @Body() createDto: CreatePermissionApprovalRequestDto,
  ) {
    const user = req.user as any;
    return this.permissionApprovalService.createRequest(
      user,
      createDto,
      user.schoolId,
    );
  }

  @Get('my-requests')
  @ApiOperation({ summary: '获取我发起的权限申请列表' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected', 'expired', 'cancelled'] })
  async getMyRequests(@Request() req: any, @Query('status') status?: string) {
    const user = req.user as any;
    return this.permissionApprovalService.getMyRequests(
      user,
      status as any,
    );
  }

  @Get('pending-approvals')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: '获取待我审批的权限申请列表' })
  async getPendingApprovals(@Request() req: any) {
    const user = req.user as any;
    return this.permissionApprovalService.getMyPendingApprovals(user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取权限申请详情' })
  async getRequestById(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const user = req.user as any;
    return this.permissionApprovalService.getRequestById(id, user);
  }

  @Patch(':id/approve')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: '审批通过权限申请' })
  async approveRequest(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveDto: ApprovePermissionRequestDto,
  ) {
    const user = req.user as any;
    return this.permissionApprovalService.approveRequest(id, user, approveDto);
  }

  @Patch(':id/reject')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: '驳回权限申请' })
  async rejectRequest(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rejectDto: RejectPermissionRequestDto,
  ) {
    const user = req.user as any;
    return this.permissionApprovalService.rejectRequest(id, user, rejectDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消权限申请' })
  async cancelRequest(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelDto: CancelPermissionRequestDto,
  ) {
    const user = req.user as any;
    return this.permissionApprovalService.cancelRequest(id, user, cancelDto);
  }

  @Post('expire-old')
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: '过期处理：自动过期30天以上的待审批请求（管理员用）' })
  async expireOldRequests() {
    return this.permissionApprovalService.expireOldRequests();
  }
}
