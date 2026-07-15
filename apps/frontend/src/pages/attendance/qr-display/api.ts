/**
 * QR考勤前端 API 调用封装
 *
 * 对应后端端点: POST /api/attendance/qr/generate
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
    throw new QrApiError(
      err.error ?? 'UNKNOWN_ERROR',
      err.message ?? '请求失败',
      err.checked_in_at,
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
  checked_in_at?: string;
}

export interface GenerateQrData {
  qr_code_data: string;
  expires_at: string;
  nonce: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  class_name: string;
  student_id: string;
}

// ── Error class ──────────────────────────────────────────

export class QrApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly checkedInAt?: string,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'QrApiError';

    // Checked-in status from a 409 Conflict
    if (code === 'ALREADY_CHECKED_IN') {
      this.name = 'AlreadyCheckedInError';
    }
    // Rate limit
    if (code === 'RATE_LIMIT') {
      this.name = 'QrRateLimitError';
    }
  }
}

// ── API functions ────────────────────────────────────────

/**
 * POST /api/attendance/qr/generate
 * 生成学生签到QR码
 */
export async function generateQrCode(
  deviceId?: string,
): Promise<GenerateQrData> {
  const res = await request<ApiSuccessResponse<GenerateQrData>>(
    '/attendance/qr/generate',
    {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    },
  );
  return res.data;
}

/**
 * GET /api/auth/me (or profile endpoint)
 * 获取当前学生用户信息
 */
export async function fetchStudentProfile(): Promise<StudentProfile | null> {
  try {
    const res = await request<ApiSuccessResponse<StudentProfile>>('/auth/me');
    return res.data;
  } catch {
    return null;
  }
}
