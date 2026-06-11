import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search, Plus, Eye, X, ChevronLeft, ChevronRight,
  Calendar, Clock, FileText, User, CheckCircle, XCircle, 
  Filter, Upload, History, ArrowRight, AlertCircle
} from 'lucide-react'
import apiClient, { isAxiosError } from '../api/client'
import { getToken } from '../utils/tokenService'

// ============ Types & Enums ============
enum LeaveType {
  SICK_LEAVE = 'sick_leave',
  PERSONAL_LEAVE = 'personal_leave',
  MATERNITY_LEAVE = 'maternity_leave',
  PATERNITY_LEAVE = 'paternity_leave',
  MARRIAGE_LEAVE = 'marriage_leave',
  BEREAVEMENT_LEAVE = 'bereavement_leave',
  OTHER = 'other',
}

enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PARENT = 'parent',
  SCHOOL_STAFF = 'school_staff',
  SCHOOL_DIRECTOR = 'school_director',
  SYSTEM_ADMIN = 'system_admin',
}

interface User {
  id: string
  username: string
  name: string
  role: UserRole
}

interface Leave {
  id: string
  applicantId: string
  applicant?: User
  leaveType: LeaveType
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  totalDays: number
  totalHours?: number
  reason: string
  status: LeaveStatus
  substituteTeacherId?: string
  substituteTeacher?: User
  substituteTeacherClassHours?: number
  approverId?: string
  approver?: User
  approvedAt?: string
  approvalComment?: string
  attachmentUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface PaginatedResponse {
  leaves: Leave[]
  total: number
}

interface ApprovalHistory {
  id: string
  action: 'submit' | 'approve' | 'reject' | 'cancel'
  actor: User
  comment?: string
  createdAt: string
}

// ============ Constants ============
const PAGE_SIZE = 20

const LEAVE_TYPE_OPTIONS = [
  { value: LeaveType.SICK_LEAVE, label: '病假', color: 'bg-red-100 text-red-800' },
  { value: LeaveType.PERSONAL_LEAVE, label: '事假', color: 'bg-blue-100 text-blue-800' },
  { value: LeaveType.MATERNITY_LEAVE, label: '产假', color: 'bg-pink-100 text-pink-800' },
  { value: LeaveType.PATERNITY_LEAVE, label: '陪产假', color: 'bg-indigo-100 text-indigo-800' },
  { value: LeaveType.MARRIAGE_LEAVE, label: '婚假', color: 'bg-purple-100 text-purple-800' },
  { value: LeaveType.BEREAVEMENT_LEAVE, label: '丧假', color: 'bg-gray-100 text-gray-800' },
  { value: LeaveType.OTHER, label: '其他', color: 'bg-yellow-100 text-yellow-800' },
]

const LEAVE_STATUS_OPTIONS = [
  { value: LeaveStatus.PENDING, label: '待审批', color: 'bg-yellow-100 text-yellow-800' },
  { value: LeaveStatus.APPROVED, label: '已通过', color: 'bg-green-100 text-green-800' },
  { value: LeaveStatus.REJECTED, label: '已拒绝', color: 'bg-red-100 text-red-800' },
  { value: LeaveStatus.CANCELLED, label: '已取消', color: 'bg-gray-100 text-gray-800' },
]

// ============ Validation Schema ============
const leaveSchema = z.object({
  leaveType: z.nativeEnum(LeaveType, { message: '请选择请假类型' }),
  startDate: z.string().min(1, '请选择开始日期'),
  endDate: z.string().min(1, '请选择结束日期'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().min(1, '请假原因不能为空').max(500, '请假原因不能超过500字'),
  substituteTeacherId: z.string().optional(),
})

type LeaveFormData = z.infer<typeof leaveSchema>

const approvalSchema = z.object({
  comment: z.string().max(500, '审批意见不能超过500字').optional(),
  substituteTeacherId: z.string().optional(),
  substituteTeacherClassHours: z.number().min(0).optional(),
})

type ApprovalFormData = z.infer<typeof approvalSchema>

// ============ Helper Functions ============
const calculateDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// ============ Main Component ============
export default function LeavePage() {
  // Get current user info
  const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  }

  const currentUser = getCurrentUser()
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'pending'>('all')

  // State
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [teachers, setTeachers] = useState<User[]>([])

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null)
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([])

