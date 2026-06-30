import apiClient from './client';

// ============ Enums ============
export enum PositionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
}

export enum ApplicationStatus {
  NEW = 'NEW',
  SCREENING = 'SCREENING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  REJECTED = 'REJECTED',
  OFFER = 'OFFER',
}

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum InterviewType {
  ONLINE = 'ONLINE',
  ONSITE = 'ONSITE',
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  SIGNED = 'SIGNED',
}

export enum OnboardingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// ============ Types ============
export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface RecruitmentPosition {
  id: string;
  title: string;
  subject: string;
  employmentType: EmploymentType;
  salaryRange: SalaryRange;
  location: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationDeadline: string;
  status: PositionStatus;
  publishedAt?: string;
  closedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number };
}

export interface RecruitmentApplication {
  id: string;
  positionId: string;
  position?: { id: string; title: string; subject: string };
  applicantName: string;
  email: string;
  phone: string;
  cvUrl?: string;
  coverLetter?: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  status: ApplicationStatus;
  screeningNotes?: string;
  screenedBy?: string;
  screenedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EducationItem {
  degree: string;
  school: string;
  major: string;
  year: string;
}

export interface ExperienceItem {
  company: string;
  position: string;
  duration: string;
  description?: string;
}

export interface RecruitmentInterview {
  id: string;
  applicationId: string;
  application?: { applicantName: string; position: { title: string } };
  interviewDate: string;
  interviewers: string[];
  interviewType: InterviewType;
  meetingLink?: string;
  location?: string;
  durationMinutes: number;
  notes?: string;
  status: InterviewStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  scores?: InterviewScore[];
}

export interface InterviewScore {
  id: string;
  interviewId: string;
  interviewerId: string;
  interviewer?: { id: string; name: string };
  criterion: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface RecruitmentOffer {
  id: string;
  applicationId: string;
  application?: { applicantName: string; position: { title: string } };
  salary: number;
  startDate: string;
  position: string;
  benefitsPackage: Record<string, any>;
  status: OfferStatus;
  sentAt: string;
  respondedAt?: string;
  signedDocumentUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingItem {
  item: string;
  required: boolean;
  status: 'PENDING' | 'COMPLETED';
  completedAt?: string;
  documentUrl?: string;
}

export interface RecruitmentOnboarding {
  id: string;
  offerId: string;
  offer?: { salary: number; startDate: string };
  teacherProfileId?: string;
  teacherProfile?: { id: string; name: string; email: string };
  checklist: OnboardingItem[];
  systemAccountCreated: boolean;
  role: string;
  defaultPermissions: string[];
  onboardingStatus: OnboardingStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ API Functions ============

// --- Positions ---
export const recruitmentApi = {
  // GET /api/recruitment/positions
  getPositions: async (params?: {
    status?: PositionStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ positions: RecruitmentPosition[]; total: number }> => {
    const res = await apiClient.get('/api/recruitment/positions', { params });
    return res.data;
  },

  // GET /api/recruitment/positions/:id
  getPosition: async (id: string): Promise<RecruitmentPosition> => {
    const res = await apiClient.get(`/api/recruitment/positions/${id}`);
    return res.data;
  },

  // POST /api/recruitment/positions
  createPosition: async (data: Partial<RecruitmentPosition>): Promise<RecruitmentPosition> => {
    const res = await apiClient.post('/api/recruitment/positions', data);
    return res.data;
  },

  // PUT /api/recruitment/positions/:id
  updatePosition: async (id: string, data: Partial<RecruitmentPosition>): Promise<RecruitmentPosition> => {
    const res = await apiClient.put(`/api/recruitment/positions/${id}`, data);
    return res.data;
  },

  // POST /api/recruitment/positions/:id/publish
  publishPosition: async (id: string): Promise<RecruitmentPosition> => {
    const res = await apiClient.post(`/api/recruitment/positions/${id}/publish`);
    return res.data;
  },

  // POST /api/recruitment/positions/:id/pause
  pausePosition: async (id: string): Promise<RecruitmentPosition> => {
    const res = await apiClient.post(`/api/recruitment/positions/${id}/pause`);
    return res.data;
  },

  // POST /api/recruitment/positions/:id/close
  closePosition: async (id: string): Promise<RecruitmentPosition> => {
    const res = await apiClient.post(`/api/recruitment/positions/${id}/close`);
    return res.data;
  },

  // DELETE /api/recruitment/positions/:id
  deletePosition: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/recruitment/positions/${id}`);
  },

  // --- Applications ---
  // GET /api/recruitment/applications
  getApplications: async (params?: {
    positionId?: string;
    status?: ApplicationStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ applications: RecruitmentApplication[]; total: number }> => {
    const res = await apiClient.get('/api/recruitment/applications', { params });
    return res.data;
  },

  // GET /api/recruitment/applications/:id
  getApplication: async (id: string): Promise<RecruitmentApplication> => {
    const res = await apiClient.get(`/api/recruitment/applications/${id}`);
    return res.data;
  },

  // POST /api/recruitment/applications (public portal)
  submitApplication: async (data: Partial<RecruitmentApplication>): Promise<RecruitmentApplication> => {
    const res = await apiClient.post('/api/recruitment/applications', data);
    return res.data;
  },

  // PATCH /api/recruitment/applications/:id/status
  updateApplicationStatus: async (
    id: string,
    status: ApplicationStatus,
    notes?: string
  ): Promise<RecruitmentApplication> => {
    const res = await apiClient.patch(`/api/recruitment/applications/${id}/status`, { status, notes });
    return res.data;
  },

  // --- Interviews ---
  // GET /api/recruitment/interviews
  getInterviews: async (params?: {
    applicationId?: string;
    status?: InterviewStatus;
    page?: number;
    limit?: number;
  }): Promise<{ interviews: RecruitmentInterview[]; total: number }> => {
    const res = await apiClient.get('/api/recruitment/interviews', { params });
    return res.data;
  },

  // GET /api/recruitment/interviews/:id
  getInterview: async (id: string): Promise<RecruitmentInterview> => {
    const res = await apiClient.get(`/api/recruitment/interviews/${id}`);
    return res.data;
  },

  // POST /api/recruitment/interviews
  createInterview: async (data: Partial<RecruitmentInterview>): Promise<RecruitmentInterview> => {
    const res = await apiClient.post('/api/recruitment/interviews', data);
    return res.data;
  },

  // PUT /api/recruitment/interviews/:id
  updateInterview: async (id: string, data: Partial<RecruitmentInterview>): Promise<RecruitmentInterview> => {
    const res = await apiClient.put(`/api/recruitment/interviews/${id}`, data);
    return res.data;
  },

  // POST /api/recruitment/interviews/:id/scores
  submitInterviewScore: async (
    interviewId: string,
    data: { criterion: string; score: number; comment?: string }
  ): Promise<InterviewScore> => {
    const res = await apiClient.post(`/api/recruitment/interviews/${interviewId}/scores`, data);
    return res.data;
  },

  // --- Offers ---
  // GET /api/recruitment/offers
  getOffers: async (params?: {
    status?: OfferStatus;
    page?: number;
    limit?: number;
  }): Promise<{ offers: RecruitmentOffer[]; total: number }> => {
    const res = await apiClient.get('/api/recruitment/offers', { params });
    return res.data;
  },

  // POST /api/recruitment/offers
  createOffer: async (data: Partial<RecruitmentOffer>): Promise<RecruitmentOffer> => {
    const res = await apiClient.post('/api/recruitment/offers', data);
    return res.data;
  },

  // PATCH /api/recruitment/offers/:id/respond
  respondToOffer: async (
    id: string,
    status: 'ACCEPTED' | 'DECLINED'
  ): Promise<RecruitmentOffer> => {
    const res = await apiClient.patch(`/api/recruitment/offers/${id}/respond`, { status });
    return res.data;
  },

  // --- Onboarding ---
  // GET /api/recruitment/onboarding
  getOnboardingList: async (params?: {
    status?: OnboardingStatus;
    page?: number;
    limit?: number;
  }): Promise<{ onboardingList: RecruitmentOnboarding[]; total: number }> => {
    const res = await apiClient.get('/api/recruitment/onboarding', { params });
    return res.data;
  },

  // GET /api/recruitment/onboarding/:id
  getOnboarding: async (id: string): Promise<RecruitmentOnboarding> => {
    const res = await apiClient.get(`/api/recruitment/onboarding/${id}`);
    return res.data;
  },

  // PUT /api/recruitment/onboarding/:id/checklist
  updateOnboardingChecklist: async (
    id: string,
    checklist: OnboardingItem[]
  ): Promise<RecruitmentOnboarding> => {
    const res = await apiClient.put(`/api/recruitment/onboarding/${id}/checklist`, { checklist });
    return res.data;
  },

  // POST /api/recruitment/onboarding/:id/create-account
  createTeacherAccount: async (
    id: string,
    data: { email: string; name: string }
  ): Promise<RecruitmentOnboarding> => {
    const res = await apiClient.post(`/api/recruitment/onboarding/${id}/create-account`, data);
    return res.data;
  },

  // POST /api/recruitment/onboarding/:id/complete
  completeOnboarding: async (id: string): Promise<RecruitmentOnboarding> => {
    const res = await apiClient.post(`/api/recruitment/onboarding/${id}/complete`);
    return res.data;
  },
};

export default recruitmentApi;
