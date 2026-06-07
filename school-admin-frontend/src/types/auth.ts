/**
 * 认证相关类型定义
 */

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      role: string;
      type: string;
      schoolId: string;
    };
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  timestamp: string;
}

export interface VerifyOTPRequest {
  otp: string;
}

export interface VerifyOTPResponse {
  code: number;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  timestamp: string;
}

export interface ResendOTPRequest {
  username: string;
}

export interface ResendOTPResponse {
  code: number;
  message: string;
  data: {
    expiresIn: number;
  };
  timestamp: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: {
    errors?: Array<{
      field: string;
      message: string;
      value?: any;
      code: string;
    }>;
  };
  timestamp: string;
  requestId?: string;
  traceId?: string;
}