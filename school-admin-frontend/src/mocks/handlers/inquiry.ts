import { http, HttpResponse, delay } from 'msw';

const MOCK_DELAY = 300;

// ============ Types ============
interface Inquiry {
  id: string
  inquiryNo: string
  type: string
  title: string
  content: string
  status: string
  priority: string
  submitterId: string
  submitterName: string
  submitterEmail?: string
  submitterPhone?: string
  studentName?: string
  studentClass?: string
  createdAt: string
  updatedAt: string
  repliedAt?: string
  closedAt?: string
  handlerId?: string
  handlerName?: string
  replyCount: number
  attachments?: { id: string; fileName: string; fileUrl: string }[]
  hasRating?: boolean
  rating?: number
  ratingComment?: string
}

interface InquiryReply {
  id: string
  inquiryId: string
  content: string
  senderId: string
  senderName: string
  senderRole: string
  createdAt: string
  attachments?: { id: string; fileName: string; fileUrl: string }[]
  isInternal?: boolean
}

// ============ Mock Data ============
const mockInquiries: Inquiry[] = [
  { id: '1', inquiryNo: 'INQ202403001', type: 'fee', title: '关于学费收据问题', content: '请问学费收据什么时候可以领取？', status: 'replied', priority: 'normal', submitterId: 'p1', submitterName: '王小明家长', submitterEmail: 'parent@example.com', studentName: '王小明', studentClass: '1A', createdAt: '2024-03-01T08:00:00Z', updatedAt: '2024-03-02T10:00:00Z', repliedAt: '2024-03-02T10:00:00Z', handlerId: 's1', handlerName: '校务处', replyCount: 1, hasRating: true, rating: 5, ratingComment: '回复很及时' },
  { id: '2', inquiryNo: 'INQ202403002', type: 'bus', title: '校车路线咨询', content: '请问有经过将军澳的校车吗？', status: 'pending', priority: 'normal', submitterId: 'p2', submitterName: '李小红家长', submitterEmail: 'li.parent@example.com', studentName: '李小红', studentClass: '1B', createdAt: '2024-03-05T09:00:00Z', updatedAt: '2024-03-05T09:00:00Z', replyCount: 0 },
  { id: '3', inquiryNo: 'INQ202403003', type: 'grade', title: '期中考试成绩查询', content: '请问如何查询孩子的期中考试成绩？', status: 'replied', priority: 'urgent', submitterId: 'p3', submitterName: '张三分家长', submitterEmail: 'zhang.parent@example.com', studentName: '张三分', studentClass: '2A', createdAt: '2024-03-10T14:00:00Z', updatedAt: '2024-03-11T08:00:00Z', repliedAt: '2024-03-11T08:00:00Z', handlerId: 's1', handlerName: '教务处', replyCount: 2 },
  { id: '4', inquiryNo: 'INQ202403004', type: 'leave', title: '请假流程咨询', content: '孩子生病需要请假，请问流程是什么？', status: 'closed', priority: 'normal', submitterId: 'p4', submitterName: '陈小四家长', submitterEmail: 'chen.parent@example.com', studentName: '陈小四', studentClass: '1A', createdAt: '2024-02-20T10:00:00Z', updatedAt: '2024-02-22T16:00:00Z', repliedAt: '2024-02-21T09:00:00Z', closedAt: '2024-02-22T16:00:00Z', handlerId: 's1', handlerName: '校务处', replyCount: 3, hasRating: true, rating: 4 },
  { id: '5', inquiryNo: 'INQ202403005', type: 'other', title: '课外活动报名', content: '请问下学期的课外活动什么时候开始报名？', status: 'pending', priority: 'normal', submitterId: 'p1', submitterName: '王小明家长', submitterEmail: 'parent@example.com', studentName: '王小明', studentClass: '1A', createdAt: '2024-03-15T11:00:00Z', updatedAt: '2024-03-15T11:00:00Z', replyCount: 0 },
];

const mockReplies: Record<string, InquiryReply[]> = {
  '1': [
    { id: 'r1', inquiryId: '1', content: '学费收据将于3月15日后可在校务处领取。', senderId: 's1', senderName: '校务处', senderRole: 'staff', createdAt: '2024-03-02T10:00:00Z' },
  ],
  '3': [
    { id: 'r2', inquiryId: '3', content: '期中考试成绩将于本周五公布，请关注学校通知。', senderId: 's2', senderName: '教务处', senderRole: 'staff', createdAt: '2024-03-11T08:00:00Z' },
    { id: 'r3', inquiryId: '3', content: '（内部备注）请确保成绩录入系统完成', senderId: 's2', senderName: '教务处', senderRole: 'staff', createdAt: '2024-03-11T08:05:00Z', isInternal: true },
  ],
  '4': [
    { id: 'r4', inquiryId: '4', content: '请通过学校系统提交请假申请，或联系班主任。', senderId: 's1', senderName: '校务处', senderRole: 'staff', createdAt: '2024-02-21T09:00:00Z' },
    { id: 'r5', inquiryId: '4', content: '好的，谢谢！', senderId: 'p4', senderName: '陈小四家长', senderRole: 'parent', createdAt: '2024-02-21T14:00:00Z' },
    { id: 'r6', inquiryId: '4', content: '不客气，如有其他问题请随时联系。', senderId: 's1', senderName: '校务处', senderRole: 'staff', createdAt: '2024-02-22T16:00:00Z' },
  ],
};

