import { http, HttpResponse, delay } from 'msw';

const MOCK_DELAY = 300;

// ============ Types ============
interface User {
  id: string
  username: string
  name: string
  role: string
}

interface Leave {
  id: string
  applicantId: string
  applicant?: User
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  approverId?: string
  approver?: User
  approvedAt?: string
  approverComment?: string
  createdAt: string
  updatedAt: string
  attachments?: { id: string; name: string; url: string }[]
}

// ============ Mock Data ============
const mockUsers: User[] = [
  { id: '1', username: 'S001', name: '王小明', role: 'student' },
  { id: '2', username: 'S002', name: '李小红', role: 'student' },
  { id: '101', username: 'T001', name: '张老师', role: 'teacher' },
  { id: '102', username: 'T002', name: '李老师', role: 'teacher' },
];

const mockLeaves: Leave[] = [
  { id: '1', applicantId: '1', applicant: mockUsers[0], leaveType: 'sick_leave', startDate: '2024-03-01', endDate: '2024-03-02', reason: '发烧感冒', status: 'approved', approverId: '101', approver: mockUsers[2], approvedAt: '2024-02-28T10:00:00Z', approverComment: '注意休息', createdAt: '2024-02-27T08:00:00Z', updatedAt: '2024-02-28T10:00:00Z' },
  { id: '2', applicantId: '2', applicant: mockUsers[1], leaveType: 'personal_leave', startDate: '2024-03-05', endDate: '2024-03-05', reason: '家庭事务', status: 'pending', createdAt: '2024-03-01T08:00:00Z', updatedAt: '2024-03-01T08:00:00Z' },
  { id: '3', applicantId: '1', applicant: mockUsers[0], leaveType: 'sick_leave', startDate: '2024-02-20', endDate: '2024-02-21', reason: '肠胃不适', status: 'rejected', approverId: '101', approver: mockUsers[2], approvedAt: '2024-02-19T14:00:00Z', approverComment: '需提供医生证明', createdAt: '2024-02-18T08:00:00Z', updatedAt: '2024-02-19T14:00:00Z' },
  { id: '4', applicantId: '101', applicant: mockUsers[2], leaveType: 'personal_leave', startDate: '2024-03-10', endDate: '2024-03-12', reason: '出差培训', status: 'approved', approverId: '102', approver: mockUsers[3], approvedAt: '2024-03-05T09:00:00Z', approverComment: '批准', createdAt: '2024-03-04T08:00:00Z', updatedAt: '2024-03-05T09:00:00Z' },
  { id: '5', applicantId: '2', applicant: mockUsers[1], leaveType: 'sick_leave', startDate: '2024-02-15', endDate: '2024-02-16', reason: '牙科就诊', status: 'cancelled', createdAt: '2024-02-14T08:00:00Z', updatedAt: '2024-02-14T12:00:00Z' },
  { id: '6', applicantId: '1', applicant: mockUsers[0], leaveType: 'personal_leave', startDate: '2024-03-20', endDate: '2024-03-20', reason: '参加比赛', status: 'pending', createdAt: '2024-03-15T08:00:00Z', updatedAt: '2024-03-15T08:00:00Z' },
];

let leaveStore = [...mockLeaves];
let leaveIdCounter = 100;

export const leaveHandlers = [
  // ============ GET /api/leaves ============
  http.get('/api/leaves', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const leaveType = url.searchParams.get('leaveType');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filtered = [...leaveStore];

    if (status) filtered = filtered.filter(l => l.status === status);
    if (leaveType) filtered = filtered.filter(l => l.leaveType === leaveType);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l =>
        l.applicant?.name.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    const leaves = filtered.slice(start, start + limit);

    return HttpResponse.json({ leaves, total, page, limit });
  }),

  // ============ GET /api/leaves/:id ============
  http.get('/api/leaves/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const leave = leaveStore.find(l => l.id === params.id);
    if (!leave) {
      return HttpResponse.json({ message: 'Leave not found' }, { status: 404 });
    }
    return HttpResponse.json({ data: leave });
  }),

  // ============ POST /api/leaves ============
  http.post('/api/leaves', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const applicant = mockUsers.find(u => u.id === (body.applicantId as string)) || mockUsers[0];
    const newLeave: Leave = {
      id: String(++leaveIdCounter),
      applicantId: body.applicantId as string || '1',
      applicant,
      leaveType: body.leaveType as string,
      startDate: body.startDate as string,
      endDate: body.endDate as string,
      reason: body.reason as string,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: [],
    };
    leaveStore.push(newLeave);
    return HttpResponse.json({ data: newLeave }, { status: 201 });
  }),

  // ============ POST /api/leaves/:id/approve ============
  http.post('/api/leaves/:id/approve', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const index = leaveStore.findIndex(l => l.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Leave not found' }, { status: 404 });
    leaveStore[index] = {
      ...leaveStore[index],
      status: 'approved',
      approverId: '101',
      approver: mockUsers[2],
      approvedAt: new Date().toISOString(),
      approverComment: body.comment as string || '',
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: leaveStore[index] });
  }),

  // ============ POST /api/leaves/:id/reject ============
  http.post('/api/leaves/:id/reject', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const index = leaveStore.findIndex(l => l.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Leave not found' }, { status: 404 });
    leaveStore[index] = {
      ...leaveStore[index],
      status: 'rejected',
      approverId: '101',
      approver: mockUsers[2],
      approvedAt: new Date().toISOString(),
      approverComment: body.comment as string || '',
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: leaveStore[index] });
  }),

  // ============ POST /api/leaves/:id/cancel ============
  http.post('/api/leaves/:id/cancel', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = leaveStore.findIndex(l => l.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Leave not found' }, { status: 404 });
    leaveStore[index] = {
      ...leaveStore[index],
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: leaveStore[index] });
  }),

  // ============ DELETE /api/leaves/:id ============
  http.delete('/api/leaves/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = leaveStore.findIndex(l => l.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Leave not found' }, { status: 404 });
    leaveStore.splice(index, 1);
    return HttpResponse.json({ data: { id: params.id } });
  }),
];
