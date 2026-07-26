// DSE成绩追踪API接口定义

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/';

// ==================== DSE Release ====================
export interface DseRelease {
  id: string;
  academicYear: string;
  releaseDate: string;
  releaseStatus: 'pending' | 'importing' | 'imported' | 'reviewed' | 'published';
  releaseYear: number;
  importDeadline?: string;
  reviewDeadline?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DseReleaseQuery {
  releaseStatus?: string;
  academicYear?: string;
  releaseYear?: number;
}

// ==================== DSE Result ====================
export interface DseResult {
  id: string;
  releaseId: string;
  studentId: string;
  studentName: string;
  className?: string;
  hkeaaCandidateNo?: string;
  chineseLevel: string;
  englishLevel: string;
  mathCompulsoryLevel: string;
  mathExtendedLevel?: string;
  liberalStudiesLevel: string;
  elective1Code?: string;
  elective1Name?: string;
  elective1Level?: string;
  elective2Code?: string;
  elective2Name?: string;
  elective2Level?: string;
  elective3Code?: string;
  elective3Name?: string;
  elective3Level?: string;
  bestFiveTotal?: number;
  resultStatus: 'pending' | 'imported' | 'review_requested' | 'review_in_progress' | 'review_completed' | 'published';
  publishedToParent: boolean;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportDseResult {
  releaseId: string;
  studentId: string;
  hkeaaCandidateNo: string;
  chineseLevel: string;
  englishLevel: string;
  mathCompulsoryLevel: string;
  mathExtendedLevel?: string;
  liberalStudiesLevel: string;
  elective1?: { subjectCode: string; subjectName: string; level: string };
  elective2?: { subjectCode: string; subjectName: string; level: string };
  elective3?: { subjectCode: string; subjectName: string; level: string };
}

// ==================== DSE Review ====================
export interface DseReview {
  id: string;
  dseResultId: string;
  applicantId: string;
  reviewType: 'view_recheck' | 'regrade';
  subjectName: string;
  reason: string;
  hkeaaFee?: number;
  status: 'pending' | 'approved' | 'rejected' | 'submitted_to_hkeaa' | 'hkeaa_reviewing' | 'hkeaa_completed' | 'result_updated';
  approverId?: string;
  approvalRemark?: string;
  hkeaaNewLevel?: string;
  hkeaaResultRemark?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Offer Tracking ====================
export interface DseOfferTracking {
  id: string;
  dseResultId: string;
  studentId: string;
  studentNameAnonymized: string;
  className?: string;
  jupasStatus: 'not_applied' | 'application_submitted' | 'band_a_offered' | 'band_b_offered' | 'band_c_offered' | 'confirmed' | 'conditional_offer' | 'rejected' | 'deferred' | 'withdrawn' | 'awaiting_result';
  jupasApplicationNo?: string;
  institutionAnonymized?: string;
  programAnonymized?: string;
  enrollmentYear?: number;
  offerDate?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Statistics ====================
export interface SubjectStats {
  subject: string;
  candidates: number;
  level5PlusPct: string;
  level4PlusPct: string;
  passRate: string;
  schoolAvg: string;
  hkeaaAvg: string;
}

export interface JupasStats {
  total: number;
  applied: number;
  offered: number;
  confirmed: number;
  notApplied: number;
}

export interface ReviewStats {
  total: number;
  pending: number;
  submitted: number;
  completed: number;
}

export interface DseStats {
  releaseId: string;
  academicYear: string;
  releaseDate: string;
  totalStudents: number;
  resultsReceived: number;
  resultsPending: number;
  publishedCount: number;
  bySubjectStats: SubjectStats[];
  classStats: Record<string, { avgBest5: number; count: number }>;
  jupasStats: JupasStats;
  reviewStats: ReviewStats;
}

// ==================== API Functions ====================

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json',
});

export const dseApi = {
  // ========== DSE Release ==========
  createRelease: async (data: Partial<DseRelease>): Promise<DseRelease> => {
    const response = await fetch(`${API_BASE_URL}/dse/releases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('创建放榜记录失败');
    return response.json();
  },

  getReleases: async (query?: DseReleaseQuery): Promise<DseRelease[]> => {
    const params = new URLSearchParams(query as any).toString();
    const response = await fetch(`${API_BASE_URL}/dse/releases?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取放榜记录失败');
    return response.json();
  },

  getRelease: async (id: string): Promise<DseRelease> => {
    const response = await fetch(`${API_BASE_URL}/dse/releases/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取放榜记录详情失败');
    return response.json();
  },

  updateRelease: async (id: string, data: Partial<DseRelease>): Promise<DseRelease> => {
    const response = await fetch(`${API_BASE_URL}/dse/releases/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('更新放榜记录失败');
    return response.json();
  },

  // ========== DSE Results ==========
  importResult: async (data: ImportDseResult): Promise<DseResult> => {
    const response = await fetch(`${API_BASE_URL}/dse/results`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('导入成绩失败');
    return response.json();
  },

  batchImport: async (releaseId: string, results: ImportDseResult[]): Promise<{ success: number; failed: number; errors: string[] }> => {
    const response = await fetch(`${API_BASE_URL}/dse/results/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ releaseId, results }),
    });
    if (!response.ok) throw new Error('批量导入失败');
    return response.json();
  },

  getResults: async (query?: { releaseId?: string; className?: string; resultStatus?: string }): Promise<DseResult[]> => {
    const params = new URLSearchParams(query as any).toString();
    const response = await fetch(`${API_BASE_URL}/dse/results?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取成绩列表失败');
    return response.json();
  },

  getResult: async (id: string): Promise<DseResult> => {
    const response = await fetch(`${API_BASE_URL}/dse/results/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取成绩详情失败');
    return response.json();
  },

  updateResult: async (id: string, data: Partial<DseResult>): Promise<DseResult> => {
    const response = await fetch(`${API_BASE_URL}/dse/results/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('更新成绩失败');
    return response.json();
  },

  publishResult: async (id: string): Promise<DseResult> => {
    const response = await fetch(`${API_BASE_URL}/dse/results/${id}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('发布成绩失败');
    return response.json();
  },

  // ========== DSE Reviews ==========
  createReview: async (data: Partial<DseReview>): Promise<DseReview> => {
    const response = await fetch(`${API_BASE_URL}/dse/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('创建覆核申请失败');
    return response.json();
  },

  getReviews: async (query?: { dseResultId?: string; status?: string }): Promise<DseReview[]> => {
    const params = new URLSearchParams(query as any).toString();
    const response = await fetch(`${API_BASE_URL}/dse/reviews?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取覆核列表失败');
    return response.json();
  },

  approveReview: async (id: string, approvalRemark?: string): Promise<DseReview> => {
    const response = await fetch(`${API_BASE_URL}/dse/reviews/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approvalRemark }),
    });
    if (!response.ok) throw new Error('审批覆核失败');
    return response.json();
  },

  // ========== Offer Tracking ==========
  createOffer: async (data: Partial<DseOfferTracking>): Promise<DseOfferTracking> => {
    const response = await fetch(`${API_BASE_URL}/dse/offers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('创建升学记录失败');
    return response.json();
  },

  getOffers: async (query?: { dseResultId?: string; className?: string; jupasStatus?: string }): Promise<DseOfferTracking[]> => {
    const params = new URLSearchParams(query as any).toString();
    const response = await fetch(`${API_BASE_URL}/dse/offers?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取升学记录失败');
    return response.json();
  },

  updateOffer: async (id: string, data: Partial<DseOfferTracking>): Promise<DseOfferTracking> => {
    const response = await fetch(`${API_BASE_URL}/dse/offers/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('更新升学记录失败');
    return response.json();
  },

  // ========== Statistics ==========
  getStats: async (releaseId: string): Promise<DseStats> => {
    const response = await fetch(`${API_BASE_URL}/dse/stats/${releaseId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('获取统计失败');
    return response.json();
  },
};

export default dseApi;
