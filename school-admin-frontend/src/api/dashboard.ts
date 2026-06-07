import axios, { AxiosInstance, AxiosError } from 'axios';

// API 响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// 统计数据类型
export interface DashboardStats {
  todayAttendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
  };
  monthLeave: {
    total: number;
    sick: number;
    personal: number;
  };
  pendingInquiries: number;
  todayNotifications: number;
}

// 近期活动类型
export interface RecentActivity {
  id: string;
  type: 'attendance' | 'leave' | 'inquiry' | 'notification' | 'system';
  title: string;
  description: string;
  timestamp: string;
  priority?: 'high' | 'medium' | 'low';
}

// 图表数据类型
export interface AttendanceChartData {
  date: string;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

export interface ClassAttendanceComparison {
  classId: string;
  className: string;
  present: number;
  absent: number;
  rate: number;
}

// 错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
  traceId?: string;
}

class DashboardApi {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://localhost:3001/api/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 从 localStorage 获取 token
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 获取 school ID
        const schoolId = localStorage.getItem('school_id');
        if (schoolId) {
          config.headers['X-School-ID'] = schoolId;
        }

        // 生成请求 ID
        config.headers['X-Request-ID'] = crypto.randomUUID();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          const errorData = error.response.data;
          const apiError: ApiError = {
            code: errorData.code || 'UNKNOWN',
            message: errorData.message || '请求失败',
            details: errorData.details,
            timestamp: errorData.timestamp,
            requestId: errorData.request_id,
            traceId: errorData.trace_id,
          };

          // 401 未认证，重定向到登录页
          if (error.response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('school_id');
            window.location.href = '/login';
          }

          return Promise.reject(apiError);
        }

        if (error.request) {
          // 网络错误
          return Promise.reject({
            code: 'NETWORK_ERROR',
            message: '网络连接失败，请检查网络设置',
            timestamp: new Date().toISOString(),
          });
        }

        return Promise.reject({
          code: 'UNKNOWN',
          message: error.message || '未知错误',
          timestamp: new Date().toISOString(),
        });
      }
    );
  }

  // 获取仪表盘统计数据
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return this.client.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  }

  // 获取近期活动
  async getRecentActivities(limit: number = 10): Promise<ApiResponse<RecentActivity[]>> {
    return this.client.get<ApiResponse<RecentActivity[]>>('/dashboard/recent-activities', {
      params: { limit },
    });
  }

  // 获取出勤率趋势图数据
  async getAttendanceTrend(days: number = 7): Promise<ApiResponse<AttendanceChartData[]>> {
    return this.client.get<ApiResponse<AttendanceChartData[]>>('/dashboard/attendance-trend', {
      params: { days },
    });
  }

  // 获取班级出勤对比数据
  async getClassComparison(): Promise<ApiResponse<ClassAttendanceComparison[]>> {
    return this.client.get<ApiResponse<ClassAttendanceComparison[]>>('/dashboard/class-comparison');
  }
}

// 导出单例
export const dashboardApi = new DashboardApi();