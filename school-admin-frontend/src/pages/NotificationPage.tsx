import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search,
  Plus,
  Filter,
  Send,
  Bell,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  ChevronLeft,
  Eye,
  Trash2,
  Edit3,
  Calendar,
  MessageSquare,
  Smartphone,
  Mail,
  MessageCircle,
  Template,
  ChevronDown,
  Check,
  BarChart3,
  RefreshCw,
  Copy,
  XCircle
} from 'lucide-react'
import notificationApi from '../api/notification'
import type {
  Notification,
  NotificationDetail,
  NotificationTemplate,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
  RecipientType,
  ReadStatus
} from '../types/notification'
import {
  notificationTypeLabels,
  notificationStatusLabels,
  notificationChannelLabels,
  recipientTypeLabels,
  typeColors,
  statusColors,
  channelColors,
  readStatusColors,
  mockTemplates
} from '../types/notification'

// 表单验证Schema
const sendNotificationSchema = z.object({
  title: z.string().min(2, '標題至少需要2個字符').max(200, '標題最多200個字符'),
  content: z.string().min(10, '內容至少需要10個字符').max(5000, '內容最多5000個字符'),
  type: z.enum(['system', 'activity', 'urgent']),
  recipientType: z.enum(['all', 'class', 'role', 'specific']),
  channels: z.array(z.enum(['app', 'sms', 'email', 'wechat'])).min(1, '至少選擇一個發送渠道'),
  scheduledAt: z.string().optional()
})

type SendNotificationForm = z.infer<typeof sendNotificationSchema>

const templateSchema = z.object({
  name: z.string().min(2, '模板名稱至少需要2個字符'),
  type: z.enum(['system', 'activity', 'urgent']),
  title: z.string().min(2, '標題至少需要2個字符'),
  content: z.string().min(10, '內容至少需要10個字符')
})

type TemplateForm = z.infer<typeof templateSchema>

// Tab类型
type TabType = 'list' | 'templates'

