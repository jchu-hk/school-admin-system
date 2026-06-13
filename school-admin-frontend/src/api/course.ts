// 课程管理API接口定义
export interface Course {
  id: string;
  code: string;
  name: string;
  grade: string;
  subject: string;
  teacher: string;
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const courseApi = {
  // 获取课程列表
  getList: async (params: CourseQueryParams = {}): Promise<CourseListResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/courses?${new URLSearchParams(params as any).toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
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
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取课程详情失败');
    }

    return response.json();
  },

  // 创建课程
  create: async (data: CourseFormData): Promise<Course> => {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
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
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
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
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('删除课程失败');
    }
  },
};