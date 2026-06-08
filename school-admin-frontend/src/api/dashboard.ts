import axios from 'axios';

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
    const token = localStorage.getItem('token');
    const response = await axios.get<ApiResponse<DashboardStats>>('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  // 获取出勤趋势
  getAttendanceTrend: async (period: 'week' | 'month' = 'week'): Promise<AttendanceTrend[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get<ApiResponse<AttendanceTrend[]>>('/api/dashboard/attendance-trend', {
      headers: { Authorization: `Bearer ${token}` },
      params: { period }
    });
    return response.data.data;
  },

  // 获取请假统计
  getLeaveStats: async (): Promise<LeaveStats> => {
    const token = localStorage.getItem('token');
    const response = await axios.get<ApiResponse<LeaveStats>>('/api/dashboard/leave-stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }
};

export default dashboardApi;
