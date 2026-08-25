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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PettyCashService } from './petty-cash.service';
import {
  CreateReimbursementDto,
  SubmitReimbursementDto,
  ApproveReimbursementDto,
  RejectReimbursementDto,
  CancelReimbursementDto,
  QueryReimbursementDto,
  TopUpDto,
  QueryTransactionDto,
  CreateConfigDto,
  UpdateConfigDto,
  ConfirmConfigDto,
} from './dto/petty-cash.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

const STAFF_ROLES: UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SCHOOL_STAFF,
];
const FINANCE_ROLES: UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
];

@ApiTags('零用现金报销（F-FIN-002）')
@Controller('petty-cash')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PettyCashController {
  constructor(private readonly pettyCashService: PettyCashService) {}

  // ==================== 备用金配置 ====================

  @Post('configs')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: '创建备用金配置（学年）' })
  createConfig(
    @Body() dto: CreateConfigDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.createConfig(dto, user?.id);
  }

  @Patch('configs/:id')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: '更新备用金配置（未确认前）' })
  updateConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConfigDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.updateConfig(id, dto, user?.id);
  }

  @Post('configs/:id/confirm')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: '确认配置（校务主任）生效' })
  confirmConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmConfigDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.confirmConfig(id, dto, user?.id);
  }

  @Get('configs/active')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: '获取已确认配置（学年）' })
  findActiveConfig(@Query('academicYearId') academicYearId: string) {
    return this.pettyCashService.findActiveConfig(academicYearId);
  }

  // ==================== 报销申请 ====================

  @Post('reimbursements')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: '创建报销草稿（填单+收据）' })
  createReimbursement(
    @Body() dto: CreateReimbursementDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.createReimbursement(dto, user);
  }

  @Get('reimbursements')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: '报销单列表' })
  findReimbursements(@Query() query: QueryReimbursementDto) {
    return this.pettyCashService.findReimbursements(query);
  }

  @Get('reimbursements/:id')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: '报销详情（含流水）' })
  findReimbursement(@Param('id', ParseUUIDPipe) id: string) {
    return this.pettyCashService.findReimbursement(id);
  }

  @Post('reimbursements/:id/submit')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: '提交报销（>HK$500 触发双人见证）' })
  submitReimbursement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitReimbursementDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.submitReimbursement(id, dto, user);
  }

  @Post('reimbursements/:id/approve')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: '审批通过（校务主任）' })
  approveReimbursement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveReimbursementDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.approveReimbursement(id, dto, user);
  }

  @Post('reimbursements/:id/reject')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: '审批拒绝' })
  rejectReimbursement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectReimbursementDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.rejectReimbursement(id, dto, user);
  }

  @Post('reimbursements/:id/cancel')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: '申请人取消' })
  cancelReimbursement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelReimbursementDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.cancelReimbursement(id, dto, user);
  }

  @Post('reimbursements/:id/paid')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: '出账（扣减备用金）' })
  markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.markPaid(id, user);
  }

  // ==================== 备用金补充 ====================

  @Post('top-up')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: '备用金补充（先双人见证后入账）' })
  topUp(
    @Body() dto: TopUpDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.pettyCashService.topUp(dto, user);
  }

  // ==================== 流水与余额 ====================

  @Get('transactions')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: '备用金流水' })
  findTransactions(@Query() query: QueryTransactionDto) {
    return this.pettyCashService.findTransactions(query);
  }

  @Get('float-status')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: '备用金余额及低额状态' })
  getFloatStatus(@Query('academicYearId') academicYearId: string) {
    return this.pettyCashService.getFloatStatus(academicYearId || '');
  }
}
