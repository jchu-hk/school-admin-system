import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search,
  Plus,
  Filter,
  MessageCircle,
  Paperclip,
  Send,
  Star,
  X,
  ChevronLeft,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  FileText,
  MoreVertical,
  Trash2,
  Edit3,
  Check
} from 'lucide-react'
import inquiryApi from '../api/inquiry'
import type {
  Inquiry,
  InquiryReply,
  InquiryType,
  InquiryStatus,
  InquiryPriority,
  SatisfactionRating
} from '../types/inquiry'
import {
  inquiryTypeLabels,
  inquiryStatusLabels,
  inquiryPriorityLabels,
  statusColors,
  priorityColors
} from '../types/inquiry'

// 表单验证Schema
const createInquirySchema = z.object({
  type: z.enum(['bus', 'fee', 'grade', 'leave', 'other']),
  title: z.string().min(2, '标题至少需要2个字符').max(100, '标题最多100个字符'),
  content: z.string().min(10, '详细描述至少需要10个字符').max(2000, '详细描述最多2000个字符'),
  priority: z.enum(['normal', 'urgent'])
})

type CreateInquiryForm = z.infer<typeof createInquirySchema>

const replySchema = z.object({
  content: z.string().min(1, '请输入回复内容').max(2000, '回复内容最多2000个字符')
})

type ReplyForm = z.infer<typeof replySchema>

// 快速回复模板
const quickReplyTemplates = [
  { id: '1', title: '已收到，处理中', content: '您好，您的查詢已收到，我們正在處理中，請稍候。' },
  { id: '2', title: '需要更多信息', content: '您好，為了更好地協助您，請提供以下信息：' },
  { id: '3', title: '问题已解决', content: '您好，您的問題已處理完畢，如有其他疑問歡迎再次查詢。' },
  { id: '4', title: '转交相关部门', content: '您好，您的查詢已轉交相關部門跟進，我們會盡快回覆您。' }
]

