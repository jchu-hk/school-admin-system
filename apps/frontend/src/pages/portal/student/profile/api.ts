/**
 * 学生门户 — 个人档案 API
 *
 * GET  /api/portal/profile   → 获取个人信息
 * PUT  /api/portal/profile   → 更新可编辑字段
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// ── Types ────────────────────────────────────────────────

export interface StudentProfileData {
  student_id: string;
  name: string;
  gender: string;
  birth_date: string;
  class_name: string;
  grade: string;
  phone: string;
  email: string;
  emergency_contact: string;
  address: string;
  avatar_url?: string;
}

/** 可编辑字段的子集 */
export interface ProfileUpdatePayload {
  phone: string;
  email: string;
  emergency_contact: string;
  address: string;
}

// ── Internal helpers ────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

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

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });

  // 204 No Content (e.g. successful PUT with no body)
  if (res.status === 204) {
    return {} as T;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ProfileApiError(
      body.error ?? 'UNKNOWN_ERROR',
      body.message ?? '请求失败',
      res.status,
    );
  }

  // Handle wrapped response { success, data }
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }

  return body as T;
}

// ── Error class ──────────────────────────────────────────

export class ProfileApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'ProfileApiError';
  }
}

// ── API functions ────────────────────────────────────────

/**
 * GET /api/portal/profile
 * 获取当前学生个人档案信息
 */
export async function fetchProfile(): Promise<StudentProfileData> {
  return request<StudentProfileData>('/portal/profile', { method: 'GET' });
}

/**
 * PUT /api/portal/profile
 * 更新可编辑字段（phone, email, emergency_contact, address）
 */
export async function updateProfile(
  payload: ProfileUpdatePayload,
): Promise<StudentProfileData> {
  return request<StudentProfileData>('/portal/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
