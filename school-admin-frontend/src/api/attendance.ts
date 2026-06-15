import apiClient from './client';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEAVE_EARLY = 'leave_early',
  SICK_LEAVE = 'sick_leave',
  PERSONAL_LEAVE = 'personal_leave',
  ABSENT_WITH_LEAVE = 'absent_with_leave',
}

export enum SyncSource {
  ECLASS = 'eClass',
  MANUAL = 'manual',
  BIOMETRIC = 'biometric',
}

export interface AttendanceRecord {
  id: string;
  studentId?: string;
  student?: { id: string; name: string };
  classId?: string;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  attendanceType: string;
  remark?: string;
  syncSource?: SyncSource;
  deviceId?: string;
  deviceName?: string;
  batchId?: string;
  canRevokeUntil?: string;
  createdBy: string;
  createdAt: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  leaveEarly: number;
  sickLeave: number;
  personalLeave: number;
  attendanceRate: number;
}

export interface BatchRecordInput {
  studentId?: string;
  studentName?: string;
  classId?: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remark?: string;
}

export interface ConfirmPreviewResponse {
  attendanceDate: string;
  classId: string;
  studentCount: number;
  statusSummary: Record<string, number>;
  records: Array<{
    studentId: string;
    studentName: string;
    status: AttendanceStatus;
  }>;
}

export interface AffectedStudent {
  studentId: string;
  studentName: string;
  classId: string;
  affectedSources: string[];
  suggestedAction: 'confirm_present' | 'mark_pending' | 'none';
  lastKnownStatus: string;
}

export interface AffectedStudentsResponse {
  date: string;
  total: number;
  students: AffectedStudent[];
}

// ============ API Functions ============

export const attendanceApi = {
  /** 获取出勤列表 */
  list: async (params?: {
    page?: number;
    limit?: number;
    classId?: string;
    studentId?: string;
    attendanceDate?: string;
    status?: AttendanceStatus;
  }) => {
    const { data } = await apiClient.get('/attendances', { params });
    return data as { records: AttendanceRecord[]; total: number };
  },

  /** 获取单条出勤记录 */
  get: async (id: string) => {
    const { data } = await apiClient.get(`/attendances/${id}`);
    return data as AttendanceRecord;
  },

  /** 创建出勤记录 */
  create: async (body: Record<string, unknown>) => {
    const { data } = await apiClient.post('/attendances', body);
    return data as AttendanceRecord;
  },

  /** 更新出勤记录 */
  update: async (id: string, body: Record<string, unknown>) => {
    const { data } = await apiClient.put(`/attendances/${id}`, body);
    return data as AttendanceRecord;
  },

  /** 删除出勤记录 */
  delete: async (id: string) => {
    await apiClient.delete(`/attendances/${id}`);
  },

  /** 按班级和日期获取出勤记录 */
  getByClassAndDate: async (classId: string, date: string) => {
    const { data } = await apiClient.get(`/attendances/class/${classId}/date/${date}`);
    return data as {
      classId: string;
      date: string;
      records: AttendanceRecord[];
      summary: { total: number; present: number; absent: number; late: number };
    };
  },

  /** 获取学生出勤历史 */
  getByStudent: async (
    studentId: string,
    params?: { page?: number; limit?: number; startDate?: string; endDate?: string },
  ) => {
    const { data } = await apiClient.get(`/attendances/student/${studentId}`, { params });
    return data as { records: AttendanceRecord[]; total: number };
  },

  /** 获取每日统计 */
  getDailyStats: async (date: string, classId?: string) => {
    const { data } = await apiClient.get('/attendances/stats/daily', {
      params: { date, classId },
    });
    return data as AttendanceStats & { date: string };
  },

  /** 获取月度统计 */
  getMonthlyStats: async (year: number, month: number, classId?: string) => {
    const { data } = await apiClient.get('/attendances/stats/monthly', {
      params: { year, month, classId },
    });
    return data;
  },

  /** 获取统计摘要 */
  getStats: async (params?: { classId?: string; startDate?: string; endDate?: string }) => {
    const { data } = await apiClient.get('/attendances/stats/summary', { params });
    return data as AttendanceStats;
  },

  /** 获取班级出勤统计 */
  getClassStats: async (classId: string, params?: { startDate?: string; endDate?: string }) => {
    const { data } = await apiClient.get(`/attendances/class/${classId}/stats`, { params });
    return data;
  },

  /** 批量录入确认预览（不保存）*/
  confirmPreview: async (body: {
    classId?: string;
    attendanceDate: string;
    records: BatchRecordInput[];
  }) => {
    const { data } = await apiClient.post('/attendances/batch/preview', body);
    return data as ConfirmPreviewResponse;
  },

  /** 批量创建出勤记录（确认预览后提交）*/
  batchCreate: async (body: {
    classId?: string;
    attendanceDate: string;
    records: BatchRecordInput[];
    syncSource?: SyncSource;
    deviceId?: string;
    deviceName?: string;
  }) => {
    const { data } = await apiClient.post('/attendances/batch', body);
    return data as { batchId: string; records: AttendanceRecord[]; count: number };
  },

  /** 批量撤销（仅15分钟内有效）*/
  batchRevoke: async (batchId: string) => {
    const { data } = await apiClient.delete(`/attendances/batch/${batchId}`);
    return data as { deletedCount: number };
  },

  /** 获取受影响学生列表（数据源同步失败时）*/
  getAffectedStudents: async (date?: string) => {
    const { data } = await apiClient.get('/attendances/affected-stududents', {
      params: { date },
    });
    return data as AffectedStudentsResponse;
  },

  /** 获取未上报缺勤记录 */
  getUnreportedAbsences: async (classId?: string) => {
    const { data } = await apiClient.get('/attendances/reminders/unreported', {
      params: { classId },
    });
    return data as AttendanceRecord[];
  },

  /** 签到 */
  checkIn: async (id: string, checkInTime: string) => {
    const { data } = await apiClient.post(`/attendances/check-in/${id}`, { checkInTime });
    return data as AttendanceRecord;
  },

  /** 签退 */
  checkOut: async (id: string, checkOutTime: string) => {
    const { data } = await apiClient.post(`/attendances/check-out/${id}`, { checkOutTime });
    return data as AttendanceRecord;
  },
};

export default attendanceApi;
