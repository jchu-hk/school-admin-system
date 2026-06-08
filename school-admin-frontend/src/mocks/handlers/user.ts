import { http, HttpResponse, delay } from 'msw';

const MOCK_DELAY = 300;

// ============ Mock Data ============
export const mockStudents = [
  { id: '1', username: 'S001', name: '王小明', role: 'student', className: '1A', status: 'active', hkId: 'A123456(7)', phone: '85291234567', email: 'wang@example.com', whatsapp: '85291234567', otpEnabled: false, createdAt: '2024-01-15T08:00:00Z', updatedAt: '2024-01-15T08:00:00Z' },
  { id: '2', username: 'S002', name: '李小红', role: 'student', className: '1A', status: 'active', hkId: 'B234567(8)', phone: '85292345678', email: 'li@example.com', whatsapp: '85292345678', otpEnabled: false, createdAt: '2024-01-15T08:00:00Z', updatedAt: '2024-01-15T08:00:00Z' },
  { id: '3', username: 'S003', name: '张三分', role: 'student', className: '1B', status: 'active', hkId: 'C345678(9)', phone: '85293456789', email: 'zhang@example.com', whatsapp: '85293456789', otpEnabled: false, createdAt: '2024-01-16T08:00:00Z', updatedAt: '2024-01-16T08:00:00Z' },
  { id: '4', username: 'S004', name: '陈小四', role: 'student', className: '1B', status: 'inactive', hkId: 'D456789(0)', phone: '85294567890', email: 'chen@example.com', whatsapp: '85294567890', otpEnabled: false, createdAt: '2024-01-17T08:00:00Z', updatedAt: '2024-01-17T08:00:00Z' },
  { id: '5', username: 'S005', name: '刘小五', role: 'student', className: '2A', status: 'active', hkId: 'E567890(1)', phone: '85295678901', email: 'liu@example.com', whatsapp: '85295678901', otpEnabled: false, createdAt: '2024-01-18T08:00:00Z', updatedAt: '2024-01-18T08:00:00Z' },
  { id: '6', username: 'S006', name: '赵小六', role: 'student', className: '2A', status: 'active', hkId: 'F678901(2)', phone: '85296789012', email: 'zhao@example.com', whatsapp: '85296789012', otpEnabled: false, createdAt: '2024-01-19T08:00:00Z', updatedAt: '2024-01-19T08:00:00Z' },
  { id: '7', username: 'S007', name: '孙小七', role: 'student', className: '2B', status: 'disabled', hkId: 'G789012(3)', phone: '85297890123', email: 'sun@example.com', whatsapp: '85297890123', otpEnabled: false, createdAt: '2024-01-20T08:00:00Z', updatedAt: '2024-01-20T08:00:00Z' },
  { id: '8', username: 'S008', name: '周小八', role: 'student', className: '2B', status: 'active', hkId: 'H890123(4)', phone: '85298901234', email: 'zhou@example.com', whatsapp: '85298901234', otpEnabled: false, createdAt: '2024-01-21T08:00:00Z', updatedAt: '2024-01-21T08:00:00Z' },
];

export const mockTeachers = [
  { id: '101', username: 'T001', name: '张老师', role: 'teacher', className: '1A', status: 'active', hkId: 'K123456(1)', phone: '85260123456', email: 'zhang.teacher@example.com', whatsapp: '85260123456', otpEnabled: false, createdAt: '2023-09-01T08:00:00Z', updatedAt: '2023-09-01T08:00:00Z' },
  { id: '102', username: 'T002', name: '李老师', role: 'teacher', className: '1B', status: 'active', hkId: 'L234567(2)', phone: '85262345678', email: 'li.teacher@example.com', whatsapp: '85262345678', otpEnabled: false, createdAt: '2023-09-01T08:00:00Z', updatedAt: '2023-09-01T08:00:00Z' },
  { id: '103', username: 'T003', name: '王老师', role: 'teacher', className: '2A', status: 'active', hkId: 'M345678(3)', phone: '85263456789', email: 'wang.teacher@example.com', whatsapp: '85263456789', otpEnabled: false, createdAt: '2023-09-01T08:00:00Z', updatedAt: '2023-09-01T08:00:00Z' },
  { id: '104', username: 'T004', name: '陈老师', role: 'teacher', className: '2B', status: 'active', hkId: 'N456789(4)', phone: '85264567890', email: 'chen.teacher@example.com', whatsapp: '85264567890', otpEnabled: false, createdAt: '2023-09-01T08:00:00Z', updatedAt: '2023-09-01T08:00:00Z' },
];

