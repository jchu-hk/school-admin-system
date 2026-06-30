import { http, HttpResponse, delay } from 'msw';

const MOCK_DELAY = 300;

// ============ Types ============
interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

interface RecruitmentPosition {
  id: string;
  title: string;
  subject: string;
  employmentType: string;
  salaryRange: SalaryRange;
  location: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationDeadline: string;
  status: string;
  publishedAt?: string;
  closedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number };
}

interface EducationItem {
  degree: string;
  school: string;
  major: string;
  year: string;
}

interface ExperienceItem {
  company: string;
  position: string;
  duration: string;
  description?: string;
}

interface RecruitmentApplication {
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
  status: string;
  screeningNotes?: string;
  screenedBy?: string;
  screenedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface RecruitmentInterview {
  id: string;
  applicationId: string;
  application?: { applicantName: string; position: { title: string } };
  interviewDate: string;
  interviewers: string[];
  interviewType: string;
  meetingLink?: string;
  location?: string;
  durationMinutes: number;
  notes?: string;
  status: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  scores?: InterviewScore[];
}

interface InterviewScore {
  id: string;
  interviewId: string;
  interviewerId: string;
  interviewer?: { id: string; name: string };
  criterion: string;
  score: number;
  comment?: string;
  createdAt: string;
}

interface RecruitmentOffer {
  id: string;
  applicationId: string;
  application?: { applicantName: string; position: { title: string } };
  salary: number;
  startDate: string;
  position: string;
  benefitsPackage: Record<string, any>;
  status: string;
  sentAt: string;
  respondedAt?: string;
  signedDocumentUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface OnboardingItem {
  item: string;
  required: boolean;
  status: 'PENDING' | 'COMPLETED';
  completedAt?: string;
  documentUrl?: string;
}

interface RecruitmentOnboarding {
  id: string;
  offerId: string;
  offer?: { salary: number; startDate: string };
  teacherProfileId?: string;
  teacherProfile?: { id: string; name: string; email: string };
  checklist: OnboardingItem[];
  systemAccountCreated: boolean;
  role: string;
  defaultPermissions: string[];
  onboardingStatus: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Mock Data ============
const mockPositions: RecruitmentPosition[] = [
  {
    id: 'pos-001',
    title: '中文科教师',
    subject: '中文',
    employmentType: 'FULL_TIME',
    salaryRange: { min: 35000, max: 55000, currency: 'HKD' },
    location: '香港仔天后庙道',
    requirements: ['大学中文系毕业', '具教学经验优先', '熟悉DSE课程'],
    responsibilities: ['任教中文科', '编写教材', '参与科组活动'],
    benefits: ['医疗福利', '教师进修津贴', '公积金'],
    applicationDeadline: '2026-08-15',
    status: 'PUBLISHED',
    publishedAt: '2026-06-01T00:00:00Z',
    createdAt: '2026-05-20T08:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    _count: { applications: 12 },
  },
  {
    id: 'pos-002',
    title: '数学科教师',
    subject: '数学',
    employmentType: 'FULL_TIME',
    salaryRange: { min: 35000, max: 55000, currency: 'HKD' },
    location: '香港仔天后庙道',
    requirements: ['大学数学系毕业', '具DSE教学经验'],
    responsibilities: ['任教数学科', '筹办数学比赛'],
    benefits: ['医疗福利', '教师进修津贴'],
    applicationDeadline: '2026-08-20',
    status: 'PUBLISHED',
    publishedAt: '2026-06-05T00:00:00Z',
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-06-05T00:00:00Z',
    _count: { applications: 8 },
  },
  {
    id: 'pos-003',
    title: '英文科教师',
    subject: '英文',
    employmentType: 'FULL_TIME',
    salaryRange: { min: 38000, max: 60000, currency: 'HKD' },
    location: '香港仔天后庙道',
    requirements: ['英文系毕业', '雅思7.0分以上', '具国际学校经验优先'],
    responsibilities: ['任教英文科', '提升学生英语水平'],
    benefits: ['医疗福利', '语言津贴', '进修津贴'],
    applicationDeadline: '2026-07-30',
    status: 'DRAFT',
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-06-10T08:00:00Z',
    _count: { applications: 0 },
  },
  {
    id: 'pos-004',
    title: '体育科教师',
    subject: '体育',
    employmentType: 'CONTRACT',
    salaryRange: { min: 28000, max: 40000, currency: 'HKD' },
    location: '香港仔天后庙道',
    requirements: ['体育相关学位', '具备教练资格'],
    responsibilities: ['任教体育科', '组织校队训练'],
    benefits: ['医疗福利'],
    applicationDeadline: '2026-08-01',
    status: 'CLOSED',
    closedAt: '2026-06-25T00:00:00Z',
    publishedAt: '2026-06-01T00:00:00Z',
    createdAt: '2026-05-25T08:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    _count: { applications: 5 },
  },
];

const mockApplications: RecruitmentApplication[] = [
  {
    id: 'app-001',
    positionId: 'pos-001',
    position: { id: 'pos-001', title: '中文科教师', subject: '中文' },
    applicantName: '陈小明',
    email: 'chan@example.com',
    phone: '85291234567',
    cvUrl: '/uploads/cv/chan_xiaoming.pdf',
    coverLetter: '本人毕业于香港中文大学中文系...',
    education: [
      { degree: '文学学士', school: '香港中文大学', major: '中文', year: '2020' },
      { degree: '教育文凭', school: '香港教育大学', major: '中文教育', year: '2022' },
    ],
    experience: [
      { company: '英华女学校', position: '中文教师', duration: '2年', description: '任教中一至中六中文' },
    ],
    status: 'SHORTLISTED',
    screeningNotes: '学历符合，有教学经验',
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'app-002',
    positionId: 'pos-001',
    position: { id: 'pos-001', title: '中文科教师', subject: '中文' },
    applicantName: '林雅文',
    email: 'lam@example.com',
    phone: '85292345678',
    cvUrl: '/uploads/cv/lam_yawen.pdf',
    coverLetter: '本人热爱教育...',
    education: [
      { degree: '文学学士', school: '香港大学', major: '中文', year: '2019' },
    ],
    experience: [],
    status: 'NEW',
    createdAt: '2026-06-12T09:00:00Z',
    updatedAt: '2026-06-12T09:00:00Z',
  },
  {
    id: 'app-003',
    positionId: 'pos-001',
    position: { id: 'pos-001', title: '中文科教师', subject: '中文' },
    applicantName: '张志明',
    email: 'cheung@example.com',
    phone: '85293456789',
    education: [
      { degree: '学士', school: '岭南大学', major: '中文', year: '2018' },
    ],
    experience: [
      { company: '培英中学', position: '代课教师', duration: '1年', description: '临时带课' },
    ],
    status: 'INTERVIEW',
    screeningNotes: '安排面试',
    createdAt: '2026-06-08T11:00:00Z',
    updatedAt: '2026-06-18T14:00:00Z',
  },
  {
    id: 'app-004',
    positionId: 'pos-002',
    position: { id: 'pos-002', title: '数学科教师', subject: '数学' },
    applicantName: '王建国',
    email: 'wong@example.com',
    phone: '85294567890',
    cvUrl: '/uploads/cv/wong_jianguo.pdf',
    education: [
      { degree: '理学学士', school: '香港科技大学', major: '数学', year: '2021' },
    ],
    experience: [
      { company: '庇理罗女子中学', position: '数学教师', duration: '3年', description: '任教DSE数学' },
    ],
    status: 'SCREENING',
    createdAt: '2026-06-14T10:00:00Z',
    updatedAt: '2026-06-16T08:00:00Z',
  },
  {
    id: 'app-005',
    positionId: 'pos-004',
    position: { id: 'pos-004', title: '体育科教师', subject: '体育' },
    applicantName: '刘伟强',
    email: 'lau@example.com',
    phone: '85295678901',
    education: [
      { degree: '教育学士', school: '香港浸会大学', major: '体育教育', year: '2020' },
    ],
    experience: [
      { company: '圣公会中学', position: '体育教师', duration: '4年', description: '校队教练' },
    ],
    status: 'OFFER',
    createdAt: '2026-06-05T09:00:00Z',
    updatedAt: '2026-06-25T16:00:00Z',
  },
];

const mockInterviews: RecruitmentInterview[] = [
  {
    id: 'int-001',
    applicationId: 'app-003',
    application: { applicantName: '张志明', position: { title: '中文科教师' } },
    interviewDate: '2026-07-01T10:00:00+08:00',
    interviewers: ['张主任', '李副校长'],
    interviewType: 'ONSITE',
    location: '会议室A',
    durationMinutes: 45,
    notes: '试教环节：阅读理解教学',
    status: 'SCHEDULED',
    createdAt: '2026-06-20T08:00:00Z',
    updatedAt: '2026-06-20T08:00:00Z',
    scores: [],
  },
  {
    id: 'int-002',
    applicationId: 'app-005',
    application: { applicantName: '刘伟强', position: { title: '体育科教师' } },
    interviewDate: '2026-06-22T14:00:00+08:00',
    interviewers: ['张主任', '体育科组长'],
    interviewType: 'ONSITE',
    location: '体育馆',
    durationMinutes: 60,
    notes: '技能测试：篮球及田径',
    status: 'COMPLETED',
    createdAt: '2026-06-18T10:00:00Z',
    updatedAt: '2026-06-22T16:00:00Z',
    scores: [
      { id: 'sc-001', interviewId: 'int-002', interviewerId: 'u-001', interviewer: { id: 'u-001', name: '张主任' }, criterion: '教学能力', score: 4, comment: '试教表现良好', createdAt: '2026-06-22T16:00:00Z' },
      { id: 'sc-002', interviewId: 'int-002', interviewerId: 'u-002', interviewer: { id: 'u-002', name: '体育科组长' }, criterion: '教学能力', score: 5, comment: '专业能力强', createdAt: '2026-06-22T16:00:00Z' },
    ],
  },
];

const mockOffers: RecruitmentOffer[] = [
  {
    id: 'off-001',
    applicationId: 'app-005',
    application: { applicantName: '刘伟强', position: { title: '体育科教师' } },
    salary: 38000,
    startDate: '2026-09-01',
    position: '体育科教师',
    benefitsPackage: { medical: true, housing: false, bonus: '一个月' },
    status: 'ACCEPTED',
    sentAt: '2026-06-25T10:00:00Z',
    respondedAt: '2026-06-26T09:00:00Z',
    createdBy: 'u-001',
    createdAt: '2026-06-25T10:00:00Z',
    updatedAt: '2026-06-26T09:00:00Z',
  },
];

const mockOnboarding: RecruitmentOnboarding[] = [
  {
    id: 'onb-001',
    offerId: 'off-001',
    offer: { salary: 38000, startDate: '2026-09-01' },
    teacherProfileId: undefined,
    teacherProfile: undefined,
    checklist: [
      { item: '提交学历证书原件', required: true, status: 'PENDING' },
      { item: '提交身份证副本', required: true, status: 'PENDING' },
      { item: '填写入职登记表', required: true, status: 'PENDING' },
      { item: '签署保密协议', required: true, status: 'PENDING' },
      { item: '提供银行账户信息（发薪用）', required: true, status: 'PENDING' },
      { item: '参加新教师入职培训', required: true, status: 'PENDING' },
      { item: '领取工咭及门禁卡', required: true, status: 'PENDING' },
      { item: '加入学校电邮系统', required: false, status: 'PENDING' },
    ],
    systemAccountCreated: false,
    role: 'TEACHER',
    defaultPermissions: ['course.view', 'course.edit', 'attendance.view', 'student.view'],
    onboardingStatus: 'PENDING',
    createdAt: '2026-06-26T09:00:00Z',
    updatedAt: '2026-06-26T09:00:00Z',
  },
];

// ============ Mutable Stores ============
let positions = [...mockPositions];
let applications = [...mockApplications];
let interviews = [...mockInterviews];
let offers = [...mockOffers];
let onboardingList = [...mockOnboarding];

let positionIdCounter = 100;
let applicationIdCounter = 100;
let interviewIdCounter = 100;
let offerIdCounter = 100;
let onboardingIdCounter = 100;

export const recruitmentHandlers = [
  // ============ POSITIONS ============
  http.get('/api/recruitment/positions', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filtered = [...positions];
    if (status) filtered = filtered.filter(p => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    return HttpResponse.json({ positions: filtered.slice(start, start + limit), total });
  }),

  http.get('/api/recruitment/positions/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const pos = positions.find(p => p.id === params.id);
    if (!pos) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(pos);
  }),

