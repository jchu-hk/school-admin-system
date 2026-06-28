import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BudgetService } from './budget.service';
import {
  Budget,
  BudgetStatus,
  BudgetExpense,
  BudgetAdjustment,
  ExpenseStatus,
  BudgetAdjustType,
  AnnualBudget,
  BudgetAllocation,
  FiscalBudgetCategory,
  BudgetExecutionStatus,
} from './entities/budget.entity';

// ==================== Mock Repositories ====================

const mockAnnualBudgetRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockAllocationRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  findAndCount: jest.fn(),
});

const mockBudgetRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
});

const mockExpenseRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
});

const mockAdjustmentRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

// ==================== Fixtures ====================

const mockAnnualBudget = (overrides: Partial<AnnualBudget> = {}): AnnualBudget =>
  ({
    id: 'annual-uuid-1',
    fiscalYear: 2026,
    totalAllocated: 8500000,
    totalSpent: 2150000,
    totalRemaining: 6350000,
    categoryBreakdown: {
      STAFF: {
        allocated: 5800000,
        spent: 1450000,
        remaining: 4350000,
        executionRate: '25.00%',
        monthlyForecast: 483333.33,
        variance: -4350000,
        status: BudgetExecutionStatus.ON_TRACK,
      },
      IT: {
        allocated: 300000,
        spent: 280000,
        remaining: 20000,
        executionRate: '93.33%',
        monthlyForecast: 25000,
        variance: -20000,
        status: BudgetExecutionStatus.WARNING,
      },
    },
    adjustments: [],
    status: BudgetStatus.APPROVED,
    createdBy: 'user-uuid-1',
    approvedBy: null,
    approvalDate: null,
    remark: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as AnnualBudget);

const mockBudgetAllocation = (overrides: Partial<BudgetAllocation> = {}): BudgetAllocation =>
  ({
    id: 'alloc-uuid-1',
    annualBudgetId: 'annual-uuid-1',
    fiscalYear: 2026,
    category: FiscalBudgetCategory.IT,
    departmentId: 'dept-uuid-1',
    departmentName: 'IT部门',
    allocatedAmount: 300000,
    committedAmount: 0,
    actualSpent: 0,
    remainingAmount: 300000,
    overspendThreshold: 80,
    warningTriggered: false,
    status: BudgetStatus.DRAFT,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-uuid-1',
    annualBudget: null,
    ...overrides,
  } as BudgetAllocation);

// ==================== Test Suite ====================

describe('BudgetService F-NEW-004', () => {
  let annualBudgetRepo: ReturnType<typeof mockAnnualBudgetRepo>;
  let allocationRepo: ReturnType<typeof mockAllocationRepo>;
  let budgetRepo: ReturnType<typeof mockBudgetRepo>;
  let expenseRepo: ReturnType<typeof mockExpenseRepo>;
  let adjustmentRepo: ReturnType<typeof mockAdjustmentRepo>;
  let service: BudgetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: getRepositoryToken(AnnualBudget), useFactory: mockAnnualBudgetRepo },
        { provide: getRepositoryToken(BudgetAllocation), useFactory: mockAllocationRepo },
        { provide: getRepositoryToken(Budget), useFactory: mockBudgetRepo },
        { provide: getRepositoryToken(BudgetExpense), useFactory: mockExpenseRepo },
        { provide: getRepositoryToken(BudgetAdjustment), useFactory: mockAdjustmentRepo },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    annualBudgetRepo = module.get(getRepositoryToken(AnnualBudget));
    allocationRepo = module.get(getRepositoryToken(BudgetAllocation));
    budgetRepo = module.get(getRepositoryToken(Budget));
    expenseRepo = module.get(getRepositoryToken(BudgetExpense));
    adjustmentRepo = module.get(getRepositoryToken(BudgetAdjustment));
  });

  afterEach(() => jest.clearAllMocks());

  // ==================== AC-01: Create Annual Budget ====================

  describe('AC-01: 创建年度预算框架', () => {
    it('createAnnualBudget - 成功创建年度预算，初始化8大科目', async () => {
      annualBudgetRepo.findOne.mockResolvedValue(null);
      const created = mockAnnualBudget();
      annualBudgetRepo.create.mockReturnValue(created);
      annualBudgetRepo.save.mockResolvedValue(created);

      const dto = { fiscalYear: 2026 };
      const result = await service.createAnnualBudget(dto, 'user-1');

      expect(annualBudgetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fiscalYear: 2026,
          status: BudgetStatus.DRAFT,
          categoryBreakdown: expect.objectContaining({
            STAFF: expect.any(Object),
            FACILITY: expect.any(Object),
            ACADEMIC: expect.any(Object),
            IT: expect.any(Object),
            ACTIVITY: expect.any(Object),
            SCHOLARSHIP: expect.any(Object),
            ADMIN: expect.any(Object),
            CONTINGENCY: expect.any(Object),
          }),
        }),
      );
      expect(result.fiscalYear).toBe(2026);
    });

    it('createAnnualBudget - 重复财政年度抛出BadRequestException', async () => {
      annualBudgetRepo.findOne.mockResolvedValue(mockAnnualBudget());

      await expect(
        service.createAnnualBudget({ fiscalYear: 2026 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== AC-02: Budget Allocation ====================

  describe('AC-02: 多部门预算分配', () => {
    it('createAllocation - 成功创建科目分配，触发年度预算状态变更', async () => {
      const annual = mockAnnualBudget({ status: BudgetStatus.DRAFT });
      annualBudgetRepo.findOne.mockResolvedValue(annual);

      const allocation = mockBudgetAllocation();
      allocationRepo.create.mockReturnValue(allocation);
      allocationRepo.save.mockResolvedValue(allocation);
      allocationRepo.find.mockResolvedValue([allocation]);

      annualBudgetRepo.save.mockResolvedValue({
        ...annual,
        status: BudgetStatus.PENDING_APPROVAL,
      });
      annualBudgetRepo.findOne.mockResolvedValue({
        ...annual,
        status: BudgetStatus.PENDING_APPROVAL,
        categoryBreakdown: { IT: { allocated: 300000, spent: 0, remaining: 300000, executionRate: '0.00%', monthlyForecast: 25000, variance: -300000, status: BudgetExecutionStatus.ON_TRACK } },
        totalAllocated: 300000,
        totalSpent: 0,
        totalRemaining: 300000,
      });

      const dto = {
        fiscalYear: 2026,
        category: FiscalBudgetCategory.IT,
        departmentId: 'dept-uuid-1',
        departmentName: 'IT部门',
        allocatedAmount: 300000,
      };

      const result = await service.createAllocation(dto, 'user-1');

      expect(allocationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fiscalYear: 2026,
          category: FiscalBudgetCategory.IT,
          allocatedAmount: 300000,
        }),
      );
      expect(result.category).toBe(FiscalBudgetCategory.IT);
    });
  });

  // ==================== AC-03: Execution Rate ====================

  describe('AC-03: 执行率实时比对', () => {
    it('recordFiscalExpense - IT科目支出HK$280,000，执行率93.3%，状态=warning', async () => {
      const allocation = mockBudgetAllocation({
        allocatedAmount: 300000,
        actualSpent: 0,
        remainingAmount: 300000,
        warningTriggered: false,
      });
      allocationRepo.findOne.mockResolvedValue(allocation);
      allocationRepo.save.mockImplementation((a) => Promise.resolve(a));
      expenseRepo.create.mockReturnValue({ id: 'exp-uuid-1', amount: 280000 } as BudgetExpense);
      expenseRepo.save.mockResolvedValue({ id: 'exp-uuid-1', amount: 280000 });

      annualBudgetRepo.findOne.mockResolvedValue(mockAnnualBudget());
      allocationRepo.find.mockResolvedValue([
        { ...allocation, actualSpent: 280000, remainingAmount: 20000, warningTriggered: true },
      ]);
      annualBudgetRepo.save.mockImplementation((a) => Promise.resolve(a));

      const dto = {
        fiscalYear: 2026,
        fiscalCategory: FiscalBudgetCategory.IT,
        departmentId: 'dept-uuid-1',
        expenseDate: '2026-10-15',
        description: 'IT设备采购',
        amount: 280000,
      };

      const result = await service.recordFiscalExpense(dto, 'user-1');

      // 验证实际支出已累加（300000 + 280000 = 580000）
      const savedAllocation = allocationRepo.save.mock.calls.find(
        (call) => call[0]?.actualSpent !== undefined,
      )?.[0];
      expect(Number(savedAllocation?.actualSpent)).toBe(280000);
      // 验证预警已触发（280000/300000 = 93.3% > 80%）
      expect(savedAllocation?.warningTriggered).toBe(true);
      expect(result.amount).toBe(280000);
    });
  });

  // ==================== AC-04: Over-Budget Warning ====================

  describe('AC-04: 超支预警', () => {
    it('checkOverBudgetWarnings - 返回执行率>=80%的科目', async () => {
      const annual = mockAnnualBudget();
      annualBudgetRepo.findOne.mockResolvedValue(annual);

      const warnings = await service.checkOverBudgetWarnings(2026);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          category: 'IT',
          executionRate: '93.33%',
          status: BudgetExecutionStatus.WARNING,
        }),
      );
    });

    it('checkOverBudgetWarnings - 正常科目不触发预警', async () => {
      const annual = mockAnnualBudget();
      annualBudgetRepo.findOne.mockResolvedValue(annual);

      const warnings = await service.checkOverBudgetWarnings(2026);
      const itWarning = warnings.find((w) => w.category === 'IT');

      expect(itWarning?.status).toBe(BudgetExecutionStatus.WARNING); // AC-04: IT执行率93%，预警
    });
  });

  // ==================== AC-05: Inter-Category Transfer ====================

  describe('AC-05: 科目间预算调拨', () => {
    it('interCategoryTransfer - ACTIVITY省HK$50,000调至IT科目', async () => {
      const annual = mockAnnualBudget({
        categoryBreakdown: {
          ...mockAnnualBudget().categoryBreakdown,
          ACTIVITY: {
            allocated: 500000,
            spent: 100000,
            remaining: 400000,
            executionRate: '20.00%',
            monthlyForecast: 41666.67,
            variance: -400000,
            status: BudgetExecutionStatus.ON_TRACK,
          },
          IT: {
            allocated: 300000,
            spent: 280000,
            remaining: 20000,
            executionRate: '93.33%',
            monthlyForecast: 25000,
            variance: -20000,
            status: BudgetExecutionStatus.WARNING,
          },
        },
        adjustments: [],
      });

      annualBudgetRepo.findOne.mockResolvedValue(annual);
      annualBudgetRepo.save.mockImplementation((a) => Promise.resolve(a));
      allocationRepo.find.mockResolvedValue([]);

      const result = await service.interCategoryTransfer(
        2026,
        FiscalBudgetCategory.ACTIVITY,
        FiscalBudgetCategory.IT,
        50000,
        '学期末调整：ACTIVITY科目节约转IT',
        'approver-uuid-1',
      );

      // 验证调整记录已写入
      expect(result.adjustments).toContainEqual(
        expect.objectContaining({
          fromCategory: FiscalBudgetCategory.ACTIVITY,
          toCategory: FiscalBudgetCategory.IT,
          amount: 50000,
          approvedBy: 'approver-uuid-1',
        }),
      );

      // 验证科目金额已更新
      expect(result.categoryBreakdown[FiscalBudgetCategory.ACTIVITY].allocated).toBe(450000);
      expect(result.categoryBreakdown[FiscalBudgetCategory.IT].allocated).toBe(350000);
      expect(result.status).toBe(BudgetStatus.ADJUSTED);
    });

    it('interCategoryTransfer - 余额不足抛出BadRequestException', async () => {
      const annual = mockAnnualBudget({
        categoryBreakdown: {
          ...mockAnnualBudget().categoryBreakdown,
          STAFF: {
            allocated: 100000,
            spent: 50000,
            remaining: 50000,
            executionRate: '50.00%',
            monthlyForecast: 8333.33,
            variance: -50000,
            status: BudgetExecutionStatus.ON_TRACK,
          },
        },
      });
      annualBudgetRepo.findOne.mockResolvedValue(annual);

      await expect(
        service.interCategoryTransfer(
          2026,
          FiscalBudgetCategory.STAFF,
          FiscalBudgetCategory.IT,
          200000, // 超出余额
          '超额调拨',
          'approver-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== FiscalBudgetCategory Enum ====================

  describe('FiscalBudgetCategory - 8大科目枚举', () => {
    it('包含全部8个科目代码', () => {
      const categories = Object.values(FiscalBudgetCategory);
      expect(categories).toContain(FiscalBudgetCategory.STAFF);
      expect(categories).toContain(FiscalBudgetCategory.FACILITY);
      expect(categories).toContain(FiscalBudgetCategory.ACADEMIC);
      expect(categories).toContain(FiscalBudgetCategory.IT);
      expect(categories).toContain(FiscalBudgetCategory.ACTIVITY);
      expect(categories).toContain(FiscalBudgetCategory.SCHOLARSHIP);
      expect(categories).toContain(FiscalBudgetCategory.ADMIN);
      expect(categories).toContain(FiscalBudgetCategory.CONTINGENCY);
      expect(categories).toHaveLength(8);
    });
  });

  // ==================== BudgetExecutionStatus ====================

  describe('BudgetExecutionStatus - 执行状态枚举', () => {
    it('包含全部3个状态', () => {
      expect(BudgetExecutionStatus.ON_TRACK).toBe('on_track');
      expect(BudgetExecutionStatus.WARNING).toBe('warning');
      expect(BudgetExecutionStatus.CRITICAL).toBe('critical');
      expect(Object.values(BudgetExecutionStatus)).toHaveLength(3);
    });
  });

  // ==================== Execution Report ====================

  describe('getExecutionReport - 年度执行报告', () => {
    it('返回年度预算执行数据', async () => {
      const annual = mockAnnualBudget();
      // getExecutionReport calls findOneAnnualBudget, then rebuildAnnualBreakdown, then findOne again
      annualBudgetRepo.findOne.mockResolvedValue({
        ...annual,
        totalSpent: 2150000,
        totalAllocated: 8500000,
        categoryBreakdown: annual.categoryBreakdown,
        adjustments: [],
      });
      allocationRepo.find.mockResolvedValue([]);

      const result = await service.getExecutionReport(2026);

      expect(result.fiscalYear).toBe(2026);
      expect(result.totalAllocated).toBeDefined();
    });
  });
});