// All users combined
const allUsers = [...mockStudents, ...mockTeachers];

export const mockRoles = [
  { id: '1', name: '学生', key: 'student', userCount: 8 },
  { id: '2', name: '教师', key: 'teacher', userCount: 4 },
  { id: '3', name: '家长', key: 'parent', userCount: 10 },
  { id: '4', name: '校务人员', key: 'school_staff', userCount: 3 },
  { id: '5', name: '校长', key: 'school_director', userCount: 1 },
  { id: '6', name: '系统管理员', key: 'system_admin', userCount: 1 },
];

export const mockPermissions = [
  { id: 'p1', name: '查看学生', key: 'student:read' },
  { id: 'p2', name: '管理学生', key: 'student:write' },
  { id: 'p3', name: '查看请假', key: 'leave:read' },
  { id: 'p4', name: '审批请假', key: 'leave:approve' },
  { id: 'p5', name: '发送通知', key: 'notification:send' },
  { id: 'p6', name: '管理用户', key: 'user:manage' },
];

// In-memory store for CRUD operations
let userStore = [...allUsers];
let idCounter = 200;

export const userHandlers = [
  // ============ GET /api/users ============
  http.get('/api/users', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const className = url.searchParams.get('className');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filtered = [...userStore];

    if (role) filtered = filtered.filter(u => u.role === role);
    if (className) filtered = filtered.filter(u => u.className === className);
    if (status) filtered = filtered.filter(u => u.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return HttpResponse.json({
      data,
      total,
      page,
      limit,
      totalPages,
    });
  }),

  // ============ GET /api/users/:id ============
  http.get('/api/users/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const user = userStore.find(u => u.id === params.id);
    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json({ data: user });
  }),

  // ============ POST /api/users ============
  http.post('/api/users', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const newUser = {
      id: String(++idCounter),
      username: body.username as string,
      name: body.name as string,
      role: body.role as string,
      status: body.status || 'active',
      className: body.className || '',
      hkId: body.hkId || '',
      phone: body.phone || '',
      email: body.email || '',
      whatsapp: body.whatsapp || '',
      otpEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    userStore.push(newUser);
    return HttpResponse.json({ data: newUser }, { status: 201 });
  }),

  // ============ PATCH /api/users/:id ============
  http.patch('/api/users/:id', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const index = userStore.findIndex(u => u.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    userStore[index] = {
      ...userStore[index],
      ...body,
      id: userStore[index].id,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: userStore[index] });
  }),

  // ============ DELETE /api/users/:id ============
  http.delete('/api/users/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = userStore.findIndex(u => u.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    userStore[index] = { ...userStore[index], status: 'disabled' };
    return HttpResponse.json({ data: { id: params.id } });
  }),

  // ============ GET /api/roles ============
  http.get('/api/roles', async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({ data: mockRoles });
  }),

  // ============ PATCH /api/roles/:id ============
  http.patch('/api/roles/:id', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const role = mockRoles.find(r => r.id === params.id);
    if (!role) return HttpResponse.json({ message: 'Role not found' }, { status: 404 });
    return HttpResponse.json({ data: { ...role, ...body } });
  }),

  // ============ POST /api/users/:id/reset-password ============
  http.post('/api/users/:id/reset-password', async ({ params }) => {
    await delay(MOCK_DELAY);
    const user = userStore.find(u => u.id === params.id);
    if (!user) return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    return HttpResponse.json({ data: { id: params.id, message: 'Password reset successfully' } });
  }),

  // ============ PATCH /api/users/:id/status ============
  http.patch('/api/users/:id/status', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const index = userStore.findIndex(u => u.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    userStore[index] = { ...userStore[index], status: body.status as string, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: userStore[index] });
  }),

  // ============ GET /api/users/search ============
  http.get('/api/users/search', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const results = userStore
      .filter(u => u.name.includes(q) || u.username.includes(q))
      .slice(0, 10)
      .map(u => ({ id: u.id, name: u.name, type: u.role }));
    return HttpResponse.json(results);
  }),
];
