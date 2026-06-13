// 系统设置API接口定义
export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  updatedAt: string;
}

export interface SystemConfigFormData {
  key: string;
  value: string;
  category: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  module: string;
  userId?: string;
  createdAt: string;
}

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ConfigListResponse {
  data: SystemConfig[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LogListResponse {
  data: SystemLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserListResponse {
  data: SystemUser[];
  total: number;
  page: number;
  pageSize: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const settingsApi = {
  // 获取系统配置列表
  getConfigs: async (params: { page?: number; pageSize?: number; category?: string } = {}): Promise<ConfigListResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/settings/configs?${new URLSearchParams(params as any).toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('获取系统配置失败');
    }

    return response.json();
  },

  // 更新系统配置
  updateConfig: async (id: string, data: Partial<SystemConfigFormData>): Promise<SystemConfig> => {
    const response = await fetch(`${API_BASE_URL}/settings/configs/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('更新配置失败');
    }

    return response.json();
  },

  // 获取系统日志
  getLogs: async (params: { page?: number; pageSize?: number; level?: string; module?: string } = {}): Promise<LogListResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/settings/logs?${new URLSearchParams(params as any).toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('获取系统日志失败');
    }

    return response.json();
  },

  // 获取系统用户
  getUsers: async (params: { page?: number; pageSize?: number; role?: string; status?: string } = {}): Promise<UserListResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/settings/users?${new URLSearchParams(params as any).toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('获取用户列表失败');
    }

    return response.json();
  },

  // 更新用户状态
  updateUserStatus: async (id: string, status: 'active' | 'inactive'): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/settings/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('更新用户状态失败');
    }
  },

  // 删除用户
  deleteUser: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/settings/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('删除用户失败');
    }
  },
};