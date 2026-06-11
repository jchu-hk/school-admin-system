import apiClient from './client';

// API 响应通用类型
interface ApiResponse<T> {
  requestId: string;  // 后端返回 requestId (camelCase)
  data: T;
  message?: string;
  success: boolean;
}

// 仪表盘统计数据类型
export interface DashboardStats {
  students: number;
  teachers: number;
  courses: number;
  attendance: number;
}

// 出勤趋势数据类型
export interface AttendanceTrend {
  name: string;
  value: number;
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
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/api/dashboard/stats');
    // 防御性编程：确保返回有效数据
    const data = response.data?.data;
    return data || { students: 0, teachers: 0, courses: 0, attendance: 0 };
  },

  // 获取出勤趋势
  getAttendanceTrend: async (period: 'week' | 'month' = 'week'): Promise<AttendanceTrend[]> => {
    const days = period === 'week' ? 7 : 30;
    const response = await apiClient.get<ApiResponse<AttendanceTrend[]>>('/api/dashboard/attendance-trend', {
      params: { period, days }
    });
    // 防御性编程：确保返回有效数据
    return response.data?.data || [];
  },

  // 获取请假统计
  getLeaveStats: async (): Promise<LeaveStats> => {
    const response = await apiClient.get<ApiResponse<LeaveStats>>('/api/dashboard/leave-stats');
    // 防御性编程：确保返回有效数据
    return response.data?.data || { totalLeaves: 0, pendingLeaves: 0, approvedLeaves: 0, rejectedLeaves: 0 };
  }
};

export default dashboardApi;