  // Forms
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveType: LeaveType.PERSONAL_LEAVE,
      startDate: '',
      endDate: '',
      startTime: '09:00',
      endTime: '17:00',
      reason: '',
      substituteTeacherId: '',
    },
  })

  const {
    register: registerApproval,
    handleSubmit: handleSubmitApproval,
    reset: resetApproval,
    formState: { errors: approvalErrors, isSubmitting: isApproving },
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const totalDays = calculateDays(startDate, endDate)

  // Fetch teachers for substitute teacher selection
  const fetchTeachers = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await apiClient.get('/api/users?role=teacher&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTeachers(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }, [])

  // API calls
  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        window.location.href = '/login'
        return
      }

      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', PAGE_SIZE.toString())

      if (activeTab === 'my' && currentUser) {
        params.append('applicantId', currentUser.id)
      }

      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('leaveType', typeFilter)

      const response = await apiClient.get<PaginatedResponse>(`/api/leaves?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      let filteredLeaves = response.data.leaves || []

      // Client-side search by applicant name
      if (searchTerm) {
        filteredLeaves = filteredLeaves.filter(leave =>
          leave.applicant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leave.applicant?.username?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Filter pending for approval tab (simplified logic - in real app, check approver roles)
      if (activeTab === 'pending') {
        filteredLeaves = filteredLeaves.filter(leave => leave.status === LeaveStatus.PENDING)
      }

      setLeaves(filteredLeaves)
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch leaves:', error)
      if (isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, typeFilter, searchTerm, activeTab, currentUser])

  useEffect(() => {
    fetchLeaves()
    fetchTeachers()
  }, [fetchLeaves, fetchTeachers])

  // Handlers
  const handleCreate = async (data: LeaveFormData) => {
    try {
      const token = getToken()
      const user = getCurrentUser()
      
      if (!user) {
        throw new Error('用户未登录')
      }

      await apiClient.post('/api/leaves', {
        ...data,
        applicantId: user.id,
        totalDays,
        createdBy: user.id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowCreateModal(false)
      reset()
      fetchLeaves()
    } catch (error) {
      console.error('Failed to create leave:', error)
      throw error
    }
  }

  const handleApprove = async (data: ApprovalFormData) => {
    if (!selectedLeave) return

    try {
      const token = getToken()
      const user = getCurrentUser()
      
      await apiClient.post(`/api/leaves/${selectedLeave.id}/approve`, {
        approved: true,
        approvalComment: data.comment,
        substituteTeacherId: data.substituteTeacherId,
        substituteTeacherClassHours: data.substituteTeacherClassHours,
        approverId: user?.id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowApproveModal(false)
      resetApproval()
      fetchLeaves()
    } catch (error) {
      console.error('Failed to approve leave:', error)
      throw error
    }
  }

  const handleReject = async (data: ApprovalFormData) => {
    if (!selectedLeave) return

    try {
      const token = getToken()
      const user = getCurrentUser()
      
      await apiClient.post(`/api/leaves/${selectedLeave.id}/reject`, {
        rejectionReason: data.comment,
        approverId: user?.id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowRejectModal(false)
      resetApproval()
      fetchLeaves()
    } catch (error) {
      console.error('Failed to reject leave:', error)
      throw error
    }
  }

  const handleCancel = async () => {
    if (!selectedLeave) return

    try {
      const token = getToken()
      const user = getCurrentUser()
      
      await apiClient.post(`/api/leaves/${selectedLeave.id}/cancel`, {
        cancelledBy: user?.id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowCancelConfirm(false)
      fetchLeaves()
    } catch (error) {
      console.error('Failed to cancel leave:', error)
    }
  }

  const openDetailModal = (leave: Leave) => {
    setSelectedLeave(leave)
    // Generate mock approval history (in real app, fetch from API)
    const history: ApprovalHistory[] = [
      {
        id: '1',
        action: 'submit',
        actor: leave.applicant || { id: leave.applicantId, name: '申请人', username: '', role: UserRole.TEACHER },
        createdAt: leave.createdAt,
      },
    ]
    if (leave.status !== LeaveStatus.PENDING) {
      history.push({
        id: '2',
        action: leave.status === LeaveStatus.APPROVED ? 'approve' : 'reject',
        actor: leave.approver || { id: leave.approverId || '', name: '审批人', username: '', role: UserRole.SCHOOL_DIRECTOR },
        comment: leave.approvalComment,
        createdAt: leave.approvedAt || leave.updatedAt,
      })
    }
    setApprovalHistory(history)
    setShowDetailModal(true)
  }

  const openApproveModal = (leave: Leave) => {
    setSelectedLeave(leave)
    resetApproval()
    setShowApproveModal(true)
  }

  const openRejectModal = (leave: Leave) => {
    setSelectedLeave(leave)
    resetApproval()
    setShowRejectModal(true)
  }

  const openCancelConfirm = (leave: Leave) => {
    setSelectedLeave(leave)
    setShowCancelConfirm(true)
  }

  const canApprove = (leave: Leave): boolean => {
    if (leave.status !== LeaveStatus.PENDING) return false
    // Check if user has approval permission (simplified)
    const user = getCurrentUser()
    if (!user) return false
    return [UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.SYSTEM_ADMIN].includes(user.role)
  }

  const canCancel = (leave: Leave): boolean => {
    if (leave.status !== LeaveStatus.PENDING) return false
    const user = getCurrentUser()
    if (!user) return false
    return leave.applicantId === user.id
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Render
  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">请假管理</h2>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setActiveTab('all'); setPage(1) }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                activeTab === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部请假
            </button>
            <button
              onClick={() => { setActiveTab('my'); setPage(1) }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                activeTab === 'my' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              我的请假
            </button>
            {[UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.SYSTEM_ADMIN].includes(currentUser?.role || '') && (
              <button
                onClick={() => { setActiveTab('pending'); setPage(1) }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  activeTab === 'pending' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                待审批
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            reset()
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          申请请假
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索申请人姓名..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部状态</option>
              {LEAVE_STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="w-40">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部类型</option>
              {LEAVE_TYPE_OPTIONS.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">请假类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">请假时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">天数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无请假记录
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => openDetailModal(leave)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        {leave.applicant?.name || leave.applicantId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        LEAVE_TYPE_OPTIONS.find(t => t.value === leave.leaveType)?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {LEAVE_TYPE_OPTIONS.find(t => t.value === leave.leaveType)?.label || leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(leave.startDate)} ~ {formatDate(leave.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {leave.totalDays} 天
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        LEAVE_STATUS_OPTIONS.find(s => s.value === leave.status)?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {LEAVE_STATUS_OPTIONS.find(s => s.value === leave.status)?.label || leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetailModal(leave)
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="查看详情"
                        >
                          <Eye size={18} />
                        </button>
                        {canApprove(leave) && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openApproveModal(leave)
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                              title="通过"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openRejectModal(leave)
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                              title="拒绝"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {canCancel(leave) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openCancelConfirm(leave)
                            }}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="取消申请"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第 <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> 到{' '}
                  <span className="font-medium">{Math.min(page * PAGE_SIZE, total)}</span> 条，
                  共 <span className="font-medium">{total}</span> 条
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="申请请假" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                请假类型 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('leaveType')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.leaveType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {LEAVE_TYPE_OPTIONS.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.leaveType && (
                <p className="mt-1 text-sm text-red-500">{errors.leaveType.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                <input
                  type="time"
                  {...register('startTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                <input
                  type="time"
                  {...register('endTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock size={18} />
                <span className="font-medium">预计请假天数: {totalDays} 天</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                请假原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('reason')}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入请假原因..."
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-500">{errors.reason.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">代课教师</label>
              <select
                {...register('substituteTeacherId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择代课教师</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">附件上传</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-1 text-sm text-gray-500">点击上传附件（如医疗证明）</p>
                <p className="text-xs text-gray-400">支持 PDF、JPG、PNG 格式</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '提交中...' : '提交申请'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLeave && (
        <Modal title="请假详情" onClose={() => setShowDetailModal(false)}>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <DetailItem icon={<User size={18} />} label="申请人" value={selectedLeave.applicant?.name || selectedLeave.applicantId} />
              <DetailItem 
                icon={<FileText size={18} />} 
                label="请假类型" 
                value={
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    LEAVE_TYPE_OPTIONS.find(t => t.value === selectedLeave.leaveType)?.color
                  }`}>
                    {LEAVE_TYPE_OPTIONS.find(t => t.value === selectedLeave.leaveType)?.label}
                  </span>
                } 
              />
              <DetailItem 
                icon={<Calendar size={18} />} 
                label="请假时间" 
                value={`${formatDate(selectedLeave.startDate)} ~ ${formatDate(selectedLeave.endDate)}`} 
              />
              <DetailItem icon={<Clock size={18} />} label="请假天数" value={`${selectedLeave.totalDays} 天`} />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">请假原因</h4>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLeave.reason}</p>
            </div>

            {selectedLeave.substituteTeacher && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">代课教师</h4>
                <p className="text-sm text-gray-900">{selectedLeave.substituteTeacher.name}</p>
              </div>
            )}

            {selectedLeave.attachmentUrl && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">附件</h4>
                <a 
                  href={selectedLeave.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  查看附件
                </a>
              </div>
            )}

            {/* Approval History */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <History size={18} />
                审批记录
              </h4>
              <div className="space-y-3">
                {approvalHistory.map((record, index) => (
                  <div key={record.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{record.actor.name}</span>
                        <span className="text-xs text-gray-500">
                          {record.action === 'submit' ? '提交申请' : 
                           record.action === 'approve' ? '审批通过' : 
                           record.action === 'reject' ? '审批拒绝' : '取消申请'}
                        </span>
                      </div>
                      {record.comment && (
                        <p className="text-sm text-gray-600 mt-1">{record.comment}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(record.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Status */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">当前状态</span>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  LEAVE_STATUS_OPTIONS.find(s => s.value === selectedLeave.status)?.color
                }`}>
                  {LEAVE_STATUS_OPTIONS.find(s => s.value === selectedLeave.status)?.label}
                </span>
              </div>
              {selectedLeave.approver && (
                <p className="text-sm text-gray-500 mt-2">
                  审批人: {selectedLeave.approver.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              {canApprove(selectedLeave) && (
                <>
                  <button
                    onClick={() => { setShowDetailModal(false); openApproveModal(selectedLeave) }}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => { setShowDetailModal(false); openRejectModal(selectedLeave) }}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    拒绝
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                关闭
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedLeave && (
        <Modal title="审批通过" onClose={() => setShowApproveModal(false)}>
          <form onSubmit={handleSubmitApproval(handleApprove)} className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-green-800">审批通过确认</p>
                  <p className="text-sm text-green-700 mt-1">
                    申请人: {selectedLeave.applicant?.name}<br />
                    请假时间: {formatDate(selectedLeave.startDate)} ~ {formatDate(selectedLeave.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">审批意见</label>
              <textarea
                {...registerApproval('comment')}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  approvalErrors.comment ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入审批意见（可选）..."
              />
              {approvalErrors.comment && (
                <p className="mt-1 text-sm text-red-500">{approvalErrors.comment.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">指定代课教师</label>
              <select
                {...registerApproval('substituteTeacherId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">请选择代课教师</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">代课课时</label>
              <input
                type="number"
                min="0"
                {...registerApproval('substituteTeacherClassHours', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="请输入代课课时"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isApproving}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? '处理中...' : '确认通过'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedLeave && (
        <Modal title="审批拒绝" onClose={() => setShowRejectModal(false)}>
          <form onSubmit={handleSubmitApproval(handleReject)} className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-red-800">审批拒绝确认</p>
                  <p className="text-sm text-red-700 mt-1">
                    申请人: {selectedLeave.applicant?.name}<br />
                    请假时间: {formatDate(selectedLeave.startDate)} ~ {formatDate(selectedLeave.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                拒绝原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...registerApproval('comment')}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                  approvalErrors.comment ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入拒绝原因..."
              />
              {approvalErrors.comment && (
                <p className="mt-1 text-sm text-red-500">{approvalErrors.comment.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isApproving}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? '处理中...' : '确认拒绝'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Confirmation */}
      {showCancelConfirm && selectedLeave && (
        <Modal title="取消申请" onClose={() => setShowCancelConfirm(false)}>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-yellow-800">确认取消请假申请?</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    请假时间: {formatDate(selectedLeave.startDate)} ~ {formatDate(selectedLeave.endDate)}<br />
                    取消后将无法恢复。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                保留申请
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                确认取消
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ============ Sub-components ============

interface ModalProps {
  title: string
  children: React.ReactNode
  onClose: () => void
}

function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

interface DetailItemProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  )
}
