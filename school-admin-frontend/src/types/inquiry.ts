/** 查询相关类型定义 - 家长查询队列管理 */

export type InquiryType = 'bus' | 'fee' | 'grade' | 'leave' | 'other'

// 状态：包含 auto_replied, escalated
export type InquiryStatus = 'pending' | 'processing' | 'replied' | 'auto_replied' | 'escalated' | 'closed'

export type InquiryPriority = 'normal' | 'urgent'

export type SatisfactionRating = 1 | 2 | 3 | 4 | 5

// 情绪分类 (AC-08)
export type InquirySentiment = 'neutral' | 'positive' | 'negative' | 'angry'

// 超时警告级别 (AC-04)
export type TimeoutWarningLevel = 'none' | 'warning' | 'critical'

// 渠道
export type InquiryChannel = 'phone' | 'email' | 'whatsapp' | 'in_person' | 'app'

export interface Inquiry {
  id: string
  inquiryNo: string
  type: InquiryType
  title?: string
  content: string
  subject?: string
  status: InquiryStatus
  priority: InquiryPriority
  submitterId: string
  submitterName: string
  submitterEmail?: string
  submitterPhone?: string
  studentName?: string
  studentClass?: string
  channel?: InquiryChannel
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
  // AC-02: AI分析
  aiIntent?: string
  aiSentiment?: string
  aiConfidence?: number
  aiSuggestedResponse?: string
  autoResponseEligible?: boolean
  // AC-03: 升级
  escalationRequired?: boolean
  // AC-04: 超时警告
  timeoutWarning?: TimeoutWarningLevel
  waitingMinutes?: number
  // AC-01: 通话记录
  callDurationMinutes?: number
  callResult?: string
  sentiment?: InquirySentiment
  // AC-06: 转交
  transferTo?: string
  transferStatus?: TransferStatus
  transferReason?: string
  transferredBy?: string
}

export interface InquiryReply {
  id: string
  inquiryId: string
  content: string
  senderId: string
  senderName: string
  senderRole: 'parent' | 'staff' | 'admin' | 'ai'
  createdAt: string
  attachments?: Attachment[]
  isInternal?: boolean
  isAiGenerated?: boolean
}

export interface Attachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  uploadedAt: string
}

// 队列项 (队列视图)
export interface QueueItem {
  id: string
  inquiryNo: string
  parentName: string
  category: string
  channel: InquiryChannel
  priority: InquiryPriority
  status: InquiryStatus
  aiIntent: string
  sentiment: InquirySentiment
  waitingMinutes: number
  timeoutWarning: TimeoutWarningLevel
  escalationRequired: boolean
  autoResponseEligible: boolean
  aiSuggestedResponse: string
  assignedToName: string
  submittedAt: string
}

// 队列统计
export interface QueueStats {
  total: number
  pending: number
  processing: number
  autoReplied: number
  escalated: number
  timeoutWarning: number
  timeoutCritical: number
}

// 队列响应
export interface QueueResponse {
  stats: QueueStats
  items: QueueItem[]
  total: number
}

// 超时警告项
export interface TimeoutWarning {
  inquiryId: string
  inquiryNo: string
  parentName: string
  category: string
  waitingMinutes: number
  warningLevel: TimeoutWarningLevel
}

// 超时警告响应
export interface TimeoutWarningsResponse {
  warningCounts: {
    total: number
    warning: number
    critical: number
  }
  warnings: TimeoutWarning[]
}

// 转交状态
export type TransferStatus = 'not_transferred' | 'pending' | 'accepted' | 'rejected'

// 转交请求
export interface TransferRequest {
  transferTo: string
  reason: string
  departmentName?: string
}

// 通话记录请求 (AC-01)
export interface CallLogRequest {
  callDurationMinutes: number
  callResult?: string
  sentiment: InquirySentiment
  notes?: string
}

// 快速回复请求 (AC-05)
export interface QuickReplyRequest {
  content: string
  autoSend?: boolean
}

// 满意度评价
export type InquiryFilter = {
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
  channel?: InquiryChannel
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
  processing: '处理中',
  replied: '已回复',
  auto_replied: '自动回复',
  escalated: '已升级',
  closed: '已关闭'
}

export const inquiryPriorityLabels: Record<InquiryPriority, string> = {
  normal: '普通',
  urgent: '紧急'
}

export const statusColors: Record<InquiryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  replied: 'bg-green-100 text-green-800',
  auto_replied: 'bg-purple-100 text-purple-800',
  escalated: 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-800'
}

export const priorityColors: Record<InquiryPriority, string> = {
  normal: 'bg-gray-100 text-gray-800',
  urgent: 'bg-red-100 text-red-800'
}

// 情绪标签和颜色
export const sentimentLabels: Record<InquirySentiment, string> = {
  neutral: '中性',
  positive: '正面',
  negative: '不满',
  angry: '愤怒'
}

export const sentimentColors: Record<InquirySentiment, string> = {
  neutral: 'bg-gray-100 text-gray-600',
  positive: 'bg-green-100 text-green-700',
  negative: 'bg-orange-100 text-orange-700',
  angry: 'bg-red-100 text-red-700'
}

// 超时警告颜色
export const timeoutColors: Record<TimeoutWarningLevel, string> = {
  none: '',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-400',
  critical: 'bg-red-100 text-red-800 border-red-400'
}
