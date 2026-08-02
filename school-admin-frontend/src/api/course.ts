// 课程管理API接口定义
import { getToken } from '../utils/tokenService'
export interface Course {
  id: string;
  code: string;
  name: string;
  grade: string;
  subject: string;
  teacher: string;
  classId?: string;
  className?: string;
  classroom: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  status: 'active' | 'inactive';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFormData {
  code: string;
  name: string;
  grade: string;
  subject: string;
  teacher: string;
  classId?: string;
  className?: string;
  classroom: string;
  schedule: string;
  capacity: number;
  status: 'active' | 'inactive';
  description?: string;
}

export interface CourseListResponse {
  data: Course[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CourseQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  grade?: string;
  subject?: string;
  status?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// API_BASE_URL already ends with '/' (e.g. '/api/'), so paths must NOT have a leading '/'
const URL_BASE = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;

// Helper: remove undefined values from params before building query string
function buildQuery(params: Record<string, any>): string {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      clean[k] = String(v);
    }
  }
  return new URLSearchParams(clean).toString();
}

export const courseApi = {
  // 获取课程列表
  getList: async (params: CourseQueryParams = {}): Promise<CourseListResponse> => {
    const response = await fetch(
      `${URL_BASE}courses?${buildQuery(params as any)}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('获取课程列表失败');
    }

    return response.json();
  },

  // 获取课程详情
  getDetail: async (id: string): Promise<Course> => {
    const response = await fetch(`${URL_BASE}courses/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取课程详情失败');
    }

    return response.json();
  },

  // 创建课程
  create: async (data: CourseFormData): Promise<Course> => {
    const response = await fetch(`${URL_BASE}courses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('创建课程失败');
    }

    return response.json();
  },

  // 更新课程
  update: async (id: string, data: Partial<CourseFormData>): Promise<Course> => {
    const response = await fetch(`${URL_BASE}courses/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('更新课程失败');
    }

    return response.json();
  },

  // 删除课程
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${URL_BASE}courses/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('删除课程失败');
    }
  },
};