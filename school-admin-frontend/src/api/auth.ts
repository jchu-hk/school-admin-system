/**
 * 认证API客户端
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResendOTPRequest,
  ResendOTPResponse,
  APIError,
} from '../types/auth';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加Authorization Header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加X-School-ID Header (示例值,实际应根据业务逻辑获取)
    const schoolId = localStorage.getItem('schoolId');
    if (schoolId) {
      config.headers['X-School-ID'] = schoolId;
    }

    // 添加X-Request-ID Header
    config.headers['X-Request-ID'] = crypto.randomUUID();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理,并自动提取data字段
apiClient.interceptors.response.use(
  (response) => {
    // 后端返回格式: { code, message, data, timestamp }
    // 自动提取外层结构,保持原样返回
    return response.data;
  },
  (error: AxiosError<APIError>) => {
    if (error.response?.data) {
      const apiError = error.response.data;
      return Promise.reject(apiError);
    }

    // 网络错误或服务器不可达
    const networkError: APIError = {
      code: 'NETWORK_ERROR',
      message: '网络连接失败，请检查网络设置',
      timestamp: new Date().toISOString(),
    };
    return Promise.reject(networkError);
  }
);

// Token管理
export const tokenManager = {
  setTokens: (token: string, refreshToken: string, expiresIn: number) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('tokenExpiry', String(Date.now() + expiresIn * 1000));
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem('token');
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  isTokenExpired: (): boolean => {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return true;
    return Date.now() > Number(expiry);
  },

  clearTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('schoolId');
    localStorage.removeItem('userInfo');
  },

  setUserInfo: (userInfo: any) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('schoolId', userInfo.schoolId);
  },

  getUserInfo: (): any => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },
};

// 登录API
export const authAPI = {
  /**
   * 账号密码登录
   * POST /api/v1/auth/login
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post('/auth/login', data) as unknown as LoginResponse;
  },

  /**
   * 验证OTP验证码
   * POST /api/v1/auth/otp/verify
   */
  verifyOTP: async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    return apiClient.post('/auth/otp/verify', data) as unknown as VerifyOTPResponse;
  },

  /**
   * 重新发送OTP验证码
   * POST /api/v1/auth/otp/send
   */
  resendOTP: async (data: ResendOTPRequest): Promise<ResendOTPResponse> => {
    return apiClient.post('/auth/otp/send', data) as unknown as ResendOTPResponse;
  },

  /**
   * 刷新Token
   * POST /api/v1/auth/refresh
   */
  refreshToken: async (): Promise<VerifyOTPResponse> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return apiClient.post('/auth/refresh', {
      refreshToken,
    }) as unknown as VerifyOTPResponse;
  },

  /**
   * 登出
   * POST /api/v1/auth/logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      tokenManager.clearTokens();
    }
  },
};

export default apiClient;