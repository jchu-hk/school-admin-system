import type {
  Notification,
  NotificationDetail,
  NotificationTemplate,
  SendNotificationForm,
  NotificationStats,
  NotificationQueryParams
} from '../types/notification'

const API_BASE = '/api/notifications'

const notificationApi = {
  // 获取通知列表
  async getNotifications(params: NotificationQueryParams): Promise<{ items: Notification[]; total: number }> {
    const queryParams = new URLSearchParams()
    if (params.type) queryParams.append('type', params.type)
    if (params.status) queryParams.append('status', params.status)
    if (params.search) queryParams.append('search', params.search)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)

    const response = await fetch(`${API_BASE}?${queryParams}`)
    if (!response.ok) throw new Error('Failed to fetch notifications')
    return response.json()
  },

  // 获取通知详情
  async getNotificationDetail(id: string): Promise<NotificationDetail> {
    const response = await fetch(`${API_BASE}/${id}`)
    if (!response.ok) throw new Error('Failed to fetch notification detail')
    return response.json()
  },

  // 发送通知
  async sendNotification(data: SendNotificationForm): Promise<Notification> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to send notification')
    return response.json()
  },

  // 更新草稿
  async updateDraft(id: string, data: Partial<SendNotificationForm>): Promise<Notification> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update draft')
    return response.json()
  },

  // 删除通知
  async deleteNotification(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to delete notification')
  },

  // 获取模板列表
  async getTemplates(): Promise<NotificationTemplate[]> {
    const response = await fetch(`${API_BASE}/templates`)
    if (!response.ok) throw new Error('Failed to fetch templates')
    return response.json()
  },

  // 创建模板
  async createTemplate(data: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    const response = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create template')
    return response.json()
  },

  // 更新模板
  async updateTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const response = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update template')
    return response.json()
  },

  // 删除模板
  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to delete template')
  },

  // 获取通知统计
  async getStats(notificationId?: string): Promise<NotificationStats> {
    const url = notificationId 
      ? `${API_BASE}/${notificationId}/stats` 
      : `${API_BASE}/stats`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch stats')
    return response.json()
  },

  // 获取班级列表（用于选择接收人）
  async getClasses(): Promise<{ id: string; name: string; studentCount: number }[]> {
    const response = await fetch('/api/classes')
    if (!response.ok) throw new Error('Failed to fetch classes')
    return response.json()
  },

  // 获取角色列表（用于选择接收人）
  async getRoles(): Promise<{ id: string; name: string; userCount: number }[]> {
    const response = await fetch('/api/roles')
    if (!response.ok) throw new Error('Failed to fetch roles')
    return response.json()
  },

  // 搜索用户（用于选择特定接收人）
  async searchUsers(query: string): Promise<{ id: string; name: string; type: string }[]> {
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
    if (!response.ok) throw new Error('Failed to search users')
    return response.json()
  },

  // 取消定时发送
  async cancelScheduled(id: string): Promise<Notification> {
    const response = await fetch(`${API_BASE}/${id}/cancel`, { method: 'POST' })
    if (!response.ok) throw new Error('Failed to cancel scheduled notification')
    return response.json()
  },

  // 重新发送失败的通知
  async resendFailed(id: string): Promise<Notification> {
    const response = await fetch(`${API_BASE}/${id}/resend`, { method: 'POST' })
    if (!response.ok) throw new Error('Failed to resend notification')
    return response.json()
  }
}

export default notificationApi