let inquiryStore = [...mockInquiries];
let inquiryIdCounter = 100;
let replyIdCounter = 200;

export const inquiryHandlers = [
  // ============ GET /api/inquiries ============
  http.get('/api/inquiries', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    let filtered = [...inquiryStore];

    if (type) filtered = filtered.filter(i => i.type === type);
    if (status) filtered = filtered.filter(i => i.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q) ||
        i.submitterName.toLowerCase().includes(q) ||
        i.inquiryNo.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return HttpResponse.json({ items, total });
  }),

  // ============ GET /api/inquiries/pending ============
  http.get('/api/inquiries/pending', async () => {
    await delay(MOCK_DELAY);
    const pending = inquiryStore.filter(i => i.status === 'pending');
    return HttpResponse.json(pending);
  }),

  // ============ GET /api/inquiries/:id ============
  http.get('/api/inquiries/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const inquiry = inquiryStore.find(i => i.id === params.id);
    if (!inquiry) {
      return HttpResponse.json({ message: 'Inquiry not found' }, { status: 404 });
    }
    return HttpResponse.json(inquiry);
  }),

  // ============ POST /api/inquiries ============
  http.post('/api/inquiries', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const newInquiry: Inquiry = {
      id: String(++inquiryIdCounter),
      inquiryNo: `INQ${new Date().getFullYear()}${String(inquiryIdCounter).padStart(4, '0')}`,
      type: body.type as string,
      title: body.title as string,
      content: body.content as string,
      priority: (body.priority as string) || 'normal',
      status: 'pending',
      submitterId: 'p1',
      submitterName: '家长用户',
      submitterEmail: (body.submitterEmail as string) || '',
      studentName: (body.studentName as string) || '',
      studentClass: (body.studentClass as string) || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replyCount: 0,
      attachments: [],
    };
    inquiryStore.push(newInquiry);
    return HttpResponse.json(newInquiry, { status: 201 });
  }),

  // ============ GET /api/inquiries/:id/replies ============
  http.get('/api/inquiries/:id/replies', async ({ params }) => {
    await delay(MOCK_DELAY);
    const replies = mockReplies[params.id as string] || [];
    return HttpResponse.json(replies);
  }),

  // ============ POST /api/inquiries/:id/replies ============
  http.post('/api/inquiries/:id/replies', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const inquiry = inquiryStore.find(i => i.id === params.id);
    if (!inquiry) return HttpResponse.json({ message: 'Inquiry not found' }, { status: 404 });

    const newReply: InquiryReply = {
      id: String(++replyIdCounter),
      inquiryId: params.id as string,
      content: body.content as string,
      senderId: 's1',
      senderName: '校务处',
      senderRole: 'staff',
      createdAt: new Date().toISOString(),
      isInternal: body.isInternal as boolean,
    };

    if (!mockReplies[params.id as string]) {
      mockReplies[params.id as string] = [];
    }
    mockReplies[params.id as string].push(newReply);

    // Update inquiry replyCount
    const index = inquiryStore.findIndex(i => i.id === params.id);
    inquiryStore[index] = {
      ...inquiryStore[index],
      replyCount: inquiryStore[index].replyCount + 1,
      repliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(newReply, { status: 201 });
  }),

  // ============ PATCH /api/inquiries/:id/close ============
  http.patch('/api/inquiries/:id/close', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = inquiryStore.findIndex(i => i.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Inquiry not found' }, { status: 404 });
    inquiryStore[index] = {
      ...inquiryStore[index],
      status: 'closed',
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(inquiryStore[index]);
  }),

  // ============ PATCH /api/inquiries/:id/resolve ============
  http.patch('/api/inquiries/:id/resolve', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = inquiryStore.findIndex(i => i.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Inquiry not found' }, { status: 404 });
    inquiryStore[index] = {
      ...inquiryStore[index],
      status: 'replied',
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(inquiryStore[index]);
  }),

  // ============ POST /api/inquiries/:id/rating ============
  http.post('/api/inquiries/:id/rating', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json() as Record<string, unknown>;
    const index = inquiryStore.findIndex(i => i.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Inquiry not found' }, { status: 404 });
    inquiryStore[index] = {
      ...inquiryStore[index],
      hasRating: true,
      rating: body.rating as number,
      ratingComment: body.comment as string,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(inquiryStore[index]);
  }),

  // ============ DELETE /api/inquiries/:id ============
  http.delete('/api/inquiries/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const index = inquiryStore.findIndex(i => i.id === params.id);
    if (index === -1) return HttpResponse.json({ message: 'Inquiry not found' }, { status: 404 });
    inquiryStore.splice(index, 1);
    return HttpResponse.json({ data: { id: params.id } });
  }),
];
