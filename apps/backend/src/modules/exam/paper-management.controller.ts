import {
  Controller,
  Get,
  Post,
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
import { PaperManagementService } from './paper-management.service';
import {
  ExamPaper,
  ExamPaperRequest,
  ExamPaperDistribution,
} from './paper-management.entity';
import {
  CreatePaperRequestDto,
  ApprovePaperRequestDto,
  OrderPaperRequestDto,
  PaperRequestQueryDto,
  CreatePaperDto,
  PaperQueryDto,
  SealPaperDto,
  UpdatePaperStatusDto,
  DistributePaperDto,
  ReturnPaperDto,
  DestroyPaperDto,
  DistributionQueryDto,
} from './dto/paper-management.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

/**
 * 权限角色映射（基于 §18.5.4 矩阵 + 既有 UserRole 枚举）：
 * - STAFF_ROLES：校长/教务处/校务主任 → SCHOOL_DIRECTOR/SCHOOL_STAFF/SYSTEM_ADMIN
 * - PAPER_MGMT_ROLES：STAFF + 教研组长(教师) —— 需求/印刷/密封阶段
 * 分发/回收/销毁仅限行政管理角色（教师/教研组长不可）。
 */
const STAFF_ROLES: UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SCHOOL_STAFF,
];

/** 需求/印刷/密封：含教研组长（TEACHER） */
const PAPER_MGMT_ROLES: UserRole[] = [...STAFF_ROLES, UserRole.TEACHER];

