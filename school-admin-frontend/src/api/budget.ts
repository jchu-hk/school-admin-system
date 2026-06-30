// 预算管理API接口定义

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ==================== Budget ====================
export interface Budget {
  id: string;
  fiscalYear: number;
  departmentId?: string;
  departmentName?: string;
  category: string;
  name: string;
  description?: string;
  approvedAmount: number;
  allocatedAmount: number;
  committedAmount: number;
  actualSpent: number;
  remainingAmount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'completed' | 'adjusted' | 'rejected';
  submissionDate?: string;
  approvalDate?: string;
  approvedBy?: string;
  approvalComment?: string;
  overspendWarning: boolean;
  overspendThreshold: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface BudgetFormData {
  fiscalYear: number;
  departmentId?: string;
  departmentName?: string;
  category: string;
  name: string;
  description?: string;
  approvedAmount?: number;
  overspendThreshold?: number;
}

export interface BudgetQuery {
  fiscalYear?: number;
  departmentId?: string;
  category?: string;
  status?: string;
  keyword?: string;
}

// ==================== Budget Expense ====================
export interface BudgetExpense {
  id: string;
  budgetId: string;
  fiscalYear: number;
  expenseDate: string;
  description: string;
  category: 'personnel' | 'operation' | 'teaching' | 'facility' | 'development' | 'other';
  amount: number;
  invoiceNo?: string;
  vendorName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  receiptUrl?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  budgetId: string;
  fiscalYear: number;
  expenseDate: string;
  description: string;
  category: string;
  amount: number;
  invoiceNo?: string;
  vendorName?: string;
  receiptUrl?: string;
  remark?: string;
}

// ==================== Budget Adjustment ====================
export interface BudgetAdjustment {
  id: string;
  budgetId: string;
  fiscalYear: number;
  adjustType: 'add' | 'reduce' | 'transfer';
  adjustAmount: number;
  reason: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: string;
  approvalComment?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Statistics ====================
export interface BudgetStats {
  fiscalYear: number;
  totalApproved: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationRate: string;
  overspendCount: number;
  byCategory: Record<string, {
    approved: number;
    spent: number;
    remaining: number;
    utilizationRate: string;
  }>;
}

export interface BudgetComparison {
  fiscalYear: number;
  category: string;
  budgetName: string;
  approvedAmount: number;
  actualSpent: number;
  variance: number;
  variancePct: string;
  isOverspend: boolean;
}

// ==================== Category Labels ====================
export const BUDGET_CATEGORY_LABELS: Record<string, string> = {
  personnel: '人员经费',
  personnel_salary: '教职员薪金',
  personnel_allowance: '教职员津贴',
  personnel_provident_fund: '强积金',
  operation: '运作经费',
  operation_utilities: '水电煤气',
  operation_insurance: '保险',
  operation_maintenance: '维修保养',
  operation_conservancy: '清洁',
  operation_security: '保安',
  operation_admin: '行政办公',
  teaching: '教学经费',
  teaching_textbooks: '课本',
  teaching_equipment: '教学器材',
  teaching_it: '资讯科技',
  teaching_extracurricular: '课外活动',
  facility: '设施经费',
  facility_rental: '场地租金',
  facility_transport: '校车',
  facility_food: '膳食',
  facility_medical: '医疗',
  development: '发展经费',
  development_training: '教职员培训',
  development_reform: '教学改革',
  other: '其他经费',
  other_subsidy: '学生资助',
  other_legal: '法律/审计',
  other_reserve: '储备金',
};

export const BUDGET_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已批准',
  in_progress: '执行中',
  completed: '已完成',
  adjusted: '已调整',
  rejected: '已拒绝',
};

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  paid: '已付款',
  cancelled: '已取消',
};

// ==================== API Functions ====================

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json',
});

