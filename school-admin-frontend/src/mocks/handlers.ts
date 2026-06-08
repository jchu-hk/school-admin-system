import { http, HttpResponse, delay } from 'msw';
import { userHandlers } from './handlers/user';
import { leaveHandlers } from './handlers/leave';
import { inquiryHandlers } from './handlers/inquiry';
import { notificationHandlers } from './handlers/notification';

// 模拟延迟，模拟真实网络请求
const MOCK_DELAY = 500;

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

// 登录处理 - 单独保留（dashboard和auth不需要拆分文件）
const authHandlers = [
  // 登录接口
  http.post('/api/auth/login', async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({
      requestId: 'req_' + Date.now(),
      success: true,
      data: {
        token: 'mock_token_' + Date.now(),
        user: { id: '1', name: '管理员', role: 'system_admin' },
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

    return HttpResponse.json({
      requestId: 'req_' + Date.now(),
      success: true,
      data: mockAttendanceTrend,
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
];

// 合并所有 handlers
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...leaveHandlers,
  ...inquiryHandlers,
  ...notificationHandlers,
];
