/**
 * 学生门户 — API 调用封装
 *
 * 端点:
 *   GET /api/portal/menus  → 获取当前角色可见的菜单列表
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
    throw new PortalApiError(
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

export interface MenuItem {
  /** 菜单唯一标识，如 'profile' / 'attendance' / 'leave' / 'notification' / 'settings' */
  key: string;
  /** 菜单显示名称 */
  label: string;
  /** 图标 emoji 或 icon 类名 */
  icon: string;
  /** 路由路径，以 /portal/student/ 开头 */
  path: string;
  /** 子菜单项（可选） */
  children?: MenuItem[];
  /** 排序权重（小→大） */
  order: number;
}

export interface PortalMenusData {
  menus: MenuItem[];
}

export interface StudentProfile {
  id: string;
  name: string;
  class_name: string;
  grade: string;
  student_id: string;
  avatar_url?: string;
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

// ── API functions ────────────────────────────────────────

/**
 * GET /api/portal/menus
 * 获取当前登录角色可见的门户菜单列表
 */
export async function fetchPortalMenus(): Promise<MenuItem[]> {
  const res = await request<ApiSuccessResponse<PortalMenusData>>(
    '/portal/menus',
  );
  // 按 order 排序返回
  const sorted = (res.data.menus ?? []).sort((a, b) => a.order - b.order);
  return sorted;
}

/**
 * GET /api/portal/student/profile
 * 获取当前学生用户信息
 */
export async function fetchStudentProfile(): Promise<StudentProfile | null> {
  try {
    const res = await request<ApiSuccessResponse<StudentProfile>>(
      '/portal/student/profile',
    );
    return res.data;
  } catch {
    return null;
  }
}
