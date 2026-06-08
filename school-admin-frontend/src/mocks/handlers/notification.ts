import { http, HttpResponse, delay } from 'msw';

const MOCK_DELAY = 300;

// ============ Types ============
interface Notification {
  id: string
  notificationNo: string
  title: string
  content: string
  type: string
  status: string
  channels: string[]
  recipientType: string
  recipientCount: number
  readCount: number
  senderId: string
  senderName: string
  scheduledAt?: string
  sentAt?: string
  createdAt: string
  updatedAt: string
}

interface NotificationTemplate {
  id: string
  name: string
  title: string
  content: string
  type: string
  variables: string[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface NotificationRecipient {
  id: string
  notificationId: string
  userId: string
  userName: string
  userType: string
  className?: string
  readStatus: string
  readAt?: string
}

// ============ Mock Data ============
const mockNotifications: Notification[] = [
  { id: '1', notificationNo: 'NOT202403001', title: '开学通知', content: '新学期将于3月4日正式开学，请家长提前做好准备。', type: 'system', status: 'sent', channels: ['app', 'email'], recipientType: 'all', recipientCount: 300, readCount: 250, senderId: 'admin1', senderName: '系统管理员', sentAt: '2024-02-28T10:00:00Z', createdAt: '2024-02-27T08:00:00Z', updatedAt: '2024-02-28T10:00:00Z' },
  { id: '2', notificationNo: 'NOT202403002', title: '运动会通知', content: '本校将于3月15日举办春季运动会，欢迎各位家长参加。', type: 'activity', status: 'sent', channels: ['app', 'sms'], recipientType: 'all', recipientCount: 300, readCount: 180, senderId: 'admin2', senderName: '教务处', sentAt: '2024-03-05T09:00:00Z', createdAt: '2024-03-04T08:00:00Z', updatedAt: '2024-03-05T09:00:00Z' },
  { id: '3', notificationNo: 'NOT202403003', title: '紧急通知：恶劣天气安排', content: '因台风来袭，明天停课一天，请家长注意安全。', type: 'urgent', status: 'sent', channels: ['app', 'sms', 'email'], recipientType: 'all', recipientCount: 300, readCount: 295, senderId: 'admin1', senderName: '系统管理员', sentAt: '2024-03-10T06:00:00Z', createdAt: '2024-03-10T06:00:00Z', updatedAt: '2024-03-10T06:00:00Z' },
  { id: '4', notificationNo: 'NOT202403004', title: '家长会通知', content: '本周五下午3点召开家长会，请各位家长准时参加。', type: 'activity', status: 'scheduled', channels: ['app'], recipientType: 'all', recipientCount: 300, scheduledAt: '2024-03-12T14:00:00Z', senderId: 'admin2', senderName: '教务处', createdAt: '2024-03-11T08:00:00Z', updatedAt: '2024-03-11T08:00:00Z' },
  { id: '5', notificationNo: 'NOT202403005', title: '流感预防通知', content: '近期流感高发，请家长注意孩子健康状况。', type: 'system', status: 'draft', channels: ['app'], recipientType: 'all', recipientCount: 0, readCount: 0, senderId: 'admin1', senderName: '系统管理员', createdAt: '2024-03-15T08:00:00Z', updatedAt: '2024-03-15T08:00:00Z' },
  { id: '6', notificationNo: 'NOT202403006', title: '一年级家长通知', content: '一年级近期活动安排，请家长关注。', type: 'system', status: 'sent', channels: ['app', 'sms'], recipientType: 'class', recipientCount: 50, readCount: 45, senderId: 'admin2', senderName: '教务处', sentAt: '2024-03-08T10:00:00Z', createdAt: '2024-03-07T08:00:00Z', updatedAt: '2024-03-08T10:00:00Z' },
];

const mockTemplates: NotificationTemplate[] = [
  { id: 't1', name: '开学通知模板', title: '开学通知', content: '{school_name}将于{start_date}正式开学，请家长提前做好准备。', type: 'system', variables: ['school_name', 'start_date'], isDefault: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 't2', name: '活动通知模板', title: '活动通知', content: '{activity_name}将于{activity_date}举行，欢迎参加。', type: 'activity', variables: ['activity_name', 'activity_date'], isDefault: false, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 't3', name: '紧急通知模板', title: '紧急通知', content: '紧急：{content}', type: 'urgent', variables: ['content'], isDefault: false, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

const mockRecipients: Record<string, NotificationRecipient[]> = {
  '1': [
    { id: 'rec1', notificationId: '1', userId: 'p1', userName: '王小明家长', userType: 'parent', readStatus: 'read', readAt: '2024-02-28T10:30:00Z' },
    { id: 'rec2', notificationId: '1', userId: 'p2', userName: '李小红家长', userType: 'parent', readStatus: 'read', readAt: '2024-02-28T11:00:00Z' },
  ],
  '3': [
    { id: 'rec3', notificationId: '3', userId: 'p1', userName: '王小明家长', userType: 'parent', readStatus: 'read', readAt: '2024-03-10T06:15:00Z' },
    { id: 'rec4', notificationId: '3', userId: 'p2', userName: '李小红家长', userType: 'parent', readStatus: 'unread' },
  ],
};

let notificationStore = [...mockNotifications];
let templateStore = [...mockTemplates];
let notificationIdCounter = 100;
let templateIdCounter = 100;

export const notificationHandlers = [
  // ============ GET /api/notifications ============
  http.get('/api/notifications', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    let filtered = [...notificationStore];

    if (type) filtered = filtered.filter(n => n.type === type);
    if (status) filtered = filtered.filter(n => n.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.notificationNo.toLowerCase().includes(q)
      );
    }
    if (startDate) filtered = filtered.filter(n => n.createdAt >= startDate);
    if (endDate) filtered = filtered.filter(n => n.createdAt <= endDate);

    // Sort by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return HttpResponse.json({ items, total });
  }),

  // ============ GET /api/notifications/:id ============
  http.get('/api/notifications/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const notification = notificationStore.find(n => n.id === params.id);
    if (!notification) {
      return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    }
    const recipients = mockRecipients[params.id as string] || [];
    return HttpResponse.json({
      ...notification,
      recipients,
      templates: templateStore,
    });
  }),

  // ============ POST /api/notifications ============
  http.post('/api/notifications', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const newNotification: Notification = {
      id: String(++notificationIdCounter),
      notificationNo: `NOT${new Date().getFullYear()}${String(notificationIdCounter).padStart(4, '0')}`,
      title: body.title as string,
      content: body.content as string,
      type: body.type as string,
      status: body.status as string || 'draft',
      channels: (body.channels as string[]) || ['app'],
      recipientType: body.recipientType as string || 'all',
      recipientCount: body.recipientCount as number || 0,
      readCount: 0,
      senderId: 'admin1',
      senderName: '系统管理员',
      scheduledAt: body.scheduledAt as string,
      sentAt: body.status === 'sent' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notificationStore.unshift(newNotification);
    return HttpResponse.json(newNotification, { status: 201 });
  }),

  // ============ PATCH /api/notifications/:id ============
  http.patch('/api/notifications/:id', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const index = notificationStore.findIndex(n => n.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    notificationStore[index] = {
      ...notificationStore[index],
      ...body,
      id: notificationStore[index].id,
      notificationNo: notificationStore[index].notificationNo,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(notificationStore[index]);
  }),

  // ============ DELETE /api/notifications/:id ============
  http.delete('/api/notifications/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = notificationStore.findIndex(n => n.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    notificationStore.splice(index, 1);
    return HttpResponse.json({ data: { id: params.id } });
  }),

  // ============ POST /api/notifications/:id/cancel ============
  http.post('/api/notifications/:id/cancel', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = notificationStore.findIndex(n => n.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    notificationStore[index] = {
      ...notificationStore[index],
      status: 'draft',
      scheduledAt: undefined,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(notificationStore[index]);
  }),

  // ============ POST /api/notifications/:id/resend ============
  http.post('/api/notifications/:id/resend', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = notificationStore.findIndex(n => n.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    notificationStore[index] = {
      ...notificationStore[index],
      status: 'sent',
      sentAt: new Date().toISOString(),
      readCount: 0,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(notificationStore[index]);
  }),

  // ============ GET /api/notifications/:id/stats ============
  http.get('/api/notifications/:id/stats', async ({ params }) => {
    await delay(MOCK_DELAY);
    const notification = notificationStore.find(n => n.id === params.id);
    if (!notification) return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    return HttpResponse.json({
      notificationId: params.id,
      recipientCount: notification.recipientCount,
      readCount: notification.readCount,
      deliveryRate: notification.recipientCount > 0
        ? Math.round((notification.readCount / notification.recipientCount) * 100)
        : 0,
    });
  }),

  // ============ GET /api/notifications/stats ============
  http.get('/api/notifications/stats', async () => {
    await delay(MOCK_DELAY);
    const total = notificationStore.length;
    const sent = notificationStore.filter(n => n.status === 'sent').length;
    const draft = notificationStore.filter(n => n.status === 'draft').length;
    const scheduled = notificationStore.filter(n => n.status === 'scheduled').length;
    const totalRecipients = notificationStore.reduce((sum, n) => sum + n.recipientCount, 0);
    const totalReads = notificationStore.reduce((sum, n) => sum + n.readCount, 0);
    return HttpResponse.json({
      total, sent, draft, scheduled,
      totalRecipients,
      totalReads,
      avgReadRate: totalRecipients > 0 ? Math.round((totalReads / totalRecipients) * 100) : 0,
    });
  }),

  // ============ GET /api/notifications/templates ============
  http.get('/api/notifications/templates', async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(templateStore);
  }),

  // ============ POST /api/notifications/templates ============
  http.post('/api/notifications/templates', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const newTemplate: NotificationTemplate = {
      id: String(++templateIdCounter),
      name: body.name as string,
      title: body.title as string,
      content: body.content as string,
      type: body.type as string,
      variables: (body.variables as string[]) || [],
      isDefault: (body.isDefault as boolean) || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templateStore.push(newTemplate);
    return HttpResponse.json(newTemplate, { status: 201 });
  }),

  // ============ PATCH /api/notifications/templates/:id ============
  http.patch('/api/notifications/templates/:id', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const index = templateStore.findIndex(t => t.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Template not found' }, { status: 404 });
    templateStore[index] = {
      ...templateStore[index],
      ...body,
      id: templateStore[index].id,
      createdAt: templateStore[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(templateStore[index]);
  }),

  // ============ DELETE /api/notifications/templates/:id ============
  http.delete('/api/notifications/templates/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = templateStore.findIndex(t => t.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Template not found' }, { status: 404 });
    templateStore.splice(index, 1);
    return HttpResponse.json({ data: { id: params.id } });
  }),

  // ============ GET /api/classes ============
  http.get('/api/classes', async () => {
    await delay(MOCK_DELAY);
    const classes = [
      { id: '1A', name: '1A', studentCount: 30 },
      { id: '1B', name: '1B', studentCount: 28 },
      { id: '2A', name: '2A', studentCount: 32 },
      { id: '2B', name: '2B', studentCount: 29 },
      { id: '3A', name: '3A', studentCount: 31 },
    ];
    return HttpResponse.json(classes);
  }),

  // ============ GET /api/roles ============
  http.get('/api/roles', async () => {
    await delay(MOCK_DELAY);
    const roles = [
      { id: 'student', name: '学生', userCount: 150 },
      { id: 'teacher', name: '教师', userCount: 30 },
      { id: 'parent', name: '家长', userCount: 200 },
    ];
    return HttpResponse.json(roles);
  }),
];