export default function NotificationPage() {
  // 标签页状态
  const [activeTab, setActiveTab] = useState<TabType>('list')
  
  // 通知列表状态
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<NotificationType | ''>('')
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // 弹窗状态
  const [showSendModal, setShowSendModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationDetail | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  
  // 模板列表
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates)
  
  // 表单状态
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>(['app'])
  const [selectedRecipientType, setSelectedRecipientType] = useState<RecipientType>('all')
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  
  // 统计数据
  const [showStats, setShowStats] = useState(false)
  
  const pageSize = 20

  // 表单
  const {
    register: registerSend,
    handleSubmit: handleSubmitSend,
    reset: resetSend,
    setValue: setSendValue,
    watch: watchSend,
    formState: { errors: sendErrors }
  } = useForm<SendNotificationForm>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: {
      type: 'system',
      recipientType: 'all',
      channels: ['app']
    }
  })

  const {
    register: registerTemplate,
    handleSubmit: handleSubmitTemplate,
    reset: resetTemplate,
    setValue: setTemplateValue,
    formState: { errors: templateErrors }
  } = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: { type: 'system' }
  })

  // 加载通知列表
  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const response = await notificationApi.getNotifications({
        type: filterType || undefined,
        status: filterStatus || undefined,
        search: searchQuery || undefined,
        page,
        pageSize
      })
      setNotifications(response.items)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      // 使用模拟数据
      setNotifications([
        {
          id: '1',
          notificationNo: 'NOT-20260608-001',
          title: '期末考試時間表通知',
          content: '期末考試將於下週一開始...',
          type: 'system',
          status: 'sent',
          channels: ['app', 'email'],
          recipientType: 'all',
          recipientCount: 850,
          readCount: 720,
          senderId: 'staff-001',
          senderName: '校務處',
          sentAt: '2026-06-08T09:00:00Z',
          createdAt: '2026-06-08T08:30:00Z',
          updatedAt: '2026-06-08T09:00:00Z'
        },
        {
          id: '2',
          notificationNo: 'NOT-20260607-002',
          title: '親子運動會報名開始',
          content: '本年度親子運動會開始接受報名...',
          type: 'activity',
          status: 'sent',
          channels: ['app', 'wechat'],
          recipientType: 'all',
          recipientCount: 850,
          readCount: 650,
          senderId: 'staff-002',
          senderName: '體育組',
          sentAt: '2026-06-07T14:00:00Z',
          createdAt: '2026-06-07T10:00:00Z',
          updatedAt: '2026-06-07T14:00:00Z'
        },
        {
          id: '3',
          notificationNo: 'NOT-20260606-003',
          title: '颱風來襲停課通知',
          content: '由於颱風影響，明天停課一天...',
          type: 'urgent',
          status: 'sent',
          channels: ['app', 'sms', 'email', 'wechat'],
          recipientType: 'all',
          recipientCount: 850,
          readCount: 840,
          senderId: 'staff-001',
          senderName: '校務處',
          sentAt: '2026-06-06T18:00:00Z',
          createdAt: '2026-06-06T17:30:00Z',
          updatedAt: '2026-06-06T18:00:00Z'
        },
        {
          id: '4',
          notificationNo: 'NOT-20260605-004',
          title: '2A班家長會通知',
          content: '2A班將於本週五舉行家長會...',
          type: 'activity',
          status: 'scheduled',
          channels: ['app'],
          recipientType: 'class',
          recipientCount: 35,
          readCount: 0,
          senderId: 'staff-003',
          senderName: '張老師',
          scheduledAt: '2026-06-10T09:00:00Z',
          createdAt: '2026-06-05T10:00:00Z',
          updatedAt: '2026-06-05T10:00:00Z'
        },
        {
          id: '5',
          notificationNo: 'NOT-20260604-005',
          title: '學費繳交提醒',
          content: '請家長於本月15日前繳交學費...',
          type: 'system',
          status: 'draft',
          channels: ['app', 'email'],
          recipientType: 'all',
          recipientCount: 0,
          readCount: 0,
          senderId: 'staff-004',
          senderName: '財務處',
          createdAt: '2026-06-04T16:00:00Z',
          updatedAt: '2026-06-04T16:00:00Z'
        }
      ])
      setTotal(5)
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus, searchQuery, page])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // 发送通知
  const onSendNotification = async (data: SendNotificationForm) => {
    try {
      const payload = {
        ...data,
        channels: selectedChannels,
        recipientType: selectedRecipientType,
        ...(selectedRecipientType === 'class' && { classIds: selectedClasses }),
        ...(selectedRecipientType === 'role' && { roleIds: selectedRoles }),
        ...(selectedRecipientType === 'specific' && { recipientIds: selectedUsers }),
        ...(scheduleEnabled && data.scheduledAt && { scheduledAt: data.scheduledAt })
      }
      await notificationApi.sendNotification(payload)
      setShowSendModal(false)
      resetSend()
      setSelectedChannels(['app'])
      setSelectedRecipientType('all')
      setScheduleEnabled(false)
      loadNotifications()
      alert('通知發送成功！')
    } catch (error) {
      console.error('Failed to send notification:', error)
      alert('發送失敗，請重試')
    }
  }

  // 查看详情
  const handleViewDetail = async (notification: Notification) => {
    try {
      const detail = await notificationApi.getNotificationDetail(notification.id)
      setSelectedNotification({
        ...detail,
        recipients: detail.recipients || [
          { id: '1', notificationId: notification.id, userId: 'u1', userName: '陳家長', userType: 'parent', className: '2A', readStatus: 'read', readAt: '2026-06-08T09:30:00Z', channel: 'app', deliveredAt: '2026-06-08T09:00:00Z' },
          { id: '2', notificationId: notification.id, userId: 'u2', userName: '李家長', userType: 'parent', className: '3B', readStatus: 'read', readAt: '2026-06-08T10:00:00Z', channel: 'email', deliveredAt: '2026-06-08T09:05:00Z' },
          { id: '3', notificationId: notification.id, userId: 'u3', userName: '王家長', userType: 'parent', className: '1C', readStatus: 'unread', channel: 'app', deliveredAt: '2026-06-08T09:00:00Z' }
        ]
      })
      setShowDetailModal(true)
    } catch (error) {
      console.error('Failed to load notification detail:', error)
    }
  }

  // 删除通知
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此通知嗎？')) return
    try {
      await notificationApi.deleteNotification(id)
      loadNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // 取消定时发送
  const handleCancelScheduled = async (id: string) => {
    if (!confirm('確定要取消此定時發送嗎？')) return
    try {
      await notificationApi.cancelScheduled(id)
      loadNotifications()
    } catch (error) {
      console.error('Failed to cancel scheduled:', error)
    }
  }

  // 选择模板
  const handleSelectTemplate = (template: NotificationTemplate) => {
    setSendValue('title', template.title)
    setSendValue('content', template.content)
    setSendValue('type', template.type)
    setSelectedTemplateId(template.id)
    setShowTemplateDropdown(false)
  }

  // 保存模板
  const onSaveTemplate = async (data: TemplateForm) => {
    try {
      if (selectedTemplate) {
        await notificationApi.updateTemplate(selectedTemplate.id, data)
      } else {
        await notificationApi.createTemplate({ ...data, variables: [], isDefault: false })
      }
      setShowTemplateModal(false)
      resetTemplate()
      setSelectedTemplate(null)
      // 刷新模板列表
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  // 编辑模板
  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setTemplateValue('name', template.name)
    setTemplateValue('type', template.type)
    setTemplateValue('title', template.title)
    setTemplateValue('content', template.content)
    setShowTemplateModal(true)
  }

  // 删除模板
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('確定要刪除此模板嗎？')) return
    try {
      await notificationApi.deleteTemplate(id)
      setTemplates(templates.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  // 渠道切换
  const toggleChannel = (channel: NotificationChannel) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    )
  }

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 计算阅读率
  const getReadRate = (read: number, total: number) => {
    if (total === 0) return 0
    return Math.round((read / total) * 100)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4 p-4 md:p-0">
      {/* 页面标题和标签切换 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">通知管理</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              通知列表
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'templates' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              模板管理
            </button>
          </div>
          {activeTab === 'list' && (
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              發送通知
            </button>
          )}
          {activeTab === 'templates' && (
            <button
              onClick={() => {
                setSelectedTemplate(null)
                resetTemplate()
                setShowTemplateModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              新增模板
            </button>
          )}
        </div>
      </div>

      {/* 通知列表标签页 */}
      {activeTab === 'list' && (
        <>
          {/* 筛选器和搜索 */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索通知標題..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as NotificationType | '')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部類型</option>
                  {Object.entries(notificationTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as NotificationStatus | '')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部狀態</option>
                  {Object.entries(notificationStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 通知列表表格 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">載入中...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="mx-auto mb-3 text-gray-300" size={48} />
                <p>暫無通知記錄</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">通知編號</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">標題</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">類型</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">狀態</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">發送時間</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">接收人數</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">閱讀率</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <tr key={notification.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">{notification.notificationNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{notification.title}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[notification.type]}`}>
                              {notificationTypeLabels[notification.type]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[notification.status]}`}>
                              {notificationStatusLabels[notification.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {notification.scheduledAt ? (
                              <span className="flex items-center gap-1 text-yellow-600">
                                <Clock size={14} />
                                {formatDate(notification.scheduledAt)}
                              </span>
                            ) : (
                              formatDate(notification.sentAt)
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {notification.recipientCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {notification.status === 'sent' ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${getReadRate(notification.readCount, notification.recipientCount)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600">
                                  {getReadRate(notification.readCount, notification.recipientCount)}%
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewDetail(notification)}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                                title="查看詳情"
                              >
                                <Eye size={16} />
                              </button>
                              {notification.status === 'scheduled' && (
                                <button
                                  onClick={() => handleCancelScheduled(notification.id)}
                                  className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition"
                                  title="取消定時發送"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                              {notification.status === 'draft' && (
                                <>
                                  <button
                                    onClick={() => handleViewDetail(notification)}
                                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                                    title="編輯"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(notification.id)}
                                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                                    title="刪除"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      共 {total} 條記錄，第 {page} / {totalPages} 頁
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-gray-50"
                      >
                        上一頁
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-gray-50"
                      >
                        下一頁
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* 模板管理标签页 */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">模板名稱</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">類型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">標題</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">變量</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{template.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[template.type]}`}>
                        {notificationTypeLabels[template.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{template.title}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                            {'{{' + v + '}}'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                          title="編輯"
                        >
                          <Edit3 size={16} />
                        </button>
                        {!template.isDefault && (
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                            title="刪除"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 发送通知弹窗 */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">發送通知</h3>
              <button onClick={() => setShowSendModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitSend(onSendNotification)} className="p-4 space-y-4">
              {/* 模板选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">快速選擇模板（可選）</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className={selectedTemplateId ? 'text-gray-900' : 'text-gray-400'}>
                      {selectedTemplateId 
                        ? templates.find(t => t.id === selectedTemplateId)?.name || '選擇模板'
                        : '選擇模板...'}
                    </span>
                    <ChevronDown size={18} className="text-gray-400" />
                  </button>
                  {showTemplateDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleSelectTemplate(template)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{template.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${typeColors[template.type]}`}>
                              {notificationTypeLabels[template.type]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">{template.title}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 通知类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">通知類型 *</label>
                <select
                  {...registerSend('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(notificationTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {sendErrors.type && <p className="mt-1 text-sm text-red-600">{sendErrors.type.message}</p>}
              </div>

              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">通知標題 *</label>
                <input
                  {...registerSend('title')}
                  placeholder="請輸入通知標題"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {sendErrors.title && <p className="mt-1 text-sm text-red-600">{sendErrors.title.message}</p>}
              </div>

              {/* 内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">通知內容 *</label>
                <textarea
                  {...registerSend('content')}
                  rows={5}
                  placeholder="請輸入通知內容..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {sendErrors.content && <p className="mt-1 text-sm text-red-600">{sendErrors.content.message}</p>}
                <p className="text-xs text-gray-500 mt-1">支持使用 {'{{變量名}}'} 作為佔位符</p>
              </div>

              {/* 接收人选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">接收人 *</label>
                <div className="space-y-3">
                  <select
                    value={selectedRecipientType}
                    onChange={(e) => setSelectedRecipientType(e.target.value as RecipientType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(recipientTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  
                  {selectedRecipientType === 'class' && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">選擇班級（模擬數據）：</p>
                      <div className="flex flex-wrap gap-2">
                        {['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'].map((cls) => (
                          <label key={cls} className="flex items-center gap-1 bg-white px-3 py-1.5 rounded border cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedClasses.includes(cls)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClasses([...selectedClasses, cls])
                                } else {
                                  setSelectedClasses(selectedClasses.filter(c => c !== cls))
                                }
                              }}
                            />
                            <span className="text-sm">{cls}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedRecipientType === 'role' && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">選擇角色（模擬數據）：</p>
                      <div className="flex flex-wrap gap-2">
                        {['家長', '教師', '行政人員', '校長'].map((role) => (
                          <label key={role} className="flex items-center gap-1 bg-white px-3 py-1.5 rounded border cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRoles([...selectedRoles, role])
                                } else {
                                  setSelectedRoles(selectedRoles.filter(r => r !== role))
                                }
                              }}
                            />
                            <span className="text-sm">{role}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 发送渠道 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">發送渠道 *</label>
                <div className="flex flex-wrap gap-3">
                  {([
                    { key: 'app', icon: Smartphone, label: 'APP推送' },
                    { key: 'sms', icon: MessageSquare, label: '短信' },
                    { key: 'email', icon: Mail, label: '郵件' },
                    { key: 'wechat', icon: MessageCircle, label: '微信' }
                  ] as { key: NotificationChannel; icon: any; label: string }[]).map(({ key, icon: Icon, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${
                        selectedChannels.includes(key)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(key)}
                        onChange={() => toggleChannel(key)}
                        className="hidden"
                      />
                      <Icon size={18} />
                      <span className="text-sm">{label}</span>
                      {selectedChannels.includes(key) && <Check size={16} />}
                    </label>
                  ))}
                </div>
                {sendErrors.channels && <p className="mt-1 text-sm text-red-600">{sendErrors.channels.message}</p>}
              </div>

              {/* 定时发送 */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">定時發送</span>
                </label>
                {scheduleEnabled && (
                  <input
                    {...registerSend('scheduledAt')}
                    type="datetime-local"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {scheduleEnabled ? '定時發送' : '立即發送'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 通知详情弹窗 */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h3 className="font-semibold">{selectedNotification.title}</h3>
                  <p className="text-sm text-gray-500">{selectedNotification.notificationNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  <BarChart3 size={16} />
                  統計
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* 统计面板 */}
              {showStats && (
                <div className="p-4 bg-gray-50 border-b">
                  <h4 className="font-medium mb-3">送達統計</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">接收人數</p>
                      <p className="text-2xl font-bold">{selectedNotification.recipientCount}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">已閱讀</p>
                      <p className="text-2xl font-bold text-green-600">{selectedNotification.readCount}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">閱讀率</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {getReadRate(selectedNotification.readCount, selectedNotification.recipientCount)}%
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">發送渠道</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedNotification.channels.map((ch) => (
                          <span key={ch} className={`px-2 py-0.5 rounded text-xs ${channelColors[ch]}`}>
                            {notificationChannelLabels[ch]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 通知内容 */}
              <div className="p-4 border-b">
                <h4 className="font-medium mb-2">通知內容</h4>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {selectedNotification.content}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>發送人：{selectedNotification.senderName}</span>
                  <span>發送時間：{formatDate(selectedNotification.sentAt)}</span>
                  <span className={`px-2 py-0.5 rounded ${typeColors[selectedNotification.type]}`}>
                    {notificationTypeLabels[selectedNotification.type]}
                  </span>
                </div>
              </div>

              {/* 接收人列表 */}
              <div className="p-4">
                <h4 className="font-medium mb-3">接收人列表</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">姓名</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">類型</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">班級</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">渠道</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">閱讀狀態</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">閱讀時間</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedNotification.recipients?.map((recipient) => (
                        <tr key={recipient.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{recipient.userName}</td>
                          <td className="px-3 py-2">{recipient.userType}</td>
                          <td className="px-3 py-2">{recipient.className || '-'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${channelColors[recipient.channel]}`}>
                              {notificationChannelLabels[recipient.channel]}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${readStatusColors[recipient.readStatus]}`}>
                              {recipient.readStatus === 'read' ? '已讀' : '未讀'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-500">{formatDate(recipient.readAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模板编辑弹窗 */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedTemplate ? '編輯模板' : '新增模板'}
              </h3>
              <button onClick={() => setShowTemplateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitTemplate(onSaveTemplate)} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板名稱 *</label>
                <input
                  {...registerTemplate('name')}
                  placeholder="請輸入模板名稱"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {templateErrors.name && <p className="mt-1 text-sm text-red-600">{templateErrors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">通知類型 *</label>
                <select
                  {...registerTemplate('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(notificationTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">標題 *</label>
                <input
                  {...registerTemplate('title')}
                  placeholder="請輸入標題，可使用 {{變量名}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {templateErrors.title && <p className="mt-1 text-sm text-red-600">{templateErrors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">內容 *</label>
                <textarea
                  {...registerTemplate('content')}
                  rows={5}
                  placeholder="請輸入內容，可使用 {{變量名}} 作為佔位符..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {templateErrors.content && <p className="mt-1 text-sm text-red-600">{templateErrors.content.message}</p>}
                <p className="text-xs text-gray-500 mt-1">可用變量：{'{{activityName}}'} {'{{date}}'} {'{{location}}'} {'{{time}}'} 等</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
