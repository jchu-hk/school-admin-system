import apiClient from './client'
import type {
  Inquiry,
  InquiryListResponse,
  CreateInquiryRequest,
  CreateReplyRequest,
  SubmitRatingRequest,
  InquiryReply,
  InquiryFilter,
  QueueResponse,
  TimeoutWarningsResponse,
  TransferRequest,
  CallLogRequest,
  QuickReplyRequest,
} from '../types/inquiry'

const inquiryApi = {
  // 查询列表
  getInquiries: async (filter: InquiryFilter): Promise<InquiryListResponse> => {
    const params = new URLSearchParams()
    if (filter.type) params.append('type', filter.type)
    if (filter.status) params.append('status', filter.status)
    if (filter.search) params.append('search', filter.search)
    if (filter.page) params.append('page', filter.page.toString())
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString())

    const response = await apiClient.get(`/api/inquiries?${params}`)
    return response.data
  },

  // 获取单个查询
  getInquiry: async (id: string): Promise<Inquiry> => {
    const response = await apiClient.get(`/api/inquiries/${id}`)
    return response.data
  },

  // 创建查询
  createInquiry: async (data: {
    parentId?: string
    category?: string
    subject?: string
    content: string
    priority?: string
    channel?: string
    attachments?: File[]
  }): Promise<Inquiry> => {
    // 后端期望的字段格式
    const payload = {
      parentId: data.parentId || '',
      category: data.category || 'general',
      subject: data.subject || '',
      content: data.content,
      priority: data.priority || 'normal',
      channel: data.channel || 'app'
    }
    
    const response = await apiClient.post('/api/inquiries', payload)
    return response.data
  },

  // 获取查询回复列表
  getReplies: async (inquiryId: string): Promise<InquiryReply[]> => {
    const response = await apiClient.get(`/api/inquiries/${inquiryId}/replies`)
    return response.data
  },

  // 创建回复
  createReply: async (data: CreateReplyRequest): Promise<InquiryReply> => {
    const formData = new FormData()
    formData.append('content', data.content)
    if (data.isInternal) formData.append('isInternal', 'true')

    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file)
      })
    }

    const response = await apiClient.post(
      `/api/inquiries/${data.inquiryId}/replies`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  // 关闭查询
  closeInquiry: async (id: string): Promise<Inquiry> => {
    const response = await apiClient.patch(`/api/inquiries/${id}/close`)
    return response.data
  },

  // 提交评价
  submitRating: async (data: SubmitRatingRequest): Promise<Inquiry> => {
    const response = await apiClient.post(
      `/api/inquiries/${data.inquiryId}/rating`,
      { rating: data.rating, comment: data.comment }
    )
    return response.data
  },

  // 获取待处理查询（校务处视角）
  getPendingInquiries: async (): Promise<Inquiry[]> => {
    const response = await apiClient.get('/api/inquiries/pending')
    return response.data
  },

  // 标记为已解决
  resolveInquiry: async (id: string): Promise<Inquiry> => {
    const response = await apiClient.patch(`/api/inquiries/${id}/resolve`)
    return response.data
  },

  // ==========================================
  // 队列管理 API (AC-04, AC-05, AC-06)
  // ==========================================

  // 获取队列视图
  getQueue: async (params?: {
    assignedTo?: string
    timeoutOnly?: boolean
    escalatedOnly?: boolean
    sortBy?: 'waitingMinutes' | 'priority' | 'submittedAt'
    page?: number
    limit?: number
  }): Promise<QueueResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo)
    if (params?.timeoutOnly) queryParams.append('timeoutOnly', 'true')
    if (params?.escalatedOnly) queryParams.append('escalatedOnly', 'true')
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())

    const response = await apiClient.get(`/api/inquiries/queue?${queryParams}`)
    return response.data
  },

  // 获取超时警告列表 (AC-04)
  getTimeoutWarnings: async (): Promise<TimeoutWarningsResponse> => {
    const response = await apiClient.get('/api/inquiries/timeout-warnings')
    return response.data
  },

  // 快速回复 (AC-05)
  quickReply: async (inquiryId: string, data: QuickReplyRequest): Promise<InquiryReply> => {
    const response = await apiClient.post(`/api/inquiries/${inquiryId}/quick-reply`, data)
    return response.data
  },

  // AI自动回复 (AC-07)
  autoReply: async (inquiryId: string): Promise<{ success: boolean; replyId?: string }> => {
    const response = await apiClient.post(`/api/inquiries/${inquiryId}/auto-reply`)
    return response.data
  },

  // 转交查询 (AC-06)
  transferInquiry: async (inquiryId: string, data: TransferRequest): Promise<Inquiry> => {
    const response = await apiClient.post(`/api/inquiries/${inquiryId}/transfer`, data)
    return response.data
  },

  // 接受转交
  acceptTransfer: async (inquiryId: string): Promise<Inquiry> => {
    const response = await apiClient.patch(`/api/inquiries/${inquiryId}/transfer/accept`)
    return response.data
  },

  // 拒绝转交
  rejectTransfer: async (inquiryId: string): Promise<Inquiry> => {
    const response = await apiClient.patch(`/api/inquiries/${inquiryId}/transfer/reject`)
    return response.data
  },

  // 记录来电通话 (AC-01)
  recordCallLog: async (inquiryId: string, data: CallLogRequest): Promise<Inquiry> => {
    const response = await apiClient.post(`/api/inquiries/${inquiryId}/call-log`, data)
    return response.data
  },
}

export default inquiryApi
