import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum BudgetCategory {
  // 人员经费
  PERSONNEL = 'personnel', // 人员经费
  PERSONNEL_SALARY = 'personnel_salary', // 教职员薪金
  PERSONNEL_ALLOWANCE = 'personnel_allowance', // 教职员津贴
  PERSONNEL_PROVIDENT_FUND = 'personnel_provident_fund', // 强积金

  // 运作经费
  OPERATION = 'operation', // 运作经费
  OPERATION_UTILITIES = 'operation_utilities', // 水、电、煤气
  OPERATION_INSURANCE = 'operation_insurance', // 保险
  OPERATION_MAINTENANCE = 'operation_maintenance', // 维修保养
  OPERATION_CONSERVANCY = 'operation_conservancy', // 清洁
  OPERATION_SECURITY = 'operation_security', // 保安
  OPERATION_ADMIN = 'operation_admin', // 行政办公

  // 教学经费
  TEACHING = 'teaching', // 教学经费
  TEACHING_TEXTBOOKS = 'teaching_textbooks', // 课本
  TEACHING_EQUIPMENT = 'teaching_equipment', // 教学器材
  TEACHING_IT = 'teaching_it', // 资讯科技
  TEACHING_EXTRACURRICULAR = 'teaching_extracurricular', // 课外活动

  // 设施经费
  FACILITY = 'facility', // 设施经费
  FACILITY_RENTAL = 'facility_rental', // 场地租金
  FACILITY_TRANSPORT = 'facility_transport', // 校车
  FACILITY_FOOD = 'facility_food', // 膳食
  FACILITY_MEDICAL = 'facility_medical', // 医疗

  // 发展经费
  DEVELOPMENT = 'development', // 发展经费
  DEVELOPMENT_TRAINING = 'development_training', // 教职员培训
  DEVELOPMENT_REFORM = 'development_reform', // 教学改革

  // 其他经费
  OTHER = 'other', // 其他经费
  OTHER_SUBSIDY = 'other_subsidy', // 学生资助/奖助学金
  OTHER_LEGAL = 'other_legal', // 法律/审计
  OTHER_RESERVE = 'other_reserve', // 储备金
}

export enum BudgetStatus {
  DRAFT = 'draft', // 草稿
  PENDING_APPROVAL = 'pending_approval', // 待审批
  APPROVED = 'approved', // 已批准
  IN_PROGRESS = 'in_progress', // 执行中
  COMPLETED = 'completed', // 已完成
  ADJUSTED = 'adjusted', // 已调整
  REJECTED = 'rejected', // 已拒绝
}

export enum BudgetAdjustType {
  ADD = 'add', // 追加
  REDUCE = 'reduce', // 削减
  TRANSFER = 'transfer', // 调拨
}

export enum ExpenseCategory {
  PERSONNEL = 'personnel', // 人员支出
  OPERATION = 'operation', // 运作支出
  TEACHING = 'teaching', // 教学支出
  FACILITY = 'facility', // 设施支出
  DEVELOPMENT = 'development', // 发展支出
  OTHER = 'other', // 其他支出
}

export enum ExpenseStatus {
  PENDING = 'pending', // 待审批
  APPROVED = 'approved', // 已批准
  REJECTED = 'rejected', // 已拒绝
  PAID = 'paid', // 已付款
  CANCELLED = 'cancelled', // 已取消
}

// ==================== F-NEW-004: 8大预算科目 ====================
// 对应 SPEC-COMPLETE.md 第3619行，年度预算编制与执行追踪

export enum FiscalBudgetCategory {
  STAFF = 'STAFF', // 人事费用：教职员薪金、津贴
  FACILITY = 'FACILITY', // 设施维护：冷气、维修、水电
  ACADEMIC = 'ACADEMIC', // 教务支出：试卷印刷、图书采购
  IT = 'IT', // 资讯科技：软件许可、设备更新
  ACTIVITY = 'ACTIVITY', // 活动费用：课外活动、旅行
  SCHOLARSHIP = 'SCHOLARSHIP', // 奖助学金：奖学金、助学金
  ADMIN = 'ADMIN', // 行政费用：文具、邮费、印刷
  CONTINGENCY = 'CONTINGENCY', // 应急储备：未预见支出
}

export enum BudgetExecutionStatus {
  ON_TRACK = 'on_track', // 执行正常（<80%）
  WARNING = 'warning', // 黄色预警（80-99%）
  CRITICAL = 'critical', // 红色告警（>=100%）
}

