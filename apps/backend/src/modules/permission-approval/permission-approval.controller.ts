import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionApprovalService } from './services/permission-approval.service';
import {
  CreatePermissionApprovalRequestDto,
  ApprovePermissionRequestDto,
  RejectPermissionRequestDto,
  CancelPermissionRequestDto,
} from './dto/permission-approval.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Permission Approval')
@Controller('api/v1/permission-approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PermissionApprovalController {
  constructor(
    private readonly permissionApprovalService: PermissionApprovalService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new permission approval request' })
  @Roles('school_admin', 'school_staff', 'system_admin')
  async createRequest(
    @Request() req,
    @Body() createDto: CreatePermissionApprovalRequestDto,
  ) {
    return this.permissionApprovalService.createRequest(
      req.user,
      createDto,
      req.user.schoolId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a permission approval request by ID' })
  async getRequest(@Param('id') id: string, @Request() req) {
    return this.permissionApprovalService.getRequestById(id, req.user);
  }

  @Get('my/requests')
  @ApiOperation({ summary: 'Get my permission approval requests' })
  @Roles('school_admin', 'school_staff', 'system_admin')
  async getMyRequests(
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.permissionApprovalService.getMyRequests(req.user, status as any);
  }

  @Get('my/pending')
  @ApiOperation({ summary: 'Get my pending approval tasks' })
  @Roles('school_admin', 'system_admin')
  async getMyPendingApprovals(@Request() req) {
    return this.permissionApprovalService.getMyPendingApprovals(req.user);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a permission request' })
  @Roles('school_admin', 'system_admin')
  async approve(
    @Param('id') id: string,
    @Request() req,
    @Body() approveDto: ApprovePermissionRequestDto,
  ) {
    return this.permissionApprovalService.approveRequest(
      id,
      req.user,
      approveDto,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a permission request' })
  @Roles('school_admin', 'system_admin')
  async reject(
    @Param('id') id: string,
    @Request() req,
    @Body() rejectDto: RejectPermissionRequestDto,
  ) {
    return this.permissionApprovalService.rejectRequest(
      id,
      req.user,
      rejectDto,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a permission request' })
  async cancel(
    @Param('id') id: string,
    @Request() req,
    @Body() cancelDto: CancelPermissionRequestDto,
  ) {
    return this.permissionApprovalService.cancelRequest(id, req.user, cancelDto);
  }
}