export const budgetApi = {
  // ========== Budget ==========
  create: async (data: BudgetFormData): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('创建预算失败');
    return response.json();
  },

  getList: async (query?: BudgetQuery): Promise<{ data: Budget[]; total: number }> => {
    const params = new URLSearchParams(query as any).toString();
    const response = await fetch(`${API_BASE_URL}/budgets?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取预算列表失败');
    return response.json();
  },

  getDetail: async (id: string): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取预算详情失败');
    return response.json();
  },

  update: async (id: string, data: Partial<BudgetFormData>): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('更新预算失败');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('删除预算失败');
  },

  submit: async (id: string, remark?: string): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remark }),
    });
    if (!response.ok) throw new Error('提交预算失败');
    return response.json();
  },

  approve: async (id: string, approvalComment?: string): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approvalComment }),
    });
    if (!response.ok) throw new Error('批准预算失败');
    return response.json();
  },

  reject: async (id: string, comment: string): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment }),
    });
    if (!response.ok) throw new Error('拒绝预算失败');
    return response.json();
  },

  // ========== Expense ==========
  createExpense: async (data: ExpenseFormData): Promise<BudgetExpense> => {
    const response = await fetch(`${API_BASE_URL}/budgets/expenses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('创建支出失败');
    return response.json();
  },

  getExpenses: async (query?: { budgetId?: string; fiscalYear?: number }): Promise<{ data: BudgetExpense[]; total: number }> => {
    const params = new URLSearchParams(query as any).toString();
    const response = await fetch(`${API_BASE_URL}/budgets/expenses?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取支出列表失败');
    return response.json();
  },

  updateExpense: async (id: string, data: Partial<ExpenseFormData>): Promise<BudgetExpense> => {
    const response = await fetch(`${API_BASE_URL}/budgets/expenses/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('更新支出失败');
    return response.json();
  },

  approveExpense: async (id: string, approvalComment?: string): Promise<BudgetExpense> => {
    const response = await fetch(`${API_BASE_URL}/budgets/expenses/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approvalComment }),
    });
    if (!response.ok) throw new Error('批准支出失败');
    return response.json();
  },

  payExpense: async (id: string): Promise<BudgetExpense> => {
    const response = await fetch(`${API_BASE_URL}/budgets/expenses/${id}/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('标记已付款失败');
    return response.json();
  },

  // ========== Adjustment ==========
  createAdjustment: async (data: {
    budgetId: string;
    fiscalYear: number;
    adjustType: 'add' | 'reduce' | 'transfer';
    adjustAmount: number;
    reason: string;
  }): Promise<BudgetAdjustment> => {
    const response = await fetch(`${API_BASE_URL}/budgets/adjustments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('创建调整失败');
    return response.json();
  },

  getAdjustments: async (query?: { budgetId?: string; fiscalYear?: number }): Promise<{ data: BudgetAdjustment[]; total: number }> => {
    const params = new URLSearchParams(query as any).toString();
    const response = await fetch(`${API_BASE_URL}/budgets/adjustments?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取调整列表失败');
    return response.json();
  },

  approveAdjustment: async (id: string, approvalComment?: string): Promise<BudgetAdjustment> => {
    const response = await fetch(`${API_BASE_URL}/budgets/adjustments/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approvalComment }),
    });
    if (!response.ok) throw new Error('批准调整失败');
    return response.json();
  },

  // ========== Statistics ==========
  getStats: async (fiscalYear: number): Promise<BudgetStats> => {
    const response = await fetch(`${API_BASE_URL}/budgets/stats?fiscalYear=${fiscalYear}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取统计失败');
    return response.json();
  },

  getComparison: async (fiscalYear: number): Promise<BudgetComparison[]> => {
    const response = await fetch(`${API_BASE_URL}/budgets/comparison?fiscalYear=${fiscalYear}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取对比失败');
    return response.json();
  },

  getDepartmentSummary: async (fiscalYear: number): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/budgets/department-summary?fiscalYear=${fiscalYear}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取部门汇总失败');
    return response.json();
  },
};

export default budgetApi;
