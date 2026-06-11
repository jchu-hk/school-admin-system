import apiClient from './client'
import type {
  Inquiry,
  InquiryListResponse,
  CreateInquiryRequest,
  CreateReplyRequest,
  SubmitRatingRequest,
  InquiryReply,
  InquiryFilter
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
  createInquiry: async (data: CreateInquiryRequest): Promise<Inquiry> => {
    const formData = new FormData()
    formData.append('type', data.type)
    formData.append('title', data.title)
    formData.append('content', data.content)
    formData.append('priority', data.priority)

    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file)
      })
    }

    const response = await apiClient.post('/api/inquiries', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
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
  }
}

export default inquiryApi