@ApiTags('试卷管理')
@Controller('exam/papers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaperManagementController {
  constructor(
    private readonly paperManagementService: PaperManagementService,
  ) {}

  /* ---------------- 印刷申请 & 需求统计（F-EXAM-002a/b） ---------------- */

  @Post('requests')
  @ApiOperation({ summary: '试卷需求统计/印刷申请（F-002a/b）' })
  @ApiResponse({
    status: 201,
    description: '申请创建成功',
    type: ExamPaperRequest,
  })
  @Roles(...PAPER_MGMT_ROLES)
  createRequest(
    @Body() dto: CreatePaperRequestDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.createRequest(dto, user?.id);
  }

  @Get('requests')
  @ApiOperation({ summary: '印刷申请列表' })
  @ApiResponse({ status: 200, description: '获取印刷申请列表成功' })
  @Roles(...PAPER_MGMT_ROLES)
  findAllRequests(@Query() query: PaperRequestQueryDto) {
    return this.paperManagementService.findAllRequests(query);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: '印刷申请详情' })
  @ApiResponse({ status: 200, description: '获取印刷申请详情成功' })
  @ApiResponse({ status: 404, description: '印刷申请不存在' })
  @Roles(...PAPER_MGMT_ROLES)
  findRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.paperManagementService.findRequest(id);
  }

  @Post('requests/:id/approve')
  @ApiOperation({ summary: '审批印刷申请（draft -> approved）' })
  @ApiResponse({ status: 200, description: '审批成功', type: ExamPaperRequest })
  @Roles(...STAFF_ROLES)
  approveRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePaperRequestDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.approveRequest(id, dto, user?.id);
  }

  @Post('requests/:id/order')
  @ApiOperation({ summary: '生成供应商印刷订单（approved -> ordered）' })
  @ApiResponse({ status: 200, description: '下单成功', type: ExamPaperRequest })
  @Roles(...STAFF_ROLES)
  orderRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OrderPaperRequestDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.orderRequest(id, dto, user?.id);
  }

  @Post('requests/:id/receive')
  @ApiOperation({ summary: '印刷完成确认收货（ordered -> received）' })
  @ApiResponse({ status: 200, description: '确认收货成功', type: ExamPaperRequest })
  @Roles(...PAPER_MGMT_ROLES)
  receiveRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.receiveRequest(id, user?.id);
  }

  @Post('requests/:id/cancel')
  @ApiOperation({ summary: '取消印刷申请（draft -> cancelled）' })
  @ApiResponse({ status: 200, description: '取消成功', type: ExamPaperRequest })
  @Roles(...STAFF_ROLES)
  cancelRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.cancelRequest(id, user?.id);
  }

  /* ---------------- 试卷 & 密封追踪（F-EXAM-002c） ---------------- */

  @Post()
  @ApiOperation({ summary: '录入试卷（F-002c，密封追踪起始）' })
  @ApiResponse({ status: 201, description: '试卷创建成功', type: ExamPaper })
  @Roles(...PAPER_MGMT_ROLES)
  createPaper(
    @Body() dto: CreatePaperDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.createPaper(dto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: '试卷列表' })
  @ApiResponse({ status: 200, description: '获取试卷列表成功' })
  @Roles(...PAPER_MGMT_ROLES)
  findAllPapers(@Query() query: PaperQueryDto) {
    return this.paperManagementService.findAllPapers(query);
  }

  @Get('distributions')
  @ApiOperation({ summary: '分发/回收记录列表（F-EXAM-002e/f）' })
  @ApiResponse({ status: 200, description: '获取分发记录成功' })
  @Roles(...STAFF_ROLES)
  findAllDistributions(@Query() query: DistributionQueryDto) {
    return this.paperManagementService.findAllDistributions(query);
  }

  @Get('distributions/:id')
  @ApiOperation({ summary: '分发/回收记录详情' })
  @ApiResponse({ status: 200, description: '获取分发记录成功' })
  @Roles(...STAFF_ROLES)
  findDistribution(@Param('id', ParseUUIDPipe) id: string) {
    return this.paperManagementService.findDistribution(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '试卷详情（含保管链 custodyChain）' })
  @ApiResponse({ status: 200, description: '获取试卷详情成功', type: ExamPaper })
  @ApiResponse({ status: 404, description: '试卷不存在' })
  @Roles(...PAPER_MGMT_ROLES)
  findPaper(@Param('id', ParseUUIDPipe) id: string) {
    return this.paperManagementService.findPaper(id);
  }

  @Post(':id/seal')
  @ApiOperation({ summary: '密封试卷（PRINTED -> SEALED，记 sealNo）' })
  @ApiResponse({ status: 200, description: '密封成功', type: ExamPaper })
  @ApiResponse({ status: 409, description: '状态非法转换' })
  @Roles(...PAPER_MGMT_ROLES)
  seal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SealPaperDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.sealPaper(id, dto, user?.id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: '状态流转（in_safe/distributed/returned/used/archived…）' })
  @ApiResponse({ status: 200, description: '状态流转成功', type: ExamPaper })
  @ApiResponse({ status: 409, description: '非法转换或遗失告警（PAPER_LOST_ALERT）' })
  @Roles(...STAFF_ROLES)
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaperStatusDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.transitionStatus(id, dto, user?.id);
  }

  @Post(':id/distribute')
  @ApiOperation({ summary: '分发（F-002e，监考签收）' })
  @ApiResponse({ status: 200, description: '分发成功', type: ExamPaper })
  @Roles(...STAFF_ROLES)
  distribute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DistributePaperDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.distributePaper(id, dto, user?.id);
  }

  @Post(':id/return')
  @ApiOperation({ summary: '回收（F-002f）' })
  @ApiResponse({ status: 200, description: '回收成功', type: ExamPaper })
  @Roles(...STAFF_ROLES)
  returnPaper(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnPaperDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.returnPaper(id, dto, user?.id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: '归档（RETURNED -> ARCHIVED）' })
  @ApiResponse({ status: 200, description: '归档成功', type: ExamPaper })
  @Roles(...STAFF_ROLES)
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DestroyPaperDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.archivePaper(
      id,
      dto.retentionUntil,
      user?.id,
    );
  }

  @Post(':id/destroy')
  @ApiOperation({ summary: '审批销毁（ARCHIVED -> DESTROYED）' })
  @ApiResponse({ status: 200, description: '销毁成功', type: ExamPaper })
  @ApiResponse({ status: 409, description: '仅归档可销毁' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  destroy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DestroyPaperDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.destroyPaper(id, dto, user?.id);
  }

  @Post(':id/used')
  @ApiOperation({ summary: '标记考试使用中（DISTRIBUTED -> USED）' })
  @ApiResponse({ status: 200, description: '标记成功', type: ExamPaper })
  @Roles(...STAFF_ROLES)
  markUsed(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.markUsed(id, user?.id);
  }

  @Post(':id/lost')
  @ApiOperation({ summary: '登记遗失（触发告警语义）' })
  @ApiResponse({ status: 200, description: '遗失已登记', type: ExamPaper })
  @ApiResponse({ status: 409, description: '当前状态不可登记遗失' })
  @Roles(...STAFF_ROLES)
  markLost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { note?: string },
    @CurrentUser() user: { id?: string },
  ) {
    return this.paperManagementService.markLost(id, body?.note, user?.id);
  }
}
