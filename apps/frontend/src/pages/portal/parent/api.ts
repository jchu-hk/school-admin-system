/**
 * 家长门户 API 调用封装
 *
 * 对应后端端点:
 *   GET   /api/portal/menus                    — 获取菜单列表
 *   GET   /api/portal/profile?student_id=xxx   — 获取指定孩子信息（脱敏）
 *   POST  /api/portal/leave                    — 为孩子创建请假申请
 *   GET   /api/portal/leave?student_id=xxx     — 获取请假记录列表（分页）
 *   GET   /api/portal/leave/:id                — 获取请假详情
 *   PATCH /api/portal/leave/:id/cancel         — 撤回请假
 *
 * 通用封装逻辑
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

  if (!res.ok) {
    throw new PortalApiError(
      'API_ERROR',
      `请求失败 (${res.status})`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

// ── Types ────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
}

export interface PortalMenu {
  id: string;
  label: string;
  icon: string;
  path: string;
  children?: PortalMenu[];
}

export interface ChildInfo {
  id: string;
  name: string;
  class_name: string;
  student_id: string;
}

export interface ChildProfile {
  child: ChildInfo;
  profile: {
    name: string;
    student_id_mask: string;
    gender: string;
    birth_date: string;
    class_name: string;
    phone_mask: string;
    address_mask: string;
    emergency_contact_mask: string;
  };
}

/** 请假类型 */
export type ParentLeaveType = 'sick' | 'personal' | 'family' | 'other';

/** 请假状态 */
export type LeaveStatus =
  | 'pending'
  | 'pending_director'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'checked_in';

/** 请假记录 */
export interface LeaveRecord {
  id: string;
  applicationNo: string;
  leaveType: ParentLeaveType;
  studentId: string;
  studentName?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  approvalComment?: string;
  directorComment?: string;
  classTeacherName?: string;
  createdAt: string;
  updatedAt: string;
}

/** 请假申请表单数据（家长版，含 studentId） */
export interface ParentLeaveFormData {
  studentId: string;
  leaveType: ParentLeaveType;
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

export interface CreateLeaveResult {
  id: string;
  applicationNo: string;
  status: LeaveStatus;
}

// ── Error class ──────────────────────────────────────────

export class PortalApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'PortalApiError';
  }
}

// ── Profile API ──────────────────────────────────────────

/**
 * GET /api/portal/menus
 * 获取家长门户侧边菜单列表
 */
export async function fetchPortalMenus(): Promise<PortalMenu[]> {
  const res = await request<ApiSuccessResponse<PortalMenu[]>>('/portal/menus');
  return res.data;
}

/**
 * GET /api/portal/profile?student_id=xxx
 * 获取指定孩子的脱敏档案
 */
export async function fetchChildProfile(
  studentId: string,
): Promise<ChildProfile> {
  const res = await request<ApiSuccessResponse<ChildProfile>>(
    `/portal/profile?student_id=${encodeURIComponent(studentId)}`,
  );
  return res.data;
}

// ── Leave API ────────────────────────────────────────────

/**
 * POST /api/portal/leave
 * 为孩子创建请假申请（含 student_id）
 */
export async function createParentLeave(
  data: ParentLeaveFormData,
): Promise<CreateLeaveResult> {
  if (data.attachment) {
    // 有附件 → FormData
    const formData = new FormData();
    formData.append('studentId', data.studentId);
    formData.append('leaveType', data.leaveType);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('reason', data.reason);
    if (data.contactPhone) {
      formData.append('contactPhone', data.contactPhone);
    }
    formData.append('attachment', data.attachment);

    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/portal/leave`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const resBody = await res.json();
    if (!res.ok) {
      throw new PortalApiError(
        resBody.error ?? 'CREATE_FAILED',
        resBody.message ?? '提交请假失败',
        res.status,
      );
    }
    return (resBody as ApiSuccessResponse<CreateLeaveResult>).data;
  }

  // 无附件 → JSON
  const res = await request<ApiSuccessResponse<CreateLeaveResult>>(
    '/portal/leave',
    {
      method: 'POST',
      body: JSON.stringify({
        studentId: data.studentId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        contactPhone: data.contactPhone,
      }),
    },
  );
  return res.data;
}

/**
 * GET /api/portal/leave?student_id=xxx
 * 获取指定孩子的请假记录列表（分页）
 */
export async function fetchParentLeaveList(
  studentId: string,
  page: number = 1,
  pageSize: number = 10,
  status?: LeaveStatus,
): Promise<LeaveListData> {
  const params = new URLSearchParams();
  params.set('student_id', studentId);
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
export async function fetchParentLeaveDetail(id: string): Promise<LeaveRecord> {
  const res = await request<ApiSuccessResponse<LeaveRecord>>(
    `/portal/leave/${id}`,
  );
  return res.data;
}

/**
 * PATCH /api/portal/leave/:id/cancel
 * 撤回（取消）请假申请 — 仅 pending/pending_director 状态可撤回
 */
export async function cancelParentLeave(id: string): Promise<void> {
  await request<ApiSuccessResponse<null>>(
    `/portal/leave/${id}/cancel`,
    { method: 'PATCH' },
  );
}

/**
 * DELETE 占位 — 系统暂未提供删除接口，仅保留备用
 * 家长版禁用删除，使用撤回代替
 */

// ── 脱敏函数 ─────────────────────────────────────────────

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function maskStudentId(id: string): string {
  if (!id || id.length < 8) return id;
  return id.slice(0, 6) + '****';
}

export function maskName(name: string): string {
  if (!name) return name;
  return name.charAt(0) + '*'.repeat(name.length - 1);
}

export function maskAddress(address: string): string {
  if (!address) return address;
  return address.replace(/\d+号.*$/, 'XX号');
}
