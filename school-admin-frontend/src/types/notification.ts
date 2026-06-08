// 通知类型
export type NotificationType = 'system' | 'activity' | 'urgent'

// 通知状态
export type NotificationStatus = 'draft' | 'sent' | 'scheduled'

// 发送渠道
export type NotificationChannel = 'app' | 'sms' | 'email' | 'wechat'

// 接收人类型
export type RecipientType = 'all' | 'class' | 'role' | 'specific'

// 阅读状态
export type ReadStatus = 'read' | 'unread'

// 通知数据
export interface Notification {
  id: string
  notificationNo: string
  title: string
  content: string
  type: NotificationType
  status: NotificationStatus
  channels: NotificationChannel[]
  recipientType: RecipientType
  recipientCount: number
  readCount: number
  senderId: string
  senderName: string
  scheduledAt?: string
  sentAt?: string
  createdAt: string
  updatedAt: string
}

// 通知详情
export interface NotificationDetail extends Notification {
  recipients: NotificationRecipient[]
  templates?: NotificationTemplate[]
}

// 通知接收人
export interface NotificationRecipient {
  id: string
  notificationId: string
  userId: string
  userName: string
  userType: string
  className?: string
  readStatus: ReadStatus
  readAt?: string
  channel: NotificationChannel
  deliveredAt?: string
}

// 通知模板
export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  title: string
  content: string
  variables: string[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// 发送通知表单
export interface SendNotificationForm {
  title: string
  content: string
  type: NotificationType
  recipientType: RecipientType
  recipientIds?: string[]
  classIds?: string[]
  roleIds?: string[]
  channels: NotificationChannel[]
  templateId?: string
  scheduledAt?: string
}

// 通知统计
export interface NotificationStats {
  totalSent: number
  totalRecipients: number
  readRate: number
  deliveryRate: number
  byChannel: Record<NotificationChannel, { sent: number; delivered: number }>
  byType: Record<NotificationType, number>
}

// 查询参数
export interface NotificationQueryParams {
  type?: NotificationType
  status?: NotificationStatus
  search?: string
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}

// 标签映射
export const notificationTypeLabels: Record<NotificationType, string> = {
  system: '系統通知',
  activity: '活動通知',
  urgent: '緊急通知'
}

export const notificationStatusLabels: Record<NotificationStatus, string> = {
  draft: '草稿',
  sent: '已發送',
  scheduled: '定時發送'
}

export const notificationChannelLabels: Record<NotificationChannel, string> = {
  app: 'APP推送',
  sms: '短信',
  email: '郵件',
  wechat: '微信'
}

export const recipientTypeLabels: Record<RecipientType, string> = {
  all: '全部用戶',
  class: '按班級',
  role: '按角色',
  specific: '特定用戶'
}

// 颜色映射
export const typeColors: Record<NotificationType, string> = {
  system: 'bg-blue-100 text-blue-700',
  activity: 'bg-green-100 text-green-700',
  urgent: 'bg-red-100 text-red-700'
}

export const statusColors: Record<NotificationStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-green-100 text-green-700',
  scheduled: 'bg-yellow-100 text-yellow-700'
}

export const channelColors: Record<NotificationChannel, string> = {
  app: 'bg-purple-100 text-purple-700',
  sms: 'bg-orange-100 text-orange-700',
  email: 'bg-blue-100 text-blue-700',
  wechat: 'bg-green-100 text-green-700'
}

export const readStatusColors: Record<ReadStatus, string> = {
  read: 'bg-green-100 text-green-700',
  unread: 'bg-gray-100 text-gray-700'
}

// 模拟数据
export const mockTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: '活動通知模板',
    type: 'activity',
    title: '【活動通知】{{activityName}}',
    content: '親愛的家長：\n\n學校將於{{date}}舉辦{{activityName}}，請準時參加。\n\n地點：{{location}}\n時間：{{time}}\n\n如有查詢，請聯絡校務處。',
    variables: ['activityName', 'date', 'location', 'time'],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '緊急通知模板',
    type: 'urgent',
    title: '【緊急通知】{{emergencyType}}',
    content: '各位家長：\n\n因{{reason}}，{{action}}。\n\n請家長{{instruction}}。\n\n校務處',
    variables: ['emergencyType', 'reason', 'action', 'instruction'],
    isDefault: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: '系統維護通知',
    type: 'system',
    title: '系統維護通知',
    content: '親愛的用戶：\n\n系統將於{{startTime}}至{{endTime}}進行維護，期間服務可能受到影響。\n\n不便之處，敬請見諒。',
    variables: ['startTime', 'endTime'],
    isDefault: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
]
