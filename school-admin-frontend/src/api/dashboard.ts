import apiClient from './client';

// API 响应通用类型
interface ApiResponse<T> {
  requestId: string;  // 后端返回 requestId (camelCase)
  data: T;
  message?: string;
  success: boolean;
}

// 仪表盘统计数据类型 (与后端匹配)
export interface DashboardStats {
  studentCount: number;
  todayAttendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    attendanceRate: number;
  };
  monthlyLeave: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  pendingInquiries: number;
  todayNotifications: number;
}

// 出勤趋势数据类型
export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendanceRate: number;
}

// 请假统计类型
export interface LeaveStats {
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
}

// 仪表盘 API
export const dashboardApi = {
  // 获取仪表盘统计数据
  getStats: async (): Promise<DashboardStats> => {
    // 后端直接返回 DashboardStats 对象（无 ApiResponse 包装）
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data || {
      studentCount: 0,
      todayAttendance: { total: 0, present: 0, absent: 0, late: 0, leave: 0, attendanceRate: 0 },
      monthlyLeave: { total: 0, approved: 0, pending: 0, rejected: 0 },
      pendingInquiries: 0,
      todayNotifications: 0
    };
  },

  // 获取出勤趋势
  getAttendanceTrend: async (period: 'week' | 'month' = 'week'): Promise<AttendanceTrend[]> => {
    const days = period === 'week' ? 7 : 30;
    // 后端直接返回 AttendanceTrend[] 数组（无 ApiResponse 包装）
    const response = await apiClient.get<AttendanceTrend[]>('/dashboard/attendance-trend', {
      params: { period, days }
    });
    return response.data || [];
  },

  // 获取请假统计
  getLeaveStats: async (): Promise<LeaveStats> => {
    // 后端直接返回 LeaveStats 对象（无 ApiResponse 包装）
    const response = await apiClient.get<LeaveStats>('/dashboard/leave-stats');
    return response.data || { totalLeaves: 0, pendingLeaves: 0, approvedLeaves: 0, rejectedLeaves: 0 };
  }
};

export default dashboardApi;