import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  PermissionApprovalRequest,
  ApprovalRequestStatus,
  ApprovalStepStatus,
  ApprovalRole,
} from '../entities/permission-approval.entity';
import {
  CreatePermissionApprovalRequestDto,
  ApprovePermissionRequestDto,
  RejectPermissionRequestDto,
  CancelPermissionRequestDto,
} from '../dto/permission-approval.dto';
import { User } from '../../user/user.entity';
import { AuditService } from '../../audit/services/audit.service';
import { NotificationService } from '../../notification/services/notification.service';
import { PermissionService } from '../../permission/services/permission.service';
import { RoleService } from '../../role/services/role.service';

@Injectable()
export class PermissionApprovalService {
  constructor(
    @InjectRepository(PermissionApprovalRequest)
    private readonly approvalRequestRepository: Repository<PermissionApprovalRequest>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
  ) {}

  async createRequest(
    user: User,
    createDto: CreatePermissionApprovalRequestDto,
    schoolId: string,
  ) {
    // Check if target user exists
    // TODO: Implement user existence check

    // Determine risk level and required steps
    let riskLevel = 'low';
    let requiredSteps = 1;

    if (createDto.roleId) {
      const role = await this.roleService.findOne(createDto.roleId);
      if (role.name.includes('admin') || role.name.includes('super')) {
        riskLevel = 'high';
        requiredSteps = 2;
      } else {
        riskLevel = 'medium';
      }
    }

    // Create approval steps
    const steps = [];
    steps.push({
      stepOrder: 1,
      approverRole: ApprovalRole.SCHOOL_ADMIN,
      status:
        requiredSteps >= 1
          ? ApprovalStepStatus.PENDING
          : ApprovalStepStatus.SKIPPED,
    });

    if (requiredSteps >= 2) {
      steps.push({
        stepOrder: 2,
        approverRole: ApprovalRole.SYSTEM_ADMIN,
        status: ApprovalStepStatus.PENDING,
      });
    }

    // Create request
    const request = this.approvalRequestRepository.create({
      requesterId: user.id,
      targetUserId: createDto.targetUserId,
      changeType: createDto.changeType,
      roleId: createDto.roleId,
      permissionIds: createDto.permissionIds,
      requestReason: createDto.requestReason,
      validFrom: createDto.validFrom ? new Date(createDto.validFrom) : null,
      validUntil: createDto.validUntil ? new Date(createDto.validUntil) : null,
      riskLevel,
      totalSteps: requiredSteps,
      schoolId,
      steps,
    });

    await this.approvalRequestRepository.save(request);

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: 'PERMISSION_APPROVAL_REQUEST_CREATED',
      resourceType: 'PERMISSION_APPROVAL',
      resourceId: request.id,
      details: {
        targetUserId: createDto.targetUserId,
        changeType: createDto.changeType,
        roleId: createDto.roleId,
        permissionIds: createDto.permissionIds,
        riskLevel,
      },
    });

    // Send notification to approvers
    await this.sendApprovalNotification(request);

    return request;
  }

  async getRequestById(id: string, user: User) {
    const request = await this.approvalRequestRepository.findOne({
      where: { id },
      relations: ['requester', 'targetUser', 'steps', 'steps.approver', 'role'],
    });

    if (!request) {
      throw new NotFoundException('Approval request not found');
    }

    // Check if user is allowed to view this request
    const isRequester = request.requesterId === user.id;
    const isTargetUser = request.targetUserId === user.id;
    const isApprover = await this.isUserApproverForRequest(request, user);

    if (
      !isRequester &&
      !isTargetUser &&
      !isApprover &&
      !user.roles.some((r) => r.name === 'super_admin')
    ) {
      throw new ForbiddenException('You are not allowed to view this request');
    }

    return request;
  }

  async getMyRequests(user: User, status?: ApprovalRequestStatus) {
    const query = this.approvalRequestRepository
      .createQueryBuilder('request')
      .where('request.requesterId = :userId', { userId: user.id })
      .leftJoinAndSelect('request.steps', 'steps')
      .leftJoinAndSelect('request.role', 'role');

    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    return query.getMany();
  }

  async getMyPendingApprovals(user: User) {
    // Get user roles
    const userRoles = user.roles.map((r) => r.name);

    const requests = await this.approvalRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.steps', 'steps')
      .leftJoinAndSelect('request.requester', 'requester')
      .leftJoinAndSelect('request.targetUser', 'targetUser')
      .leftJoinAndSelect('request.role', 'role')
      .where('request.status = :status', {
        status: ApprovalRequestStatus.PENDING,
      })
      .andWhere('steps.stepOrder = request.currentStep + 1')
      .andWhere('steps.status = :stepStatus', {
        stepStatus: ApprovalStepStatus.PENDING,
      })
      .andWhere('steps.approverRole IN (:...roles)', { roles: userRoles })
      .getMany();

    return requests;
  }

  async approveRequest(
    id: string,
    user: User,
    approveDto: ApprovePermissionRequestDto,
  ) {
    const request = await this.getRequestById(id, user);

    if (request.status !== ApprovalRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending approval');
    }

    const currentStep = request.steps.find(
      (s) => s.stepOrder === request.currentStep + 1,
    );
    if (!currentStep || currentStep.status !== ApprovalStepStatus.PENDING) {
      throw new BadRequestException('No pending approval step found');
    }

    // Check if user is allowed to approve this step
    const isAllowed = user.roles.some(
      (r) => r.name === currentStep.approverRole,
    );
    if (!isAllowed && !user.roles.some((r) => r.name === 'super_admin')) {
      throw new ForbiddenException(
        'You are not allowed to approve this request',
      );
    }

    // Approve the step
    currentStep.status = ApprovalStepStatus.APPROVED;
    currentStep.approverId = user.id;
    currentStep.comment = approveDto.comment;
    currentStep.approvedAt = new Date();

    request.currentStep += 1;

    // Check if all steps are approved
    if (request.currentStep >= request.totalSteps) {
      request.status = ApprovalRequestStatus.APPROVED;

      // Apply the permission change
      await this.applyPermissionChange(request);

      // Notify requester
      await this.notificationService.sendNotification({
        userId: request.requesterId,
        title: 'Permission request approved',
        content: `Your permission change request for user ${request.targetUser.name} has been approved.`,
        type: 'system',
        priority: 'high',
      });

      // Notify target user
      await this.notificationService.sendNotification({
        userId: request.targetUserId,
        title: 'Your permissions have been updated',
        content: `Your permissions have been updated based on an approved request.`,
        type: 'system',
        priority: 'high',
      });
    } else {
      // Notify next approver
      await this.sendApprovalNotification(request);
    }

    await this.approvalRequestRepository.save(request);

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: 'PERMISSION_APPROVAL_REQUEST_APPROVED',
      resourceType: 'PERMISSION_APPROVAL',
      resourceId: request.id,
      details: {
        step: currentStep.stepOrder,
        comment: approveDto.comment,
      },
    });

    return request;
  }

  async rejectRequest(
    id: string,
    user: User,
    rejectDto: RejectPermissionRequestDto,
  ) {
    const request = await this.getRequestById(id, user);

    if (request.status !== ApprovalRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending approval');
    }

    const currentStep = request.steps.find(
      (s) => s.stepOrder === request.currentStep + 1,
    );
    if (!currentStep || currentStep.status !== ApprovalStepStatus.PENDING) {
      throw new BadRequestException('No pending approval step found');
    }

    // Check if user is allowed to reject this step
    const isAllowed = user.roles.some(
      (r) => r.name === currentStep.approverRole,
    );
    if (!isAllowed && !user.roles.some((r) => r.name === 'super_admin')) {
      throw new ForbiddenException(
        'You are not allowed to reject this request',
      );
    }

    // Reject the step and request
    currentStep.status = ApprovalStepStatus.REJECTED;
    currentStep.approverId = user.id;
    currentStep.comment = rejectDto.rejectionReason;
    currentStep.approvedAt = new Date();

    request.status = ApprovalRequestStatus.REJECTED;
    request.rejectionReason = rejectDto.rejectionReason;

    await this.approvalRequestRepository.save(request);

    // Notify requester
    await this.notificationService.sendNotification({
      userId: request.requesterId,
      title: 'Permission request rejected',
      content: `Your permission change request for user ${request.targetUser.name} has been rejected. Reason: ${rejectDto.rejectionReason}`,
      type: 'system',
      priority: 'high',
    });

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: 'PERMISSION_APPROVAL_REQUEST_REJECTED',
      resourceType: 'PERMISSION_APPROVAL',
      resourceId: request.id,
      details: {
        step: currentStep.stepOrder,
        rejectionReason: rejectDto.rejectionReason,
      },
    });

    return request;
  }

  async cancelRequest(
    id: string,
    user: User,
    cancelDto: CancelPermissionRequestDto,
  ) {
    const request = await this.getRequestById(id, user);

    if (request.status !== ApprovalRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending approval');
    }

    if (
      request.requesterId !== user.id &&
      !user.roles.some((r) => r.name === 'super_admin')
    ) {
      throw new ForbiddenException(
        'You are not allowed to cancel this request',
      );
    }

    request.status = ApprovalRequestStatus.CANCELLED;
    request.rejectionReason = cancelDto.reason || 'Cancelled by requester';

    await this.approvalRequestRepository.save(request);

    // Notify approvers
    // TODO: Get users with the required approver roles and send notifications

    // Log audit
    await this.auditService.log({
      userId: user.id,
      action: 'PERMISSION_APPROVAL_REQUEST_CANCELLED',
      resourceType: 'PERMISSION_APPROVAL',
      resourceId: request.id,
      details: {
        reason: cancelDto.reason,
      },
    });

    return request;
  }

  private async isUserApproverForRequest(
    request: PermissionApprovalRequest,
    user: User,
  ): Promise<boolean> {
    const userRoles = user.roles.map((r) => r.name);
    return request.steps.some(
      (s) =>
        s.status === ApprovalStepStatus.PENDING &&
        userRoles.includes(s.approverRole),
    );
  }

  private async sendApprovalNotification(request: PermissionApprovalRequest) {
    const currentStep = request.steps.find(
      (s) => s.stepOrder === request.currentStep + 1,
    );
    if (!currentStep) return;

    // Get all users with the required approver role in the same school
    // Use RoleService to fetch approvers by role name
    const approverRoleName =
      currentStep.approverRole === ApprovalRole.SCHOOL_ADMIN
        ? 'school_admin'
        : 'system_admin';

    let approverIds: string[];
    try {
      approverIds = await this.roleService.getUsersByRole(
        approverRoleName,
        request.schoolId,
      );
    } catch (error) {
      console.warn(
        `[PermissionApproval] Failed to fetch approvers for role ${approverRoleName}:`,
        error,
      );
      approverIds = [];
    }

    for (const approverId of approverIds) {
      // Don't notify the requester if they happen to have the approver role
      if (approverId === request.requesterId) continue;

      await this.notificationService.sendNotification({
        userId: approverId,
        title: 'New permission approval request',
        content: `A new permission change request (Risk: ${request.riskLevel}) requires your approval.`,
        type: 'system',
        priority: request.riskLevel === 'high' ? 'high' : 'normal',
        metadata: {
          requestId: request.id,
          targetUserId: request.targetUserId,
          changeType: request.changeType,
        },
      });
    }
  }

  private async applyPermissionChange(request: PermissionApprovalRequest) {
    // Apply the permission change based on the request type
    if (request.roleId) {
      if (request.changeType === 'grant') {
        await this.roleService.assignRoleToUser(
          request.targetUserId,
          request.roleId,
          request.validUntil,
        );
      } else if (request.changeType === 'revoke') {
        await this.roleService.removeRoleFromUser(
          request.targetUserId,
          request.roleId,
        );
      }
    }

    if (request.permissionIds && request.permissionIds.length > 0) {
      if (request.changeType === 'grant') {
        await this.permissionService.assignPermissionsToUser(
          request.targetUserId,
          request.permissionIds,
        );
      } else if (request.changeType === 'revoke') {
        await this.permissionService.removePermissionsFromUser(
          request.targetUserId,
          request.permissionIds,
        );
      }
    }
  }

  async expireOldRequests() {
    // Expire requests older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const requestsToExpire = await this.approvalRequestRepository.find({
      where: {
        status: ApprovalRequestStatus.PENDING,
        createdAt: LessThan(thirtyDaysAgo),
      },
    });

    for (const request of requestsToExpire) {
      request.status = ApprovalRequestStatus.EXPIRED;
      await this.approvalRequestRepository.save(request);

      // Notify requester
      await this.notificationService.sendNotification({
        userId: request.requesterId,
        title: 'Permission request expired',
        content: `Your permission change request for user ${request.targetUser.name} has expired.`,
        type: 'system',
        priority: 'medium',
      });
    }

    return { expiredCount: requestsToExpire.length };
  }
}
