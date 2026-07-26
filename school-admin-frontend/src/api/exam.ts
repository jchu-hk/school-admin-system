// 考试管理 API 接口定义

export enum ExamStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum ExamType {
  MIDTERM = 'midterm',
  FINAL = 'final',
  QUIZ = 'quiz',
  TEST = 'test',
  ORAL = 'oral',
  PRACTICAL = 'practical',
  OTHER = 'other',
}

export interface Exam {
  id: string;
  name: string;
  subject: string;
  examDate: string;
  startTime: string;
  endTime: string;
  classroom: string;
  classId?: string;
  className?: string;
  examType: ExamType;
  status: ExamStatus;
  invigilator?: string;
  totalMarks: number;
  passingMarks?: number;
  remark?: string;
  schoolId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamFormData {
  name: string;
  subject: string;
  examDate: string;
  startTime: string;
  endTime: string;
  classroom: string;
  classId?: string;
  className?: string;
  examType: ExamType;
  status: ExamStatus;
  invigilator?: string;
  totalMarks: number;
  passingMarks?: number;
  remark?: string;
}

export interface ExamListResponse {
  data: Exam[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExamQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  subject?: string;
  className?: string;
  status?: string;
  examType?: string;
  startDate?: string;
  endDate?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/';

export const examApi = {
  // 获取考试列表
  getList: async (params: ExamQueryParams = {}): Promise<ExamListResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/exams?${new URLSearchParams(params as any).toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('获取考试列表失败');
    }

    return response.json();
  },

  // 获取考试详情
  getDetail: async (id: string): Promise<Exam> => {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取考试详情失败');
    }

    return response.json();
  },

  // 创建考试
  create: async (data: ExamFormData): Promise<Exam> => {
    const response = await fetch(`${API_BASE_URL}/exams`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('创建考试失败');
    }

    return response.json();
  },

  // 更新考试
  update: async (id: string, data: Partial<ExamFormData>): Promise<Exam> => {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('更新考试失败');
    }

    return response.json();
  },

  // 更新考试状态
  updateStatus: async (id: string, status: ExamStatus): Promise<Exam> => {
    const response = await fetch(`${API_BASE_URL}/exams/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('更新考试状态失败');
    }

    return response.json();
  },

  // 删除考试
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('删除考试失败');
    }
  },

  // 获取考试统计
  getStats: async (): Promise<{
    total: number;
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/exams/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取考试统计失败');
    }

    return response.json();
  },
};

// 考试类型选项
export const EXAM_TYPE_OPTIONS = [
  { value: ExamType.MIDTERM, label: '期中考试', color: 'bg-blue-100 text-blue-800' },
  { value: ExamType.FINAL, label: '期末考试', color: 'bg-purple-100 text-purple-800' },
  { value: ExamType.QUIZ, label: '小测', color: 'bg-green-100 text-green-800' },
  { value: ExamType.TEST, label: '测验', color: 'bg-yellow-100 text-yellow-800' },
  { value: ExamType.ORAL, label: '口试', color: 'bg-pink-100 text-pink-800' },
  { value: ExamType.PRACTICAL, label: '实操', color: 'bg-indigo-100 text-indigo-800' },
  { value: ExamType.OTHER, label: '其他', color: 'bg-gray-100 text-gray-800' },
];

// 考试状态选项
export const EXAM_STATUS_OPTIONS = [
  { value: ExamStatus.SCHEDULED, label: '已安排', color: 'bg-blue-100 text-blue-700' },
  { value: ExamStatus.ONGOING, label: '进行中', color: 'bg-orange-100 text-orange-700' },
  { value: ExamStatus.COMPLETED, label: '已完成', color: 'bg-green-100 text-green-700' },
  { value: ExamStatus.CANCELLED, label: '已取消', color: 'bg-red-100 text-red-700' },
  { value: ExamStatus.POSTPONED, label: '已延期', color: 'bg-yellow-100 text-yellow-700' },
];
