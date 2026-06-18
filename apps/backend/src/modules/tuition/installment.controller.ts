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
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InstallmentService } from './installment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import {
  ApplyInstallmentDto,
  ReviewInstallmentDto,
  UpdateInstallmentStatusDto,
  PayInstallmentScheduleDto,
  CreateDisputeDto,
  ResolveDisputeDto,
  InstallmentPlanQueryDto,
  SubStatusQueryDto,
  InstallmentPlanResponseDto,
  ApplyInstallmentResponseDto,
  EarlyRepaymentResponseDto,
  SubStatusResponseDto,
  InstallmentScheduleResponseDto,
} from './dto/installment.dto';

@ApiTags('学费分期管理')
@Controller('tuition/installment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InstallmentController {
  constructor(private readonly installmentService: InstallmentService) {}

  // ============ Apply for Installment (PARENT) ============

  @Post('apply')
  @ApiOperation({ summary: '申请分期付款' })
  @ApiResponse({ status: 201, description: '分期申请成功', type: ApplyInstallmentResponseDto })
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  applyInstallment(
    @Body() dto: ApplyInstallmentDto,
    @Request() req: any,
  ) {
    return this.installmentService.applyInstallment(dto, req.user.id);
  }

  // ============ Get Installment Plan ============

  @Get(':planId')
  @ApiOperation({ summary: '获取分期计划详情' })
  @ApiResponse({ status: 200, description: '分期计划详情', type: InstallmentPlanResponseDto })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  getInstallmentPlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Request() req: any,
  ) {
    return this.installmentService.getInstallmentPlan(
      planId,
      req.user.id,
      req.user.role,
    );
  }

  // ============ Get Student Installment Plans ============

  @Get('student/:studentId')
  @ApiOperation({ summary: '获取学生分期列表' })
  @ApiResponse({ status: 200, description: '学生分期列表' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  getStudentInstallmentPlans(
    @Param('studentId') studentId: string,
    @Query() query: InstallmentPlanQueryDto,
  ) {
    return this.installmentService.getStudentInstallmentPlans(studentId, query);
  }

  // ============ Get Parent Installment Plans ============

  @Get('parent/me')
  @ApiOperation({ summary: '获取当前家长分期列表' })
  @ApiResponse({ status: 200, description: '分期列表' })
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  getMyInstallmentPlans(
    @Query() query: InstallmentPlanQueryDto,
    @Request() req: any,
  ) {
    return this.installmentService.getParentInstallmentPlans(req.user.id, query);
  }

  // ============ Get Pending Review Plans (FINANCE_STAFF) ============

  @Get('pending-review/list')
  @ApiOperation({ summary: '获取待审核分期列表' })
  @ApiResponse({ status: 200, description: '待审核分期列表' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  getPendingReviewPlans(@Query() query: InstallmentPlanQueryDto) {
    return this.installmentService.getPendingReviewPlans(query);
  }

  // ============ Review Installment Plan (FINANCE_STAFF) ============

  @Post(':planId/review')
  @ApiOperation({ summary: '审核分期申请' })
  @ApiResponse({ status: 200, description: '审核结果', type: InstallmentPlanResponseDto })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  reviewInstallmentPlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: ReviewInstallmentDto,
    @Request() req: any,
  ) {
    return this.installmentService.reviewInstallmentPlan(
      planId,
      dto,
      req.user.id,
    );
  }

  // ============ Update Installment Status ============

  @Patch(':planId/status')
  @ApiOperation({ summary: '更新分期状态' })
  @ApiResponse({ status: 200, description: '更新结果', type: InstallmentPlanResponseDto })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  updateInstallmentStatus(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: UpdateInstallmentStatusDto,
    @Request() req: any,
  ) {
    return this.installmentService.updateInstallmentStatus(
      planId,
      dto,
      req.user.id,
    );
  }

  // ============ Pay Installment Schedule ============

  @Post('schedule/:scheduleId/pay')
  @ApiOperation({ summary: '还款' })
  @ApiResponse({ status: 200, description: '还款结果', type: InstallmentScheduleResponseDto })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.PARENT,
  )
  paySchedule(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: PayInstallmentScheduleDto,
    @Request() req: any,
  ) {
    return this.installmentService.paySchedule(scheduleId, dto, req.user.id);
  }

  // ============ Early Repayment ============

  @Get(':planId/early-repayment')
  @ApiOperation({ summary: '获取提前还款金额' })
  @ApiResponse({ status: 200, description: '提前还款信息', type: EarlyRepaymentResponseDto })
  @Roles(
    UserRole.PARENT,
    UserRole.STUDENT,
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_STAFF,
  )
  getEarlyRepaymentAmount(
    @Param('planId', ParseUUIDPipe) planId: string,
  ) {
    return this.installmentService.getEarlyRepaymentAmount(planId);
  }

  @Post(':planId/early-repayment/confirm')
  @ApiOperation({ summary: '确认提前还款' })
  @ApiResponse({ status: 200, description: '还款结果', type: InstallmentPlanResponseDto })
  @Roles(
    UserRole.PARENT,
    UserRole.STUDENT,
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_STAFF,
  )
  confirmEarlyRepayment(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: PayInstallmentScheduleDto,
    @Request() req: any,
  ) {
    return this.installmentService.confirmEarlyRepayment(
      planId,
      dto.transactionId,
      req.user.id,
    );
  }
}

// ============ Sub Status Controller ============

@ApiTags('缴费子状态管理')
@Controller('tuition/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubStatusController {
  constructor(private readonly installmentService: InstallmentService) {}

  @Get('sub-status')
  @ApiOperation({ summary: '获取欠费子状态统计' })
  @ApiResponse({ status: 200, description: '子状态统计', type: SubStatusResponseDto })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  getSubStatus(
    @Query() query: SubStatusQueryDto,
    @Request() req: any,
  ) {
    return this.installmentService.getSubStatus(
      query,
      req.user.id,
    );
  }

  @Post(':paymentId/dispute')
  @ApiOperation({ summary: '发起争议' })
  @ApiResponse({ status: 201, description: '争议发起成功' })
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  createDispute(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: CreateDisputeDto,
    @Request() req: any,
  ) {
    return this.installmentService.createDispute(
      paymentId,
      dto,
      req.user.id,
    );
  }

  @Post(':paymentId/dispute/resolve')
  @ApiOperation({ summary: '解决争议' })
  @ApiResponse({ status: 200, description: '争议解决成功' })
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.SCHOOL_DIRECTOR,
    UserRole.SCHOOL_STAFF,
  )
  resolveDispute(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: ResolveDisputeDto,
    @Request() req: any,
  ) {
    return this.installmentService.resolveDispute(
      paymentId,
      dto,
      req.user.id,
    );
  }
}