@Index(['fiscalYear'])
@Index(['status'])
@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fiscal_year', type: 'int' })
  fiscalYear: number;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string;

  @Column({ name: 'department_name', length: 100, nullable: true })
  departmentName: string;

  @Column({
    type: 'enum',
    enum: BudgetCategory,
    default: BudgetCategory.OTHER,
  })
  category: BudgetCategory;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'approved_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  approvedAmount: number;

  @Column({
    name: 'allocated_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  allocatedAmount: number;

  @Column({
    name: 'committed_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  committedAmount: number;

  @Column({
    name: 'actual_spent',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  actualSpent: number;

  @Column({
    name: 'remaining_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  remainingAmount: number;

  @Column({
    type: 'enum',
    enum: BudgetStatus,
    default: BudgetStatus.DRAFT,
  })
  status: BudgetStatus;

  @Column({ name: 'submission_date', type: 'date', nullable: true })
  submissionDate: Date;

  @Column({ name: 'approval_date', type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ name: 'approval_comment', type: 'text', nullable: true })
  approvalComment: string;

  @Column({ type: 'boolean', default: false, name: 'overspend_warning' })
  overspendWarning: boolean;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'overspend_threshold',
  })
  overspendThreshold: number;

  @Column({ type: 'text', nullable: true, name: 'remark' })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
}

@Entity('budget_expenses')
export class BudgetExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'budget_id', type: 'uuid' })
  budgetId: string;

  @ManyToOne(() => Budget)
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'fiscal_year', type: 'int' })
  fiscalYear: number;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: Date;

  @Column({ length: 200 })
  description: string;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
  })
  category: ExpenseCategory;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'invoice_no', length: 100, nullable: true })
  invoiceNo: string;

  @Column({ name: 'vendor_name', length: 200, nullable: true })
  vendorName: string;

  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.PENDING,
  })
  status: ExpenseStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'receipt_url', type: 'text', nullable: true })
  receiptUrl: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}

@Entity('budget_adjustments')
export class BudgetAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'budget_id', type: 'uuid' })
  budgetId: string;

  @ManyToOne(() => Budget)
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'fiscal_year', type: 'int' })
  fiscalYear: number;

  @Column({
    type: 'enum',
    enum: BudgetAdjustType,
  })
  adjustType: BudgetAdjustType;

  @Column({ name: 'adjust_amount', type: 'decimal', precision: 14, scale: 2 })
  adjustAmount: number;

  @Column({ name: 'reason', type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: BudgetStatus,
    default: BudgetStatus.PENDING_APPROVAL,
  })
  status: BudgetStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ name: 'approval_date', type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ name: 'approval_comment', type: 'text', nullable: true })
  approvalComment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}

// ==================== F-NEW-004: 年度预算框架 ====================
/**
 * 年度预算框架（fiscal year level）
 * 对应 SPEC-COMPLETE.md AC-01：显示8大预算科目模板
 */
@Index(['fiscalYear'])
@Index(['status'])
@Entity('annual_budgets')
export class AnnualBudget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 财政年度，格式 2026 表示 2026-2027学年 */
  @Column({ name: 'fiscal_year', type: 'int', unique: true })
  fiscalYear: number;

  /** 总批准预算 */
  @Column({
    name: 'total_allocated',
    type: 'decimal',
    precision: 16,
    scale: 2,
    default: 0,
  })
  totalAllocated: number;

  /** 总已支出 */
  @Column({
    name: 'total_spent',
    type: 'decimal',
    precision: 16,
    scale: 2,
    default: 0,
  })
  totalSpent: number;

  /** 总剩余 */
  @Column({
    name: 'total_remaining',
    type: 'decimal',
    precision: 16,
    scale: 2,
    default: 0,
  })
  totalRemaining: number;

  /**
   * 各科目预算快照（按 FiscalBudgetCategory 分组）
   */
  @Column({ type: 'jsonb', default: {} })
  categoryBreakdown: Record<
    string,
    {
      allocated: number;
      spent: number;
      remaining: number;
      executionRate: string;
      monthlyForecast: number;
      variance: number;
      status: BudgetExecutionStatus;
    }
  >;

  /** 预算调整记录（AC-05） */
  @Column({ type: 'jsonb', default: [] })
  adjustments: Array<{
    date: string;
    fromCategory: string;
    toCategory: string;
    amount: number;
    approvedBy: string;
  }>;

  @Column({
    type: 'enum',
    enum: BudgetStatus,
    default: BudgetStatus.DRAFT,
  })
  status: BudgetStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ name: 'approval_date', type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ type: 'text', nullable: true, name: 'remark' })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * 科目预算分配（部门 × 科目）
 * 对应 AC-02：各科目分配至多部门
 */
@Index(['fiscalYear', 'category'])
@Entity('budget_allocations')
export class BudgetAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'annual_budget_id', type: 'uuid' })
  annualBudgetId: string;

  @ManyToOne(() => AnnualBudget)
  @JoinColumn({ name: 'annual_budget_id' })
  annualBudget: AnnualBudget;

  @Column({ name: 'fiscal_year', type: 'int' })
  fiscalYear: number;

  @Column({
    type: 'enum',
    enum: FiscalBudgetCategory,
  })
  category: FiscalBudgetCategory;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string;

  @Column({ name: 'department_name', length: 100, nullable: true })
  departmentName: string;

  @Column({
    name: 'allocated_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  allocatedAmount: number;

  @Column({
    name: 'committed_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  committedAmount: number;

  @Column({
    name: 'actual_spent',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  actualSpent: number;

  @Column({
    name: 'remaining_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  remainingAmount: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 80,
    name: 'overspend_threshold',
  })
  overspendThreshold: number;

  @Column({ type: 'boolean', default: false, name: 'warning_triggered' })
  warningTriggered: boolean;

  @Column({
    type: 'enum',
    enum: BudgetStatus,
    default: BudgetStatus.DRAFT,
  })
  status: BudgetStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}