export default function InquiryPage() {
  // 状态管理
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<InquiryType | ''>('')
  const [filterStatus, setFilterStatus] = useState<InquiryStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // 弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [replies, setReplies] = useState<InquiryReply[]>([])
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState<SatisfactionRating>(5)
  const [ratingComment, setRatingComment] = useState('')
  
  // 文件上传
  const [attachments, setAttachments] = useState<File[]>([])
  const [replyAttachments, setReplyAttachments] = useState<File[]>([])
  
  // 角色切换（演示用）
  const [userRole, setUserRole] = useState<'parent' | 'staff'>('parent')
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)

  const pageSize = 20

  // 表单
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors }
  } = useForm<CreateInquiryForm>({
    resolver: zodResolver(createInquirySchema),
    defaultValues: { type: 'other', priority: 'normal' }
  })

  const {
    register: registerReply,
    handleSubmit: handleSubmitReply,
    reset: resetReply,
    setValue: setReplyValue,
    formState: { errors: replyErrors }
  } = useForm<ReplyForm>({
    resolver: zodResolver(replySchema)
  })

  // 加载查询列表
  const loadInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const response = await inquiryApi.getInquiries({
        type: filterType || undefined,
        status: filterStatus || undefined,
        search: searchQuery || undefined,
        page,
        pageSize
      })
      setInquiries(response.items)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to load inquiries:', error)
      // 使用模拟数据演示
      setInquiries([
        {
          id: '1',
          inquiryNo: 'INQ-20260608-001',
          type: 'bus',
          title: '校車路線更改查詢',
          content: '想查詢下個學期校車路線會否有更改？',
          status: 'replied',
          priority: 'normal',
          submitterId: 'parent-001',
          submitterName: '陳家長',
          studentName: '陳小明',
          studentClass: '2A',
          createdAt: '2026-06-08T10:30:00Z',
          updatedAt: '2026-06-08T11:00:00Z',
          repliedAt: '2026-06-08T11:00:00Z',
          handlerName: '李主任',
          replyCount: 2,
          hasRating: false
        },
        {
          id: '2',
          inquiryNo: 'INQ-20260607-002',
          type: 'fee',
          title: '學費繳納方式諮詢',
          content: '請問除了親自到校繳費外，還有其他繳費方式嗎？',
          status: 'pending',
          priority: 'normal',
          submitterId: 'parent-002',
          submitterName: '李家長',
          studentName: '李小紅',
          studentClass: '3B',
          createdAt: '2026-06-07T14:20:00Z',
          updatedAt: '2026-06-07T14:20:00Z',
          replyCount: 0,
          hasRating: false
        },
        {
          id: '3',
          inquiryNo: 'INQ-20260606-003',
          type: 'leave',
          title: '請假手續申請',
          content: '學生因身體不適需要請假兩天，請問需要什麼手續？',
          status: 'closed',
          priority: 'urgent',
          submitterId: 'parent-003',
          submitterName: '王家長',
          studentName: '王小明',
          studentClass: '1C',
          createdAt: '2026-06-06T09:00:00Z',
          updatedAt: '2026-06-06T16:30:00Z',
          repliedAt: '2026-06-06T10:00:00Z',
          closedAt: '2026-06-06T16:30:00Z',
          handlerName: '張老師',
          replyCount: 3,
          hasRating: true,
          rating: 5,
          ratingComment: '回覆迅速，很有幫助！'
        }
      ])
      setTotal(3)
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus, searchQuery, page])

  useEffect(() => {
    loadInquiries()
  }, [loadInquiries])

  // 创建查询
  const onCreateInquiry = async (data: CreateInquiryForm) => {
    try {
      await inquiryApi.createInquiry({
        ...data,
        attachments
      })
      setShowCreateModal(false)
      resetCreate()
      setAttachments([])
      loadInquiries()
      alert(`查詢已提交成功！查詢編號：INQ-${Date.now()}`)
    } catch (error) {
      console.error('Failed to create inquiry:', error)
      alert('提交失敗，請重試')
    }
  }

  // 查看详情
  const handleViewDetail = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setShowDetailModal(true)
    try {
      const repliesData = await inquiryApi.getReplies(inquiry.id)
      setReplies(repliesData.length > 0 ? repliesData : [
        {
          id: 'r1',
          inquiryId: inquiry.id,
          content: inquiry.content,
          senderId: inquiry.submitterId,
          senderName: inquiry.submitterName,
          senderRole: 'parent',
          createdAt: inquiry.createdAt
        },
        ...(inquiry.status !== 'pending' ? [{
          id: 'r2',
          inquiryId: inquiry.id,
          content: '您好，感謝您的查詢。我們已收到您的問題，正在處理中。',
          senderId: 'staff-001',
          senderName: inquiry.handlerName || '校務處',
          senderRole: 'staff' as const,
          createdAt: inquiry.repliedAt || inquiry.updatedAt
        }] : [])
      ])
    } catch (error) {
      console.error('Failed to load replies:', error)
    }
  }

  // 提交回复
  const onSubmitReply = async (data: ReplyForm) => {
    if (!selectedInquiry) return
    try {
      await inquiryApi.createReply({
        inquiryId: selectedInquiry.id,
        content: data.content,
        attachments: replyAttachments
      })
      resetReply()
      setReplyAttachments([])
      // 刷新回复列表
      const repliesData = await inquiryApi.getReplies(selectedInquiry.id)
      setReplies(repliesData)
      loadInquiries()
    } catch (error) {
      console.error('Failed to submit reply:', error)
      alert('回覆失敗，請重試')
    }
  }

  // 关闭查询
  const handleCloseInquiry = async () => {
    if (!selectedInquiry) return
    if (!confirm('確定要關閉此查詢嗎？')) return
    try {
      await inquiryApi.closeInquiry(selectedInquiry.id)
      setShowDetailModal(false)
      loadInquiries()
      setShowRatingModal(true)
    } catch (error) {
      console.error('Failed to close inquiry:', error)
    }
  }

  // 提交评价
  const onSubmitRating = async () => {
    if (!selectedInquiry) return
    try {
      await inquiryApi.submitRating({
        inquiryId: selectedInquiry.id,
        rating,
        comment: ratingComment
      })
      setShowRatingModal(false)
      setRating(5)
      setRatingComment('')
      loadInquiries()
      alert('感謝您的評價！')
    } catch (error) {
      console.error('Failed to submit rating:', error)
    }
  }

  // 标记为已解决
  const handleResolve = async () => {
    if (!selectedInquiry) return
    try {
      await inquiryApi.resolveInquiry(selectedInquiry.id)
      loadInquiries()
      alert('已標記為已解決')
    } catch (error) {
      console.error('Failed to resolve:', error)
    }
  }

  // 文件上传处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReply = false) => {
    const files = Array.from(e.target.files || [])
    if (isReply) {
      setReplyAttachments(prev => [...prev, ...files])
    } else {
      setAttachments(prev => [...prev, ...files])
    }
  }

  // 选择快速回复模板
  const handleSelectTemplate = (template: typeof quickReplyTemplates[0]) => {
    setReplyValue('content', template.content)
    setShowTemplateMenu(false)
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4 p-4 md:p-0">
      {/* 页面标题和角色切换 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">家長查詢</h2>
        <div className="flex items-center gap-3">
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as 'parent' | 'staff')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="parent">家長視角</option>
            <option value="staff">校務處視角</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            提交查詢
          </button>
        </div>
      </div>

      {/* 筛选器和搜索 */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索標題或內容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as InquiryType | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部類型</option>
              {Object.entries(inquiryTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as InquiryStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部狀態</option>
              {Object.entries(inquiryStatusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 查询列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">載入中...</div>
        ) : inquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="mx-auto mb-3 text-gray-300" size={48} />
            <p>暫無查詢記錄</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">查詢編號</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">類型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">標題</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">狀態</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">優先級</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">提交時間</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">{inquiry.inquiryNo}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                          {inquiryTypeLabels[inquiry.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{inquiry.title}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inquiry.status]}`}>
                          {inquiryStatusLabels[inquiry.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[inquiry.priority]}`}>
                          {inquiryPriorityLabels[inquiry.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inquiry.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(inquiry)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                          >
                            查看
                          </button>
                          {inquiry.status === 'closed' && !inquiry.hasRating && userRole === 'parent' && (
                            <button
                              onClick={() => { setSelectedInquiry(inquiry); setShowRatingModal(true) }}
                              className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition"
                            >
                              評價
                            </button>
                          )}
                          {userRole === 'staff' && inquiry.status === 'pending' && (
                            <button
                              onClick={() => handleViewDetail(inquiry)}
                              className="px-3 py-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                            >
                              回覆
                            </button>
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

      {/* 创建查询弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">提交新查詢</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitCreate(onCreateInquiry)} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">查詢類型 *</label>
                <select
                  {...registerCreate('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(inquiryTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {createErrors.type && <p className="mt-1 text-sm text-red-600">{createErrors.type.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">標題 *</label>
                <input
                  {...registerCreate('title')}
                  placeholder="請輸入查詢標題"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {createErrors.title && <p className="mt-1 text-sm text-red-600">{createErrors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">詳細描述 *</label>
                <textarea
                  {...registerCreate('content')}
                  rows={4}
                  placeholder="請詳細描述您的問題..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {createErrors.content && <p className="mt-1 text-sm text-red-600">{createErrors.content.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">優先級 *</label>
                <div className="flex gap-4">
                  {(['normal', 'urgent'] as InquiryPriority[]).map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        {...registerCreate('priority')}
                        value={p}
                        className="text-blue-600"
                      />
                      <span className={p === 'urgent' ? 'text-red-600 font-medium' : ''}>
                        {inquiryPriorityLabels[p]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">附件</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileChange(e)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-700">
                    <Paperclip className="mx-auto mb-2" size={24} />
                    <span>點擊上傳文件</span>
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText size={14} />
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  提交查詢
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 详情对话弹窗 */}
      {showDetailModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl h-[80vh] flex flex-col">
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
                  <h3 className="font-semibold">{selectedInquiry.title}</h3>
                  <p className="text-sm text-gray-500">{selectedInquiry.inquiryNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {userRole === 'staff' && selectedInquiry.status !== 'closed' && (
                  <button
                    onClick={handleResolve}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                  >
                    <CheckCircle size={16} />
                    標記已解決
                  </button>
                )}
                {selectedInquiry.status !== 'closed' && (
                  <button
                    onClick={handleCloseInquiry}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                  >
                    <X size={16} />
                    關閉
                  </button>
                )}
              </div>
            </div>

            {/* 查询信息 */}
            <div className="px-4 py-3 bg-gray-50 border-b">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {selectedInquiry.submitterName}
                  {selectedInquiry.studentName && ` (${selectedInquiry.studentName})`}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDate(selectedInquiry.createdAt)}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${statusColors[selectedInquiry.status]}`}>
                  {inquiryStatusLabels[selectedInquiry.status]}
                </span>
                {selectedInquiry.handlerName && (
                  <span className="text-gray-600">
                    處理人：{selectedInquiry.handlerName}
                  </span>
                )}
              </div>
            </div>

            {/* 对话区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`flex ${reply.senderRole === 'parent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl p-3 ${
                      reply.senderRole === 'parent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-75">{reply.senderName}</span>
                      <span className="text-xs opacity-50">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 回复输入区 */}
            {selectedInquiry.status !== 'closed' && (
              <div className="p-4 border-t">
                <form onSubmit={handleSubmitReply(onSubmitReply)} className="space-y-3">
                  {userRole === 'staff' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">快速回覆模板：</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          選擇模板
                        </button>
                        {showTemplateMenu && (
                          <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border rounded-lg shadow-lg z-10">
                            {quickReplyTemplates.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => handleSelectTemplate(template)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                              >
                                {template.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        {...registerReply('content')}
                        placeholder="輸入回覆內容..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      {replyErrors.content && (
                        <p className="text-sm text-red-600 mt-1">{replyErrors.content.message}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <Paperclip size={20} className="text-gray-500" />
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleFileChange(e, true)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="submit"
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {replyAttachments.map((file, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                          {file.name}
                          <button
                            type="button"
                            onClick={() => setReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 评价弹窗 */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-center mb-4">服務評價</h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              請對本次查詢處理進行評價，您的反饋將幫助我們改進服務
            </p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star as SatisfactionRating)}
                  className="p-1"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="其他意見或建議（可選）..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                稍後再說
              </button>
              <button
                onClick={onSubmitRating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                提交評價
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
