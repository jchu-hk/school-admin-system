/**
 * QR考勤扫码 API 调用封装
 *
 * 对应后端端点: POST /api/attendance/qr/scan
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// ── Types ────────────────────────────────────────────────

export interface ScanRequest {
  qr_code_data: string;
  device_id: string;
}

export interface ScanSuccessData {
  student_id: string;
  student_name: string;
  class_name: string;
  scanned_at: string;
}

export interface ScanApiResponse {
  success: boolean;
  data?: ScanSuccessData;
  error?: string;
  message?: string;
  checked_in_at?: string;
}

export interface BatchSyncRequest {
  device_id: string;
  batch: Array<{
    qr_raw: string;
    scanned_at: string;
  }>;
}

export interface BatchSyncResponse {
  success: boolean;
  synced_count: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

// ── Error types ──────────────────────────────────────────

export type ScanErrorCode =
  | 'QR_EXPIRED'
  | 'DUPLICATE_SCAN'
  | 'DUPLICATE_CHECKIN'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_QR_FORMAT'
  | 'INVALID_SIGNATURE'
  | 'QR_NOT_FOUND'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR';

export class ScanApiError extends Error {
  constructor(
    public readonly code: ScanErrorCode,
    message: string,
    public readonly checkedInAt?: string,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'ScanApiError';
  }

  get isExpired(): boolean {
    return this.code === 'QR_EXPIRED';
  }

  get isDuplicate(): boolean {
    return this.code === 'DUPLICATE_SCAN'
      || this.code === 'DUPLICATE_CHECKIN'
      || this.code === 'ALREADY_CHECKED_IN';
  }

  get isInvalid(): boolean {
    return this.code === 'INVALID_QR_FORMAT'
      || this.code === 'INVALID_SIGNATURE'
      || this.code === 'QR_NOT_FOUND';
  }

  get isRateLimited(): boolean {
    return this.code === 'RATE_LIMIT';
  }
}

// ── Helpers ──────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ── API functions ────────────────────────────────────────

/**
 * POST /api/attendance/qr/scan
 * 教职工扫码签到
 *
 * 成功: 返回 { success: true, data: { student_id, student_name, class_name, scanned_at } }
 * 过期: 返回 { success: false, error: "QR_EXPIRED" }
 * 重复: 返回 { success: false, error: "DUPLICATE_SCAN" } — 可能含 checked_in_at
 * 伪造: 返回 { success: false, error: "INVALID_QR_FORMAT" | "INVALID_SIGNATURE" | "QR_NOT_FOUND" }
 * 网络错误: 抛出 ScanApiError(code: "NETWORK_ERROR")
 */
export async function scanQrCode(
  qrCodeData: string,
  deviceId: string = `web-scan-${Date.now()}`,
): Promise<ScanSuccessData> {
  const response = await fetch(`${API_BASE}/api/attendance/qr/scan`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      qr_code_data: qrCodeData,
      device_id: deviceId,
    } as ScanRequest),
  });

  const body: ScanApiResponse = await response.json();

  if (response.ok && body.success && body.data) {
    return body.data;
  }

  // ── 错误映射 ──
  const errorCode: ScanErrorCode = detectErrorCode(body, response.status);

  if (errorCode === 'ALREADY_CHECKED_IN' || errorCode === 'DUPLICATE_CHECKIN' || errorCode === 'DUPLICATE_SCAN') {
    throw new ScanApiError(
      errorCode,
      body.message || '该学生已签到',
      body.checked_in_at,
      response.status,
    );
  }

  if (errorCode === 'QR_EXPIRED') {
    throw new ScanApiError(errorCode, body.message || 'QR码已过期', undefined, response.status);
  }

  if (errorCode === 'RATE_LIMIT') {
    throw new ScanApiError(errorCode, body.message || '请求过于频繁', undefined, response.status);
  }

  // 默认视为无效/伪造
  throw new ScanApiError(
    errorCode,
    body.message || '无效QR码',
    undefined,
    response.status,
  );
}

function detectErrorCode(body: ScanApiResponse, httpStatus: number): ScanErrorCode {
  if (httpStatus === 429) return 'RATE_LIMIT';
  if (httpStatus === 409) return 'ALREADY_CHECKED_IN';

  const err = body.error || body.message || '';
  const upper = err.toUpperCase();

  if (upper.includes('EXPIRED')) return 'QR_EXPIRED';
  if (upper.includes('DUPLICATE') || upper.includes('ALREADY')) return 'DUPLICATE_SCAN';
  if (upper.includes('SIGNATURE')) return 'INVALID_SIGNATURE';
  if (upper.includes('NOT_FOUND')) return 'QR_NOT_FOUND';
  if (upper.includes('FORMAT')) return 'INVALID_QR_FORMAT';

  return 'INVALID_QR_FORMAT';
}

/**
 * POST /api/attendance/qr/sync-batch
 * 批量同步离线缓存的签到记录
 */
export async function syncOfflineBatch(
  batch: BatchSyncRequest,
): Promise<BatchSyncResponse> {
  const response = await fetch(`${API_BASE}/api/attendance/qr/sync-batch`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(batch),
  });

  if (!response.ok) {
    throw new Error(`同步失败: ${response.status}`);
  }

  return response.json();
}