  http.post('/api/recruitment/positions', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Partial<RecruitmentPosition>;
    const newPos: RecruitmentPosition = {
      id: `pos-${++positionIdCounter}`,
      title: body.title || '',
      subject: body.subject || '',
      employmentType: body.employmentType || 'FULL_TIME',
      salaryRange: body.salaryRange || { min: 0, max: 0, currency: 'HKD' },
      location: body.location || '',
      requirements: body.requirements || [],
      responsibilities: body.responsibilities || [],
      benefits: body.benefits || [],
      applicationDeadline: body.applicationDeadline || '',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { applications: 0 },
    };
    positions.unshift(newPos);
    return HttpResponse.json(newPos, { status: 201 });
  }),

  http.put('/api/recruitment/positions/:id', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const idx = positions.findIndex(p => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json() as Partial<RecruitmentPosition>;
    positions[idx] = { ...positions[idx], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json(positions[idx]);
  }),

  http.post('/api/recruitment/positions/:id/publish', async ({ params }) => {
    await delay(MOCK_DELAY);
    const idx = positions.findIndex(p => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    positions[idx] = { ...positions[idx], status: 'PUBLISHED', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return HttpResponse.json(positions[idx]);
  }),

  http.post('/api/recruitment/positions/:id/pause', async ({ params }) => {
    await delay(MOCK_DELAY);
    const idx = positions.findIndex(p => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    positions[idx] = { ...positions[idx], status: 'PAUSED', updatedAt: new Date().toISOString() };
    return HttpResponse.json(positions[idx]);
  }),

  http.post('/api/recruitment/positions/:id/close', async ({ params }) => {
    await delay(MOCK_DELAY);
    const idx = positions.findIndex(p => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    positions[idx] = { ...positions[idx], status: 'CLOSED', closedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return HttpResponse.json(positions[idx]);
  }),

  http.delete('/api/recruitment/positions/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const idx = positions.findIndex(p => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    if (positions[idx].status !== 'DRAFT') {
      return HttpResponse.json({ error: 'Only draft positions can be deleted' }, { status: 400 });
    }
    positions.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  // ============ APPLICATIONS ============
  http.get('/api/recruitment/applications', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const positionId = url.searchParams.get('positionId');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filtered = [...applications];
    if (positionId) filtered = filtered.filter(a => a.positionId === positionId);
    if (status) filtered = filtered.filter(a => a.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(a => a.applicantName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    return HttpResponse.json({ applications: filtered.slice(start, start + limit), total });
  }),

  http.get('/api/recruitment/applications/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const app = applications.find(a => a.id === params.id);
    if (!app) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(app);
  }),

  http.post('/api/recruitment/applications', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Partial<RecruitmentApplication>;
    const newApp: RecruitmentApplication = {
      id: `app-${++applicationIdCounter}`,
      positionId: body.positionId || '',
      applicantName: body.applicantName || '',
      email: body.email || '',
      phone: body.phone || '',
      cvUrl: body.cvUrl,
      coverLetter: body.coverLetter,
      education: body.education || [],
      experience: body.experience || [],
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    applications.unshift(newApp);
    // Update position count
    const posIdx = positions.findIndex(p => p.id === body.positionId);
    if (posIdx !== -1) positions[posIdx]._count!.applications++;
    return HttpResponse.json(newApp, { status: 201 });
  }),

  http.patch('/api/recruitment/applications/:id/status', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const idx = applications.findIndex(a => a.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json() as { status: string; notes?: string };
    applications[idx] = {
      ...applications[idx],
      status: body.status,
      screeningNotes: body.notes || applications[idx].screeningNotes,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(applications[idx]);
  }),

  // ============ INTERVIEWS ============
  http.get('/api/recruitment/interviews', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const applicationId = url.searchParams.get('applicationId');
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filtered = [...interviews];
    if (applicationId) filtered = filtered.filter(i => i.applicationId === applicationId);
    if (status) filtered = filtered.filter(i => i.status === status);
    filtered.sort((a, b) => new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    return HttpResponse.json({ interviews: filtered.slice(start, start + limit), total });
  }),

  http.get('/api/recruitment/interviews/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const interview = interviews.find(i => i.id === params.id);
    if (!interview) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(interview);
  }),

  http.post('/api/recruitment/interviews', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Partial<RecruitmentInterview>;
    const app = applications.find(a => a.id === body.applicationId);
    const newInterview: RecruitmentInterview = {
      id: `int-${++interviewIdCounter}`,
      applicationId: body.applicationId || '',
      application: app ? { applicantName: app.applicantName, position: { title: app.position?.title || '' } } : undefined,
      interviewDate: body.interviewDate || '',
      interviewers: body.interviewers || [],
      interviewType: body.interviewType || 'ONSITE',
      meetingLink: body.meetingLink,
      location: body.location,
      durationMinutes: body.durationMinutes || 60,
      notes: body.notes,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scores: [],
    };
    interviews.unshift(newInterview);
    // Update application status
    const appIdx = applications.findIndex(a => a.id === body.applicationId);
    if (appIdx !== -1) applications[appIdx].status = 'INTERVIEW';
    return HttpResponse.json(newInterview, { status: 201 });
  }),

  http.put('/api/recruitment/interviews/:id', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const idx = interviews.findIndex(i => i.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json() as Partial<RecruitmentInterview>;
    interviews[idx] = { ...interviews[idx], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json(interviews[idx]);
  }),

  http.post('/api/recruitment/interviews/:id/scores', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const idx = interviews.findIndex(i => i.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json() as { criterion: string; score: number; comment?: string };
    const newScore: InterviewScore = {
      id: `sc-${Date.now()}`,
      interviewId: params.id as string,
      interviewerId: 'current-user',
      criterion: body.criterion,
      score: body.score,
      comment: body.comment,
      createdAt: new Date().toISOString(),
    };
    if (!interviews[idx].scores) interviews[idx].scores = [];
    interviews[idx].scores!.push(newScore);
    return HttpResponse.json(newScore, { status: 201 });
  }),

  // ============ OFFERS ============
  http.get('/api/recruitment/offers', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filtered = [...offers];
    if (status) filtered = filtered.filter(o => o.status === status);
    filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    return HttpResponse.json({ offers: filtered.slice(start, start + limit), total });
  }),

  http.post('/api/recruitment/offers', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Partial<RecruitmentOffer>;
    const app = applications.find(a => a.id === body.applicationId);
    const newOffer: RecruitmentOffer = {
      id: `off-${++offerIdCounter}`,
      applicationId: body.applicationId || '',
      application: app ? { applicantName: app.applicantName, position: { title: app.position?.title || '' } } : undefined,
      salary: body.salary || 0,
      startDate: body.startDate || '',
      position: body.position || '',
      benefitsPackage: body.benefitsPackage || {},
      status: 'PENDING',
      sentAt: new Date().toISOString(),
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    offers.unshift(newOffer);
    // Update application status
    const appIdx = applications.findIndex(a => a.id === body.applicationId);
    if (appIdx !== -1) applications[appIdx].status = 'OFFER';
    return HttpResponse.json(newOffer, { status: 201 });
  }),

  http.patch('/api/recruitment/offers/:id/respond', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const idx = offers.findIndex(o => o.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json() as { status: string };
    offers[idx] = {
      ...offers[idx],
      status: body.status,
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // If accepted, create onboarding record
    if (body.status === 'ACCEPTED') {
      const newOnb: RecruitmentOnboarding = {
        id: `onb-${++onboardingIdCounter}`,
        offerId: params.id as string,
        offer: { salary: offers[idx].salary, startDate: offers[idx].startDate },
        checklist: [
          { item: '提交学历证书原件', required: true, status: 'PENDING' },
          { item: '提交身份证副本', required: true, status: 'PENDING' },
          { item: '填写入职登记表', required: true, status: 'PENDING' },
          { item: '签署保密协议', required: true, status: 'PENDING' },
          { item: '提供银行账户信息（发薪用）', required: true, status: 'PENDING' },
          { item: '参加新教师入职培训', required: true, status: 'PENDING' },
          { item: '领取工咭及门禁卡', required: true, status: 'PENDING' },
          { item: '加入学校电邮系统', required: false, status: 'PENDING' },
        ],
        systemAccountCreated: false,
        role: 'TEACHER',
        defaultPermissions: ['course.view', 'course.edit', 'attendance.view', 'student.view'],
        onboardingStatus: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onboardingList.unshift(newOnb);
    }
    return HttpResponse.json(offers[idx]);
  }),

  // ============ ONBOARDING ============
  http.get('/api/recruitment/onboarding', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filtered = [...onboardingList];
    if (status) filtered = filtered.filter(o => o.onboardingStatus === status);
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    return HttpResponse.json({ onboardingList: filtered.slice(start, start + limit), total });
  }),

  http.get('/api/recruitment/onboarding/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const onb = onboardingList.find(o => o.id === params.id);
    if (!onb) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(onb);
  }),

  http.put('/api/recruitment/onboarding/:id/checklist', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const idx = onboardingList.findIndex(o => o.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json() as { checklist: OnboardingItem[] };
    onboardingList[idx] = {
      ...onboardingList[idx],
      checklist: body.checklist,
      onboardingStatus: 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(onboardingList[idx]);
  }),

  http.post('/api/recruitment/onboarding/:id/create-account', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const idx = onboardingList.findIndex(o => o.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json() as { email: string; name: string };
    const newProfileId = `teacher-${Date.now()}`;
    onboardingList[idx] = {
      ...onboardingList[idx],
      teacherProfileId: newProfileId,
      teacherProfile: { id: newProfileId, name: body.name, email: body.email },
      systemAccountCreated: true,
      onboardingStatus: 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(onboardingList[idx]);
  }),

  http.post('/api/recruitment/onboarding/:id/complete', async ({ params }) => {
    await delay(MOCK_DELAY);
    const idx = onboardingList.findIndex(o => o.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    onboardingList[idx] = {
      ...onboardingList[idx],
      onboardingStatus: 'COMPLETED',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(onboardingList[idx]);
  }),
];
