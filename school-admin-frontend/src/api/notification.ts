import apiClient from './client'
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

    const response = await apiClient.get(`${API_BASE}?${queryParams}`)
    return response.data
  },

  // 获取通知详情
  async getNotificationDetail(id: string): Promise<NotificationDetail> {
    const response = await apiClient.get(`${API_BASE}/${id}`)
    return response.data
  },

  // 发送通知
  async sendNotification(data: SendNotificationForm): Promise<Notification> {
    const response = await apiClient.post(API_BASE, data)
    return response.data
  },

  // 更新草稿
  async updateDraft(id: string, data: Partial<SendNotificationForm>): Promise<Notification> {
    const response = await apiClient.patch(`${API_BASE}/${id}`, data)
    return response.data
  },

  // 删除通知
  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE}/${id}`)
  },

  // 获取模板列表
  async getTemplates(): Promise<NotificationTemplate[]> {
    const response = await apiClient.get(`${API_BASE}/templates`)
    return response.data
  },

  // 创建模板
  async createTemplate(data: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    const response = await apiClient.post(`${API_BASE}/templates`, data)
    return response.data
  },

  // 更新模板
  async updateTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const response = await apiClient.patch(`${API_BASE}/templates/${id}`, data)
    return response.data
  },

  // 删除模板
  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE}/templates/${id}`)
  },

  // 获取通知统计
  async getStats(notificationId?: string): Promise<NotificationStats> {
    const url = notificationId
      ? `${API_BASE}/${notificationId}/stats`
      : `${API_BASE}/stats`
    const response = await apiClient.get(url)
    return response.data
  },

  // 获取班级列表（用于选择接收人）
  async getClasses(): Promise<{ id: string; name: string; studentCount: number }[]> {
    const response = await apiClient.get('/api/classes')
    return response.data
  },

  // 获取角色列表（用于选择接收人）
  async getRoles(): Promise<{ id: string; name: string; userCount: number }[]> {
    const response = await apiClient.get('/api/roles')
    return response.data
  },

  // 搜索用户（用于选择特定接收人）
  async searchUsers(query: string): Promise<{ id: string; name: string; type: string }[]> {
    const response = await apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}`)
    return response.data
  },

  // 取消定时发送
  async cancelScheduled(id: string): Promise<Notification> {
    const response = await apiClient.post(`${API_BASE}/${id}/cancel`)
    return response.data
  },

  // 重新发送失败的通知
  async resendFailed(id: string): Promise<Notification> {
    const response = await apiClient.post(`${API_BASE}/${id}/resend`)
    return response.data
  }
}

export default notificationApi
