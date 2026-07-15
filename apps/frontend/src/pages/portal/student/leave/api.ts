/**
 * 电子请假 — API 调用封装
 *
 * 对应后端端点:
 *   POST   /api/portal/leave          → 创建请假申请
 *   GET    /api/portal/leave          → 获取请假记录列表（分页）
 *   GET    /api/portal/leave/:id      → 获取请假详情
 *   PATCH  /api/portal/leave/:id/cancel  → 撤回请假（取消）
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  const body = await res.json();

  if (!res.ok) {
    const err = body as ApiErrorResponse;
    throw new LeaveApiError(
      err.error ?? 'UNKNOWN_ERROR',
      err.message ?? '请求失败',
      res.status,
    );
  }

  return body as T;
}

// ── Types ────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

// ── Leave Types ──────────────────────────────────────────

/** 请假类型 — 学生门户可见的选项（简化为4类） */
export type StudentLeaveType = 'sick' | 'personal' | 'family' | 'other';

/** 请假状态 */
export type LeaveStatus = 'pending' | 'pending_director' | 'approved' | 'rejected' | 'cancelled' | 'checked_in';

/** 请假记录 */
export interface LeaveRecord {
  id: string;
  applicationNo: string;
  leaveType: StudentLeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  /** 班主任审批意见（拒绝时显示） */
  approvalComment?: string;
  /** 校务主任审批意见 */
  directorComment?: string;
  /** 班主任姓名 */
  classTeacherName?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 请假申请表单数据 */
export interface LeaveFormData {
  leaveType: StudentLeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachment?: File;
  contactPhone?: string;
}

/** 请假记录列表（分页） */
export interface LeaveListData {
  items: LeaveRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 创建请假返回值 */
export interface CreateLeaveResult {
  id: string;
  applicationNo: string;
  status: LeaveStatus;
}

// ── Error class ──────────────────────────────────────────

export class LeaveApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'LeaveApiError';
  }

  get isValidationError(): boolean {
    return this.httpStatus === 400;
  }

  get isForbidden(): boolean {
    return this.httpStatus === 403;
  }
}

// ── API functions ────────────────────────────────────────

/**
 * POST /api/portal/leave
 * 创建请假申请
 */
export async function createLeave(data: LeaveFormData): Promise<CreateLeaveResult> {
  let body: string;
  const headers: Record<string, string> = {};

  if (data.attachment) {
    // 有附件 → 使用 FormData
    const formData = new FormData();
    formData.append('leaveType', data.leaveType);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('reason', data.reason);
    if (data.contactPhone) {
      formData.append('contactPhone', data.contactPhone);
    }
    formData.append('attachment', data.attachment);

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Content-Type 由浏览器自动设为 multipart/form-data

    const res = await fetch(`${API_BASE}/api/portal/leave`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const resBody = await res.json();
    if (!res.ok) {
      const err = resBody as ApiErrorResponse;
      throw new LeaveApiError(
        err.error ?? 'CREATE_FAILED',
        err.message ?? '提交请假失败',
        res.status,
      );
    }
    return (resBody as ApiSuccessResponse<CreateLeaveResult>).data;
  }

  // 无附件 → 使用 JSON body
  body = JSON.stringify({
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
    contactPhone: data.contactPhone,
  });

  const res = await request<ApiSuccessResponse<CreateLeaveResult>>(
    '/portal/leave',
    {
      method: 'POST',
      body,
    },
  );
  return res.data;
}

/**
 * GET /api/portal/leave
 * 获取请假记录列表（分页）
 *
 * @param page 页码（从1开始）
 * @param pageSize 每页条数
 * @param status 可选，按状态筛选
 */
export async function fetchLeaveList(
  page: number = 1,
  pageSize: number = 10,
  status?: LeaveStatus,
): Promise<LeaveListData> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (status) {
    params.set('status', status);
  }

  const res = await request<ApiSuccessResponse<LeaveListData>>(
    `/portal/leave?${params.toString()}`,
  );
  return res.data;
}

/**
 * GET /api/portal/leave/:id
 * 获取请假详情
 */
export async function fetchLeaveDetail(id: string): Promise<LeaveRecord> {
  const res = await request<ApiSuccessResponse<LeaveRecord>>(
    `/portal/leave/${id}`,
  );
  return res.data;
}

/**
 * PATCH /api/portal/leave/:id/cancel
 * 撤回（取消）请假申请 — 仅 pending 状态可撤回
 */
export async function cancelLeave(id: string): Promise<void> {
  await request<ApiSuccessResponse<null>>(
    `/portal/leave/${id}/cancel`,
    { method: 'PATCH' },
  );
}
