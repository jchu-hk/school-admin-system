import { http, HttpResponse, delay } from 'msw';

// 模拟延迟，模拟真实网络请求
const MOCK_DELAY = 500;

// 模拟用户数据
const mockUsers = [
  { id: '1', name: '张三', role: 'student', className: '一年级1班' },
  { id: '2', name: '李四', role: 'teacher', className: '一年级1班' },
  { id: '3', name: '王五', role: 'admin', className: '' },
];

// 模拟仪表盘统计数据
const mockDashboardStats = {
  students: 256,
  teachers: 32,
  courses: 48,
  attendance: 95,
};

// 模拟出勤趋势数据
const mockAttendanceTrend = [
  { name: '周一', value: 95 },
  { name: '周二', value: 92 },
  { name: '周三', value: 97 },
  { name: '周四', value: 90 },
  { name: '周五', value: 94 },
];

// 模拟请假统计数据
const mockLeaveStats = {
  totalLeaves: 15,
  pendingLeaves: 3,
  approvedLeaves: 10,
  rejectedLeaves: 2,
};

// API Handlers
export const handlers = [
  // 登录接口
  http.post('/api/auth/login', async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({
      requestId: 'req_' + Date.now(),
      success: true,
      data: {
        token: 'mock_token_' + Date.now(),
        user: mockUsers[0],
      },
    });
  }),

  // 仪表盘统计接口
  http.get('/api/dashboard/stats', async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({
      requestId: 'req_' + Date.now(),
      success: true,
      data: mockDashboardStats,
    });
  }),

  // 出勤趋势接口
  http.get('/api/dashboard/attendance-trend', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'week';
    const days = parseInt(url.searchParams.get('days') || (period === 'month' ? '30' : '7'));

    // 根据 days 参数返回不同的数据
    const weekData = [
      { name: '周一', value: 95 },
      { name: '周二', value: 92 },
      { name: '周三', value: 97 },
      { name: '周四', value: 90 },
      { name: '周五', value: 94 },
    ];
    const monthData = [
      { name: '1日', value: 91 },
      { name: '5日', value: 88 },
      { name: '10日', value: 95 },
      { name: '15日', value: 93 },
      { name: '20日', value: 89 },
      { name: '25日', value: 94 },
      { name: '30日', value: 96 },
    ];

    return HttpResponse.json({
      requestId: 'req_' + Date.now(),
      success: true,
      data: days > 7 ? monthData : weekData,
    });
  }),

  // 请假统计接口
  http.get('/api/dashboard/leave-stats', async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({
      requestId: 'req_' + Date.now(),
      success: true,
      data: mockLeaveStats,
    });
  }),

  // 用户列表接口
  http.get('/api/users', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    return HttpResponse.json({
      requestId: 'req_' + Date.now(),
      success: true,
      data: {
        users: mockUsers,
        total: mockUsers.length,
        page,
        limit,
      },
    });
  }),
];
