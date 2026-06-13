import {
  Controller,
  Get,
  Post,
  Put,
  
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionApprovalService } from '../services/permission-approval.service';
import {
  CreatePermissionApprovalRequestDto,
  ApprovePermissionRequestDto,
  RejectPermissionRequestDto,
  CancelPermissionRequestDto,
} from '../dto/permission-approval.dto';
import { ApprovalRequestStatus } from '../entities/permission-approval.entity';

@ApiTags('permission-approval')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permission-approval')
export class PermissionApprovalController {
  constructor(
    private readonly permissionApprovalService: PermissionApprovalService,
  ) {}

  @Post('requests')
  @Roles('school_admin', 'system_admin')
  @ApiOperation({ summary: 'Create a new permission approval request' })
  @ApiResponse({
    status: 201,
    description: 'Permission approval request created successfully',
  })
  async createRequest(
    @Req() req,
    @Body() createDto: CreatePermissionApprovalRequestDto,
  ) {
    return this.permissionApprovalService.createRequest(
      req.user,
      createDto,
      req.user.schoolId,
    );
  }

  @Get('requests/:id')
  @Roles('school_admin', 'system_admin')
  @ApiOperation({ summary: 'Get a permission approval request by ID' })
  @ApiResponse({
    status: 200,
    description: 'Permission approval request retrieved successfully',
  })
  async getRequestById(@Req() req, @Param('id') id: string) {
    return this.permissionApprovalService.getRequestById(id, req.user);
  }

  @Get('requests/my')
  @Roles('school_admin', 'system_admin')
  @ApiOperation({ summary: 'Get my permission approval requests' })
  @ApiResponse({
    status: 200,
    description: 'My permission approval requests retrieved successfully',
  })
  async getMyRequests(
    @Req() req,
    @Query('status') status?: ApprovalRequestStatus,
  ) {
    return this.permissionApprovalService.getMyRequests(req.user, status);
  }

  @Get('pending-approvals')
  @Roles('school_admin', 'system_admin')
  @ApiOperation({ summary: 'Get pending approvals for current user' })
  @ApiResponse({
    status: 200,
    description: 'Pending approvals retrieved successfully',
  })
  async getMyPendingApprovals(@Req() req) {
    return this.permissionApprovalService.getMyPendingApprovals(req.user);
  }

  @Put('requests/:id/approve')
  @Roles('school_admin', 'system_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a permission approval request' })
  @ApiResponse({
    status: 200,
    description: 'Permission approval request approved successfully',
  })
  async approveRequest(
    @Req() req,
    @Param('id') id: string,
    @Body() approveDto: ApprovePermissionRequestDto,
  ) {
    return this.permissionApprovalService.approveRequest(
      id,
      req.user,
      approveDto,
    );
  }

  @Put('requests/:id/reject')
  @Roles('school_admin', 'system_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a permission approval request' })
  @ApiResponse({
    status: 200,
    description: 'Permission approval request rejected successfully',
  })
  async rejectRequest(
    @Req() req,
    @Param('id') id: string,
    @Body() rejectDto: RejectPermissionRequestDto,
  ) {
    return this.permissionApprovalService.rejectRequest(
      id,
      req.user,
      rejectDto,
    );
  }

  @Put('requests/:id/cancel')
  @Roles('school_admin', 'system_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a permission approval request' })
  @ApiResponse({
    status: 200,
    description: 'Permission approval request cancelled successfully',
  })
  async cancelRequest(
    @Req() req,
    @Param('id') id: string,
    @Body() cancelDto: CancelPermissionRequestDto,
  ) {
    return this.permissionApprovalService.cancelRequest(
      id,
      req.user,
      cancelDto,
    );
  }
}
