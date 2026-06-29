import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { Budget, BudgetExpense } from './entities/budget.entity';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  ApproveBudgetDto,
  SubmitBudgetDto,
  QueryBudgetDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  ApproveExpenseDto,
  QueryExpenseDto,
  CreateAdjustmentDto,
  ApproveAdjustmentDto,
  QueryAdjustmentDto,
  RecordFiscalExpenseDto,
  InterCategoryTransferDto,
} from './dto/budget.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('预算管理')
@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // ==================== Budget CRUD ====================

  @Post()
  @ApiOperation({ summary: '创建预算' })
  @ApiResponse({ status: 201, description: '预算创建成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createBudget(@Body() dto: CreateBudgetDto) {
    // TODO: 获取当前用户ID
    return this.budgetService.createBudget(dto, '');
  }

  @Get()
  @ApiOperation({ summary: '获取预算列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllBudgets(@Query() query: QueryBudgetDto) {
    return this.budgetService.findAllBudgets(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取预算统计' })
  @ApiResponse({ status: 200, description: '获取成功', type: BudgetStatsDto })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  getStats(@Query('fiscalYear') fiscalYear: number) {
    return this.budgetService.getStats(fiscalYear || new Date().getFullYear());
  }

  @Get('comparison')
  @ApiOperation({ summary: '预算执行对比' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  getComparison(@Query('fiscalYear') fiscalYear: number) {
    return this.budgetService.getComparison(
      fiscalYear || new Date().getFullYear(),
    );
  }

  @Get('department-summary')
  @ApiOperation({ summary: '部门预算汇总' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  getDepartmentSummary(@Query('fiscalYear') fiscalYear: number) {
    return this.budgetService.getDepartmentSummary(
      fiscalYear || new Date().getFullYear(),
    );
  }

  @Get('monthly-trend')
  @ApiOperation({ summary: '月度趋势' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  getMonthlyTrend(@Query('fiscalYear') fiscalYear: number) {
    return this.budgetService.getMonthlyTrend(
      fiscalYear || new Date().getFullYear(),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取预算详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: Budget })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneBudget(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.findOneBudget(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新预算' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.updateBudget(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除预算' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeBudget(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.removeBudget(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交预算审批' })
  @ApiResponse({ status: 200, description: '提交成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  submitBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitBudgetDto,
  ) {
    return this.budgetService.submitBudget(id, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '批准预算' })
  @ApiResponse({ status: 200, description: '批准成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  approveBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveBudgetDto,
  ) {
    // TODO: 获取当前用户ID
    return this.budgetService.approveBudget(id, dto, '');
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '拒绝预算' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  rejectBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('comment') comment: string,
  ) {
    return this.budgetService.rejectBudget(id, comment, '');
  }

  // ==================== Expense Endpoints ====================

  @Post('expenses')
  @ApiOperation({ summary: '创建支出记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createExpense(@Body() dto: CreateExpenseDto) {
    return this.budgetService.createExpense(dto, '');
  }

  @Get('expenses')
  @ApiOperation({ summary: '获取支出列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllExpenses(@Query() query: QueryExpenseDto) {
    return this.budgetService.findAllExpenses(query);
  }

  @Get('expenses/:id')
  @ApiOperation({ summary: '获取支出详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: BudgetExpense })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findOneExpense(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.findOneExpense(id);
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: '更新支出' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  updateExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.budgetService.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除支出' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  removeExpense(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.removeExpense(id);
  }

  @Post('expenses/:id/approve')
  @ApiOperation({ summary: '批准支出' })
  @ApiResponse({ status: 200, description: '批准成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  approveExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveExpenseDto,
  ) {
    return this.budgetService.approveExpense(id, dto, '');
  }

  @Post('expenses/:id/pay')
  @ApiOperation({ summary: '标记已付款' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  payExpense(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.payExpense(id);
  }

  @Post('expenses/:id/reject')
  @ApiOperation({ summary: '拒绝支出' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  rejectExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('comment') comment: string,
  ) {
    return this.budgetService.rejectExpense(id, comment);
  }

  // ==================== Adjustment Endpoints ====================

  @Post('adjustments')
  @ApiOperation({ summary: '创建预算调整' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createAdjustment(@Body() dto: CreateAdjustmentDto) {
    return this.budgetService.createAdjustment(dto, '');
  }

  @Get('adjustments')
  @ApiOperation({ summary: '获取调整列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  findAllAdjustments(@Query() query: QueryAdjustmentDto) {
    return this.budgetService.findAllAdjustments(query);
  }

  @Post('adjustments/:id/approve')
  @ApiOperation({ summary: '批准预算调整' })
  @ApiResponse({ status: 200, description: '批准成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  approveAdjustment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveAdjustmentDto,
  ) {
    return this.budgetService.approveAdjustment(id, dto, '');
  }

  // ==================== F-NEW-004: Annual Budget Endpoints ====================

  @Post('annual')
  @ApiOperation({
    summary:
      '[F-NEW-004] Create annual budget framework with 8 categories (AC-01)',
  })
  @ApiResponse({
    status: 201,
    description: 'Annual budget created with 8 category templates',
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  createAnnualBudget(@Body() dto: CreateAnnualBudgetDto) {
    return this.budgetService.createAnnualBudget(dto, '');
  }

  @Get('annual')
  @ApiOperation({ summary: '[F-NEW-004] List annual budgets' })
  @ApiResponse({ status: 200, description: 'Success' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllAnnualBudgets(@Query('fiscalYear') fiscalYear?: number) {
    return this.budgetService.findAllAnnualBudgets(fiscalYear);
  }

  @Get('annual/:fiscalYear')
  @ApiOperation({
    summary: '[F-NEW-004] Get annual budget execution report (AC-03)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns real-time execution rates per category',
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  getAnnualBudgetReport(@Param('fiscalYear') fiscalYear: number) {
    return this.budgetService.getExecutionReport(fiscalYear);
  }

  @Post('annual/:fiscalYear/approve')
  @ApiOperation({ summary: '[F-NEW-004] Approve annual budget' })
  @ApiResponse({ status: 200, description: 'Annual budget approved' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  approveAnnualBudget(@Param('fiscalYear') fiscalYear: number) {
    return this.budgetService.approveAnnualBudget(fiscalYear, '');
  }

  // ==================== F-NEW-004: Allocation Endpoints ====================

  @Post('allocations')
  @ApiOperation({
    summary: '[F-NEW-004] Create department/category budget allocation (AC-02)',
  })
  @ApiResponse({ status: 201, description: 'Allocation created' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  createAllocation(@Body() dto: CreateBudgetAllocationDto) {
    return this.budgetService.createAllocation(dto, '');
  }

  @Get('allocations')
  @ApiOperation({ summary: '[F-NEW-004] List budget allocations' })
  @ApiResponse({ status: 200, description: 'Success' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  findAllAllocations(@Query() query: QueryBudgetAllocationDto) {
    return this.budgetService.findAllAllocations(query);
  }

  @Patch('allocations/:id')
  @ApiOperation({ summary: '[F-NEW-004] Update budget allocation' })
  @ApiResponse({ status: 200, description: 'Allocation updated' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  updateAllocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetAllocationDto,
  ) {
    return this.budgetService.updateAllocation(id, dto);
  }

  @Post('allocations/:id/approve')
  @ApiOperation({ summary: '[F-NEW-004] Approve budget allocation' })
  @ApiResponse({ status: 200, description: 'Allocation approved' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  approveAllocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.approveAllocation(id, '');
  }

  // ==================== F-NEW-004: Fiscal Expense & Warning ====================

  @Post('fiscal-expenses')
  @ApiOperation({
    summary: '[F-NEW-004] Record actual expenditure by 8-category',
  })
  @ApiResponse({ status: 201, description: 'Expense recorded' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  recordFiscalExpense(@Body() dto: RecordFiscalExpenseDto) {
    return this.budgetService.recordFiscalExpense(dto, '');
  }

  @Get('warnings')
  @ApiOperation({ summary: '[F-NEW-004] Get over-budget warning list (AC-04)' })
  @ApiResponse({
    status: 200,
    description: 'Returns categories with execution rate >= 80%',
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  checkOverBudgetWarnings(@Query('fiscalYear') fiscalYear: number) {
    return this.budgetService.checkOverBudgetWarnings(
      fiscalYear || new Date().getFullYear(),
    );
  }

  // ==================== F-NEW-004: Inter-Category Transfer ====================

  @Post('transfer')
  @ApiOperation({
    summary:
      '[F-NEW-004] Inter-category budget transfer (AC-05: ACTIVITY -HK$50k -> IT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transfer completed, adjustment recorded',
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  interCategoryTransfer(@Body() dto: InterCategoryTransferDto) {
    return this.budgetService.interCategoryTransfer(
      dto.fiscalYear,
      dto.fromCategory,
      dto.toCategory,
      dto.amount,
      dto.reason,
      '',
    );
  }
}
