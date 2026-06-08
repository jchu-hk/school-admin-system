/** 查询相关类型定义 */

export type InquiryType = 'bus' | 'fee' | 'grade' | 'leave' | 'other'
export type InquiryStatus = 'pending' | 'replied' | 'closed'
export type InquiryPriority = 'normal' | 'urgent'
export type SatisfactionRating = 1 | 2 | 3 | 4 | 5

export interface Inquiry {
  id: string
  inquiryNo: string
  type: InquiryType
  title: string
  content: string
  status: InquiryStatus
  priority: InquiryPriority
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
  attachments?: Attachment[]
  hasRating?: boolean
  rating?: SatisfactionRating
  ratingComment?: string
}

export interface InquiryReply {
  id: string
  inquiryId: string
  content: string
  senderId: string
  senderName: string
  senderRole: 'parent' | 'staff' | 'admin'
  createdAt: string
  attachments?: Attachment[]
  isInternal?: boolean
}

export interface Attachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  uploadedAt: string
}

export interface InquiryFilter {
  type?: InquiryType | ''
  status?: InquiryStatus | ''
  search?: string
  page?: number
  pageSize?: number
}

export interface CreateInquiryRequest {
  type: InquiryType
  title: string
  content: string
  priority: InquiryPriority
  attachments?: File[]
}

export interface CreateReplyRequest {
  inquiryId: string
  content: string
  attachments?: File[]
  isInternal?: boolean
}

export interface SubmitRatingRequest {
  inquiryId: string
  rating: SatisfactionRating
  comment?: string
}

export interface InquiryListResponse {
  items: Inquiry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const inquiryTypeLabels: Record<InquiryType, string> = {
  bus: '校车',
  fee: '学费',
  grade: '成绩',
  leave: '请假',
  other: '其他'
}

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  pending: '待回复',
  replied: '已回复',
  closed: '已关闭'
}

export const inquiryPriorityLabels: Record<InquiryPriority, string> = {
  normal: '普通',
  urgent: '紧急'
}

export const statusColors: Record<InquiryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  replied: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800'
}

export const priorityColors: Record<InquiryPriority, string> = {
  normal: 'bg-gray-100 text-gray-800',
  urgent: 'bg-red-100 text-red-800'
}
