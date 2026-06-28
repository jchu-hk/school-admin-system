import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like, FindOptionsWhere } from 'typeorm';
import {
  Budget,
  BudgetStatus,
  BudgetExpense,
  BudgetAdjustment,
  ExpenseStatus,
  ExpenseCategory,
  BudgetAdjustType,
  AnnualBudget,
  BudgetAllocation,
  FiscalBudgetCategory,
  BudgetExecutionStatus,
} from './entities/budget.entity';
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
  BudgetStatsDto,
  BudgetComparisonDto,
  MonthlyTrendDto,
  CreateAnnualBudgetDto,
  CreateBudgetAllocationDto,
  UpdateBudgetAllocationDto,
  QueryBudgetAllocationDto,
  RecordFiscalExpenseDto,
} from './dto/budget.dto';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(BudgetExpense)
    private readonly expenseRepo: Repository<BudgetExpense>,
    @InjectRepository(BudgetAdjustment)
    private readonly adjustmentRepo: Repository<BudgetAdjustment>,
    @InjectRepository(AnnualBudget)
    private readonly annualBudgetRepo: Repository<AnnualBudget>,
    @InjectRepository(BudgetAllocation)
    private readonly allocationRepo: Repository<BudgetAllocation>,
  ) {}

  // ==================== Budget CRUD ====================

  async createBudget(dto: CreateBudgetDto, userId: string): Promise<Budget> {
    const budget = this.budgetRepo.create({
      ...dto,
      createdBy: userId,
      status: BudgetStatus.DRAFT,
      approvedAmount: dto.approvedAmount ?? 0,
      allocatedAmount: 0,
      committedAmount: 0,
      actualSpent: 0,
      remainingAmount: dto.approvedAmount ?? 0,
    } as Budget);
    return this.budgetRepo.save(budget);
  }

  async findAllBudgets(query: QueryBudgetDto): Promise<{ data: Budget[]; total: number }> {
    const where: FindOptionsWhere<Budget> = {};

    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.name = Like(`%${query.keyword}%`);
    }

    const [data, total] = await this.budgetRepo.findAndCount({
      where,
      order: { fiscalYear: 'DESC', createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOneBudget(id: string): Promise<Budget> {
    const budget = await this.budgetRepo.findOne({ where: { id } });
    if (!budget) throw new NotFoundException(`预算记录 #${id} 不存在`);
    return budget;
  }

  async updateBudget(id: string, dto: UpdateBudgetDto): Promise<Budget> {
    const budget = await this.findOneBudget(id);

    // 计算剩余金额
    if (dto.approvedAmount !== undefined) {
      budget.remainingAmount = Number(dto.approvedAmount) - Number(budget.actualSpent);
    }

    Object.assign(budget, dto);
    return this.budgetRepo.save(budget);
  }

  async removeBudget(id: string): Promise<void> {
    const budget = await this.findOneBudget(id);
    if (budget.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的预算才能删除');
    }
    await this.budgetRepo.remove(budget);
  }

  async submitBudget(id: string, dto: SubmitBudgetDto): Promise<Budget> {
    const budget = await this.findOneBudget(id);
    if (budget.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的预算才能提交审批');
    }
    budget.status = BudgetStatus.PENDING_APPROVAL;
    budget.submissionDate = new Date();
    if (dto.remark) budget.remark = dto.remark;
    return this.budgetRepo.save(budget);
  }

  async approveBudget(id: string, dto: ApproveBudgetDto, approverId: string): Promise<Budget> {
    const budget = await this.findOneBudget(id);
    if (budget.status !== BudgetStatus.PENDING_APPROVAL) {
      throw new BadRequestException('只有待审批状态的预算才能批准');
    }
    budget.status = BudgetStatus.APPROVED;
    budget.approvedBy = approverId;
    budget.approvalDate = new Date();
    budget.approvalComment = dto.approvalComment;
    budget.allocatedAmount = budget.approvedAmount;
    budget.remainingAmount = budget.approvedAmount;
    return this.budgetRepo.save(budget);
  }

  async rejectBudget(id: string, comment: string, approverId: string): Promise<Budget> {
    const budget = await this.findOneBudget(id);
    if (budget.status !== BudgetStatus.PENDING_APPROVAL) {
      throw new BadRequestException('只有待审批状态的预算才能拒绝');
    }
    budget.status = BudgetStatus.REJECTED;
    budget.approvedBy = approverId;
    budget.approvalDate = new Date();
    budget.approvalComment = comment;
    return this.budgetRepo.save(budget);
  }

  // ==================== Expense CRUD ====================

  async createExpense(dto: CreateExpenseDto, userId: string): Promise<BudgetExpense> {
    const budget = await this.findOneBudget(dto.budgetId);

    if (budget.status === BudgetStatus.DRAFT || budget.status === BudgetStatus.REJECTED) {
      throw new BadRequestException('预算尚未批准，不能支出');
    }

    const expense = this.expenseRepo.create({
      ...dto,
      expenseDate: new Date(dto.expenseDate),
      createdBy: userId,
      status: ExpenseStatus.PENDING,
    } as BudgetExpense);

    return this.expenseRepo.save(expense);
  }

  async findAllExpenses(query: QueryExpenseDto): Promise<{ data: BudgetExpense[]; total: number }> {
    const where: FindOptionsWhere<BudgetExpense> = {};

    if (query.budgetId) where.budgetId = query.budgetId;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;

    const [data, total] = await this.expenseRepo.findAndCount({
      where,
      order: { expenseDate: 'DESC', createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOneExpense(id: string): Promise<BudgetExpense> {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException(`支出记录 #${id} 不存在`);
    return expense;
  }

  async updateExpense(id: string, dto: UpdateExpenseDto): Promise<BudgetExpense> {
    const expense = await this.findOneExpense(id);
    if (expense.status === ExpenseStatus.PAID) {
      throw new BadRequestException('已付款的支出不能修改');
    }
    Object.assign(expense, dto);
    return this.expenseRepo.save(expense);
  }

  async removeExpense(id: string): Promise<void> {
    const expense = await this.findOneExpense(id);
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('只有待审批的支出才能删除');
    }
    await this.expenseRepo.remove(expense);
  }

  async approveExpense(id: string, dto: ApproveExpenseDto, approverId: string): Promise<BudgetExpense> {
    const expense = await this.findOneExpense(id);
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('只有待审批的支出才能批准');
    }

    // 更新支出状态
    expense.status = ExpenseStatus.APPROVED;
    expense.approvedBy = approverId;
    expense.approvedAt = new Date();
    await this.expenseRepo.save(expense);

    // 更新预算实际支出
    const budget = await this.findOneBudget(expense.budgetId);
    budget.actualSpent = Number(budget.actualSpent) + Number(expense.amount);
    budget.remainingAmount = Number(budget.approvedAmount) - Number(budget.actualSpent);

    // 检查超支预警
    const threshold = Number(budget.overspendThreshold || 90);
    const utilizationRate = (Number(budget.actualSpent) / Number(budget.approvedAmount)) * 100;
    budget.overspendWarning = utilizationRate >= threshold;

    // 如果实际支出超过批准金额，标记为调整
    if (Number(budget.actualSpent) > Number(budget.approvedAmount)) {
      budget.status = BudgetStatus.ADJUSTED;
    } else {
      budget.status = BudgetStatus.IN_PROGRESS;
    }

    await this.budgetRepo.save(budget);
    return expense;
  }

  async payExpense(id: string): Promise<BudgetExpense> {
    const expense = await this.findOneExpense(id);
    if (expense.status !== ExpenseStatus.APPROVED) {
      throw new BadRequestException('只有已批准的支出才能标记为已付款');
    }
    expense.status = ExpenseStatus.PAID;
    return this.expenseRepo.save(expense);
  }

  async rejectExpense(id: string, comment: string): Promise<BudgetExpense> {
    const expense = await this.findOneExpense(id);
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('只有待审批的支出才能拒绝');
    }
    expense.status = ExpenseStatus.REJECTED;
    if (comment) expense.remark = comment;
    return this.expenseRepo.save(expense);
  }

  // ==================== Adjustment CRUD ====================

  async createAdjustment(dto: CreateAdjustmentDto, userId: string): Promise<BudgetAdjustment> {
    const budget = await this.findOneBudget(dto.budgetId);

    const adjustment = this.adjustmentRepo.create({
      ...dto,
      createdBy: userId,
      status: BudgetStatus.PENDING_APPROVAL,
    } as BudgetAdjustment);

    return this.adjustmentRepo.save(adjustment);
  }

  async findAllAdjustments(query: QueryAdjustmentDto): Promise<{ data: BudgetAdjustment[]; total: number }> {
    const where: FindOptionsWhere<BudgetAdjustment> = {};

    if (query.budgetId) where.budgetId = query.budgetId;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;
    if (query.status) where.status = query.status;

    const [data, total] = await this.adjustmentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async approveAdjustment(id: string, dto: ApproveAdjustmentDto, approverId: string): Promise<BudgetAdjustment> {
    const adjustment = await this.adjustmentRepo.findOne({ where: { id } });
    if (!adjustment) throw new NotFoundException(`调整记录 #${id} 不存在`);

    if (adjustment.status !== BudgetStatus.PENDING_APPROVAL) {
      throw new BadRequestException('只有待审批的调整才能批准');
    }

    adjustment.status = BudgetStatus.APPROVED;
    adjustment.approvedBy = approverId;
    adjustment.approvalDate = new Date();
    adjustment.approvalComment = dto.approvalComment;

    // 执行调整
    const budget = await this.findOneBudget(adjustment.budgetId);

    if (adjustment.adjustType === BudgetAdjustType.ADD) {
      budget.approvedAmount = Number(budget.approvedAmount) + Number(adjustment.adjustAmount);
    } else if (adjustment.adjustType === BudgetAdjustType.REDUCE) {
      budget.approvedAmount = Number(budget.approvedAmount) - Number(adjustment.adjustAmount);
    } else if (adjustment.adjustType === BudgetAdjustType.TRANSFER) {
      // 调拨处理，从当前预算削减
      budget.approvedAmount = Number(budget.approvedAmount) - Number(adjustment.adjustAmount);
    }

    budget.remainingAmount = Number(budget.approvedAmount) - Number(budget.actualSpent);

    await this.adjustmentRepo.save(adjustment);
    await this.budgetRepo.save(budget);

    return adjustment;
  }

  // ==================== Statistics ====================

  async getStats(fiscalYear: number): Promise<BudgetStatsDto> {
    const budgets = await this.budgetRepo.find({ where: { fiscalYear } });

    const totalApproved = budgets.reduce((sum, b) => sum + Number(b.approvedAmount), 0);
    const totalAllocated = budgets.reduce((sum, b) => sum + Number(b.allocatedAmount), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.actualSpent), 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + Number(b.remainingAmount), 0);
    const overspendCount = budgets.filter(b => Number(b.actualSpent) > Number(b.approvedAmount)).length;

    // 按类别统计
    const byCategory: Record<string, { approved: number; spent: number; remaining: number; utilizationRate: string }> = {};
    const categoryMap = new Map(budgets.map(b => [b.category, b]));

    for (const [category, budget] of categoryMap) {
      const approved = Number(budget.approvedAmount);
      const spent = Number(budget.actualSpent);
      const remaining = Number(budget.remainingAmount);
      const utilizationRate = approved > 0 ? ((spent / approved) * 100).toFixed(2) + '%' : '0%';
      byCategory[category] = { approved, spent, remaining, utilizationRate };
    }

    return {
      fiscalYear,
      totalApproved,
      totalAllocated,
      totalSpent,
      totalRemaining,
      utilizationRate: totalApproved > 0 ? ((totalSpent / totalApproved) * 100).toFixed(2) + '%' : '0%',
      overspendCount,
      byCategory,
    };
  }

  async getComparison(fiscalYear: number): Promise<BudgetComparisonDto[]> {
    const budgets = await this.budgetRepo.find({ where: { fiscalYear } });

    return budgets.map(budget => {
      const approved = Number(budget.approvedAmount);
      const actual = Number(budget.actualSpent);
      const variance = actual - approved;
      const variancePct = approved > 0 ? ((variance / approved) * 100).toFixed(2) + '%' : '0%';

      return {
        fiscalYear,
        category: budget.category,
        budgetName: budget.name,
        approvedAmount: approved,
        actualSpent: actual,
        variance,
        variancePct,
        isOverspend: variance > 0,
      };
    });
  }

  async getMonthlyTrend(fiscalYear: number): Promise<MonthlyTrendDto[]> {
    const expenses = await this.expenseRepo.find({
      where: {
        fiscalYear,
        status: ExpenseStatus.PAID,
      },
      order: { expenseDate: 'ASC' },
    });

    // 按月分组
    const monthlyData: Record<string, Record<string, number>> = {};

    for (const expense of expenses) {
      const date = new Date(expense.expenseDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[month]) monthlyData[month] = {};
      if (!monthlyData[month][expense.category]) monthlyData[month][expense.category] = 0;
      monthlyData[month][expense.category] += Number(expense.amount);
    }

    const result: MonthlyTrendDto[] = [];
    for (const [month, categories] of Object.entries(monthlyData)) {
      for (const [category, amount] of Object.entries(categories)) {
        result.push({
          month,
          category,
          planned: 0, // 计划数需要从预算中计算
          actual: amount,
          variance: -amount,
        });
      }
    }

    return result;
  }

  async getDepartmentSummary(fiscalYear: number): Promise<Record<string, any>[]> {
    const budgets = await this.budgetRepo.find({
      where: { fiscalYear },
      order: { departmentName: 'ASC' },
    });

    const deptMap = new Map<string, any>();

    for (const budget of budgets) {
      const key = budget.departmentId || 'unknown';
      if (!deptMap.has(key)) {
        deptMap.set(key, {
          departmentId: budget.departmentId,
          departmentName: budget.departmentName || '未分配部门',
          totalApproved: 0,
          totalSpent: 0,
          totalRemaining: 0,
          budgetCount: 0,
        });
      }

      const dept = deptMap.get(key);
      dept.totalApproved += Number(budget.approvedAmount);
      dept.totalSpent += Number(budget.actualSpent);
      dept.totalRemaining += Number(budget.remainingAmount);
      dept.budgetCount++;
    }

    return Array.from(deptMap.values());
  }

  // ==================== F-NEW-004: Annual Budget ====================
  // 对应 SPEC-COMPLETE.md 第3619行，年度预算编制与执行追踪

  async createAnnualBudget(dto: CreateAnnualBudgetDto, userId: string): Promise<AnnualBudget> {
    const existing = await this.annualBudgetRepo.findOne({ where: { fiscalYear: dto.fiscalYear } });
    if (existing) {
      throw new BadRequestException(`财政年度 ${dto.fiscalYear} 的年度预算已存在`);
    }

    // 初始化8大科目（AC-01）
    const categoryBreakdown: AnnualBudget['categoryBreakdown'] = {};
    for (const cat of Object.values(FiscalBudgetCategory)) {
      categoryBreakdown[cat] = {
        allocated: 0,
        spent: 0,
        remaining: 0,
        executionRate: '0.00%',
        monthlyForecast: 0,
        variance: 0,
        status: BudgetExecutionStatus.ON_TRACK,
      };
    }

    const annual = this.annualBudgetRepo.create({
      fiscalYear: dto.fiscalYear,
      categoryBreakdown,
      totalAllocated: 0,
      totalSpent: 0,
      totalRemaining: 0,
      adjustments: [],
      status: BudgetStatus.DRAFT,
      createdBy: userId,
    } as AnnualBudget);

    return this.annualBudgetRepo.save(annual);
  }

  async findAllAnnualBudgets(fiscalYear?: number): Promise<AnnualBudget[]> {
    const where: any = {};
    if (fiscalYear) where.fiscalYear = fiscalYear;
    return this.annualBudgetRepo.find({ where, order: { fiscalYear: 'DESC' } });
  }

  async findOneAnnualBudget(fiscalYear: number): Promise<AnnualBudget> {
    const annual = await this.annualBudgetRepo.findOne({ where: { fiscalYear } });
    if (!annual) throw new NotFoundException(`年度预算 ${fiscalYear} 不存在`);
    return annual;
  }

  async approveAnnualBudget(fiscalYear: number, approverId: string): Promise<AnnualBudget> {
    const annual = await this.findOneAnnualBudget(fiscalYear);
    if (annual.status !== BudgetStatus.PENDING_APPROVAL) {
      throw new BadRequestException('只有待审批状态的年度预算才能批准');
    }
    annual.status = BudgetStatus.APPROVED;
    annual.approvedBy = approverId;
    annual.approvalDate = new Date();
    return this.annualBudgetRepo.save(annual);
  }

  // ==================== F-NEW-004: Budget Allocation (Dept × Category) ====================
  // 对应 AC-02：多部门预算分配

  async createAllocation(dto: CreateBudgetAllocationDto, userId: string): Promise<BudgetAllocation> {
    const annual = await this.findOneAnnualBudget(dto.fiscalYear);
    if (annual.status === BudgetStatus.DRAFT) {
      annual.status = BudgetStatus.PENDING_APPROVAL;
      await this.annualBudgetRepo.save(annual);
    }

    const allocation = this.allocationRepo.create({
      ...dto,
      createdBy: userId,
      remainingAmount: dto.allocatedAmount,
      actualSpent: 0,
      committedAmount: 0,
      status: BudgetStatus.DRAFT,
    } as BudgetAllocation);

    const saved = await this.allocationRepo.save(allocation);
    await this.rebuildAnnualBreakdown(dto.fiscalYear);
    return saved;
  }

  async findAllAllocations(query: QueryBudgetAllocationDto): Promise<{ data: BudgetAllocation[]; total: number }> {
    const where: any = {};
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;
    if (query.category) where.category = query.category;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.status) where.status = query.status;

    const [data, total] = await this.allocationRepo.findAndCount({
      where,
      order: { fiscalYear: 'DESC', category: 'ASC' },
    });
    return { data, total };
  }

  async updateAllocation(id: string, dto: UpdateBudgetAllocationDto): Promise<BudgetAllocation> {
    const allocation = await this.allocationRepo.findOne({ where: { id } });
    if (!allocation) throw new NotFoundException(`预算分配 #${id} 不存在`);

    if (dto.allocatedAmount !== undefined) {
      allocation.allocatedAmount = dto.allocatedAmount;
      allocation.remainingAmount = Number(dto.allocatedAmount) - Number(allocation.actualSpent);
    }
    Object.assign(allocation, dto);
    const saved = await this.allocationRepo.save(allocation);
    await this.rebuildAnnualBreakdown(allocation.fiscalYear);
    return saved;
  }

  async approveAllocation(id: string, approverId: string): Promise<BudgetAllocation> {
    const allocation = await this.allocationRepo.findOne({ where: { id } });
    if (!allocation) throw new NotFoundException(`预算分配 #${id} 不存在`);
    if (allocation.status !== BudgetStatus.PENDING_APPROVAL) {
      throw new BadRequestException('只有待审批状态的分配才能批准');
    }
    allocation.status = BudgetStatus.APPROVED;
    const saved = await this.allocationRepo.save(allocation);
    await this.rebuildAnnualBreakdown(allocation.fiscalYear);
    return saved;
  }

  // ==================== F-NEW-004: Expense × FiscalBudgetCategory ====================
  // 支出记录使用8大科目（而非原有6大类）

  async recordFiscalExpense(dto: RecordFiscalExpenseDto, userId: string): Promise<BudgetExpense> {
    // 找到对应 fiscalYear × category 的分配记录
    const allocation = await this.allocationRepo.findOne({
      where: {
        fiscalYear: dto.fiscalYear,
        category: dto.fiscalCategory,
        departmentId: dto.departmentId || undefined,
      },
    });

    // 支出记录仍使用 BudgetExpense，但 fiscalCategory 记录到 remark
    const expense = this.expenseRepo.create({
      budgetId: allocation?.id || '00000000-0000-0000-0000-000000000000',
      fiscalYear: dto.fiscalYear,
      expenseDate: new Date(dto.expenseDate),
      description: dto.description,
      category: dto.expenseCategory || ExpenseCategory.OTHER,
      amount: dto.amount,
      invoiceNo: dto.invoiceNo,
      vendorName: dto.vendorName,
      createdBy: userId,
      status: ExpenseStatus.PENDING,
      remark: `fiscalCategory:${dto.fiscalCategory}`,
    } as BudgetExpense);

    const saved = await this.expenseRepo.save(expense);

    // 更新分配实际支出（AC-03 执行率）
    if (allocation) {
      allocation.actualSpent = Number(allocation.actualSpent) + Number(dto.amount);
      allocation.remainingAmount = Number(allocation.allocatedAmount) - Number(allocation.actualSpent);
      allocation.warningTriggered = this.checkWarning(allocation);
      await this.allocationRepo.save(allocation);
      await this.rebuildAnnualBreakdown(dto.fiscalYear);
    }

    return saved;
  }

  private checkWarning(allocation: BudgetAllocation): boolean {
    const rate = Number(allocation.allocatedAmount) > 0
      ? (Number(allocation.actualSpent) / Number(allocation.allocatedAmount)) * 100
      : 0;
    return rate >= Number(allocation.overspendThreshold);
  }

  // ==================== F-NEW-004: Budget Adjustment (科目间调拨) ====================
  // 对应 AC-05：ACTIVITY科目省HK$50,000调至IT科目

  async interCategoryTransfer(
    fiscalYear: number,
    fromCategory: FiscalBudgetCategory,
    toCategory: FiscalBudgetCategory,
    amount: number,
    reason: string,
    approverId: string,
  ): Promise<AnnualBudget> {
    const annual = await this.findOneAnnualBudget(fiscalYear);
    if (Number(annual.categoryBreakdown[fromCategory]?.allocated || 0) < amount) {
      throw new BadRequestException(`${fromCategory} 科目余额不足`);
    }

    // 更新来源科目
    const from = annual.categoryBreakdown[fromCategory];
    from.allocated -= amount;
    from.remaining -= amount;

    // 更新目标科目
    const to = annual.categoryBreakdown[toCategory];
    to.allocated += amount;
    to.remaining += amount;

    // 记录调整（AC-05）
    annual.adjustments.push({
      date: new Date().toISOString().split('T')[0],
      fromCategory,
      toCategory,
      amount,
      approvedBy: approverId,
    });

    annual.status = BudgetStatus.ADJUSTED;
    await this.annualBudgetRepo.save(annual);

    // 同时更新对应的 allocation 记录
    await this.allocationRepo.update(
      { fiscalYear, category: fromCategory },
      {
        allocatedAmount: () => `allocated_amount - ${amount}`,
        remainingAmount: () => `remaining_amount - ${amount}`,
      },
    );
    await this.allocationRepo.update(
      { fiscalYear, category: toCategory },
      {
        allocatedAmount: () => `allocated_amount + ${amount}`,
        remainingAmount: () => `remaining_amount + ${amount}`,
      },
    );

    return annual;
  }

  // ==================== F-NEW-004: Execution Rate & Warning ====================
  // 对应 AC-03/AC-04

  async getExecutionReport(fiscalYear: number): Promise<AnnualBudget> {
    const annual = await this.findOneAnnualBudget(fiscalYear);
    await this.rebuildAnnualBreakdown(fiscalYear);
    return this.annualBudgetRepo.findOne({ where: { fiscalYear } });
  }

  async checkOverBudgetWarnings(fiscalYear: number): Promise<Array<{ category: string; executionRate: string; status: string }>> {
    const annual = await this.findOneAnnualBudget(fiscalYear);
    const warnings: Array<{ category: string; executionRate: string; status: string }> = [];

    for (const [cat, data] of Object.entries(annual.categoryBreakdown)) {
      if (data.status === BudgetExecutionStatus.WARNING || data.status === BudgetExecutionStatus.CRITICAL) {
        warnings.push({ category: cat, executionRate: data.executionRate, status: data.status });
      }
    }
    return warnings;
  }

  private async rebuildAnnualBreakdown(fiscalYear: number): Promise<void> {
    const annual = await this.annualBudgetRepo.findOne({ where: { fiscalYear } });
    if (!annual) return;

    const allocations = await this.allocationRepo.find({ where: { fiscalYear } });

    const breakdown: AnnualBudget['categoryBreakdown'] = {};
    let totalAllocated = 0;
    let totalSpent = 0;

    for (const cat of Object.values(FiscalBudgetCategory)) {
      const cats = allocations.filter(a => a.category === cat);
      const allocated = cats.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
      const spent = cats.reduce((sum, a) => sum + Number(a.actualSpent), 0);
      const remaining = allocated - spent;
      const rate = allocated > 0 ? (spent / allocated) * 100 : 0;

      let status: BudgetExecutionStatus;
      if (rate >= 100) status = BudgetExecutionStatus.CRITICAL;
      else if (rate >= 80) status = BudgetExecutionStatus.WARNING;
      else status = BudgetExecutionStatus.ON_TRACK;

      breakdown[cat] = {
        allocated,
        spent,
        remaining,
        executionRate: rate.toFixed(2) + '%',
        monthlyForecast: allocated / 12,
        variance: spent - allocated,
        status,
      };

      totalAllocated += allocated;
      totalSpent += spent;
    }

    annual.categoryBreakdown = breakdown;
    annual.totalAllocated = totalAllocated;
    annual.totalSpent = totalSpent;
    annual.totalRemaining = totalAllocated - totalSpent;
    await this.annualBudgetRepo.save(annual);
  }
}
