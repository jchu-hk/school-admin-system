import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search, Plus, Edit2, Trash2, Eye, X, ChevronLeft, ChevronRight,
  User, Phone, Mail, Calendar, Users, Filter, CheckCircle, XCircle
} from 'lucide-react'
import apiClient, { isAxiosError } from '../api/client'
import { getToken } from '../utils/tokenService'

// ============ Types & Enums ============
enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PARENT = 'parent',
  SCHOOL_STAFF = 'school_staff',
  SCHOOL_DIRECTOR = 'school_director',
  SYSTEM_ADMIN = 'system_admin',
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISABLED = 'disabled',
}

interface User {
  id: string
  username: string
  name: string
  hkId?: string
  phone?: string
  email?: string
  whatsapp?: string
  className?: string
  relatedStudentId?: string
  role: UserRole
  status: UserStatus
  otpEnabled: boolean
  passwordExpiresAt?: string
  lastLoginAt?: string
  lastLoginIp?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdBy?: string
  updatedBy?: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============ Validation Schema ============
const studentSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名不能超过50个字符'),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名不能超过100个字符'),
  hkId: z.string()
    .regex(/^[A-Z][0-9]{6}\([0-9A]\)$/, '香港身份证格式不正确，例如：A123456(7)')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^852[0-9]{8}$/, '香港手机号格式不正确，应为852开头加8位数字')
    .optional()
    .or(z.literal('')),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  whatsapp: z.string()
    .regex(/^852[0-9]{8}$/, 'WhatsApp号格式不正确，应为852开头加8位数字')
    .optional()
    .or(z.literal('')),
  className: z.string().max(50, '班级不能超过50个字符').optional().or(z.literal('')),
  password: z.string()
    .min(8, '密码至少8位')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, '密码必须包含特殊字符'),
})

type StudentFormData = z.infer<typeof studentSchema>

// ============ Constants ============
const PAGE_SIZE = 20

const CLASS_OPTIONS = [
  '1A', '1B', '1C', '1D', '1E',
  '2A', '2B', '2C', '2D', '2E',
  '3A', '3B', '3C', '3D', '3E',
  '4A', '4B', '4C', '4D', '4E',
  '5A', '5B', '5C', '5D', '5E',
  '6A', '6B', '6C', '6D', '6E',
]

const STATUS_OPTIONS = [
  { value: UserStatus.ACTIVE, label: '活跃', color: 'bg-green-100 text-green-800' },
  { value: UserStatus.INACTIVE, label: '未激活', color: 'bg-gray-100 text-gray-800' },
  { value: UserStatus.DISABLED, label: '已禁用', color: 'bg-red-100 text-red-800' },
]

// ============ Main Component ============
export default function StudentPage() {
  // State
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null)
  
  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      username: '',
      name: '',
      hkId: '',
      phone: '',
      email: '',
      whatsapp: '',
      className: '',
      password: '',
    },
  })

  // API calls
  const fetchStudents = useCallback(async () => {
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
      params.append('role', UserRole.STUDENT)
      
      if (classFilter) params.append('className', classFilter)
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await apiClient.get<PaginatedResponse<User>>(`/api/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setStudents(response.data.data || [])
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch students:', error)
      if (isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }, [page, classFilter, statusFilter, searchTerm])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Handlers
  const handleCreate = async (data: StudentFormData) => {
    try {
      const token = getToken()
      await apiClient.post('/api/users', {
        ...data,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowCreateModal(false)
      reset()
      fetchStudents()
    } catch (error) {
      console.error('Failed to create student:', error)
      throw error
    }
  }

  const handleUpdate = async (data: StudentFormData) => {
    if (!selectedStudent) return
    
    try {
      const token = getToken()
      const updateData = { ...data }
      if (!updateData.password) {
        delete (updateData as Partial<StudentFormData>).password
      }
      
      await apiClient.patch(`/api/users/${selectedStudent.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowEditModal(false)
      reset()
      fetchStudents()
    } catch (error) {
      console.error('Failed to update student:', error)
      throw error
    }
  }

  const handleDelete = async () => {
    if (!selectedStudent) return
    
    try {
      const token = getToken()
      await apiClient.delete(`/api/users/${selectedStudent.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowDeleteConfirm(false)
      setSelectedStudent(null)
      fetchStudents()
    } catch (error) {
      console.error('Failed to delete student:', error)
    }
  }

  const openEditModal = (student: User) => {
    setSelectedStudent(student)
    reset({
      username: student.username,
      name: student.name,
      hkId: student.hkId || '',
      phone: student.phone || '',
      email: student.email || '',
      whatsapp: student.whatsapp || '',
      className: student.className || '',
      password: '',
    })
    setShowEditModal(true)
  }

  const openDetailModal = (student: User) => {
    setSelectedStudent(student)
    setShowDetailModal(true)
  }

  const openDeleteConfirm = (student: User) => {
    setSelectedStudent(student)
    setShowDeleteConfirm(true)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">学生管理</h2>
        <button
          onClick={() => {
            reset()
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          新增学生
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
                placeholder="搜索学号或姓名..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Class filter */}
          <div className="w-40">
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部班级</option>
              {CLASS_OPTIONS.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
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
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">班级</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.className || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        STATUS_OPTIONS.find(s => s.value === student.status)?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {STATUS_OPTIONS.find(s => s.value === student.status)?.label || student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetailModal(student)
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="查看详情"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(student)
                          }}
                          className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition"
                          title="编辑"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteConfirm(student)
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="删除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
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
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="新增学生" onClose={() => setShowCreateModal(false)}>
          <StudentForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            isSubmitting={isSubmitting}
            register={register}
            errors={errors}
            showPassword
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedStudent && (
        <Modal title="编辑学生" onClose={() => setShowEditModal(false)}>
          <StudentForm
            onSubmit={handleUpdate}
            onCancel={() => setShowEditModal(false)}
            isSubmitting={isSubmitting}
            register={register}
            errors={errors}
            showPassword
            isEdit
          />
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedStudent && (
        <Modal title="学生详情" onClose={() => setShowDetailModal(false)}>
          <StudentDetail student={selectedStudent} />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedStudent && (
        <Modal title="删除确认" onClose={() => setShowDeleteConfirm(false)}>
          <div className="space-y-4">
            <p className="text-gray-700">
              确定要删除学生 <span className="font-semibold">{selectedStudent.name}</span> 吗？
            </p>
            <p className="text-sm text-gray-500">
              此操作将软删除该学生记录，数据可恢复。
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                确认删除
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

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  register: ReturnType<typeof useForm<StudentFormData>>['register']
  errors: ReturnType<typeof useForm<StudentFormData>>['formState']['errors']
  showPassword?: boolean
  isEdit?: boolean
}

function StudentForm({ onSubmit, onCancel, isSubmitting, register, errors, showPassword, isEdit }: StudentFormProps) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            用户名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('username')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="请输入用户名"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="请输入姓名"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">香港身份证号</label>
          <input
            type="text"
            {...register('hkId')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.hkId ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="例如：A123456(7)"
          />
          {errors.hkId && (
            <p className="mt-1 text-sm text-red-500">{errors.hkId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">班级</label>
          <select
            {...register('className')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择班级</option>
            {CLASS_OPTIONS.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
          <input
            type="text"
            {...register('phone')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="例如：85291234567"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <input
            type="email"
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="请输入邮箱"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp号</label>
          <input
            type="text"
            {...register('whatsapp')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.whatsapp ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="例如：85291234567"
          />
          {errors.whatsapp && (
            <p className="mt-1 text-sm text-red-500">{errors.whatsapp.message}</p>
          )}
        </div>

        {showPassword && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码 {!isEdit && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              {...register('password')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={isEdit ? '留空则不修改' : '请输入密码'}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">留空则不修改密码</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '提交中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

interface StudentDetailProps {
  student: User
}

function StudentDetail({ student }: StudentDetailProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailItem icon={<User size={20} />} label="用户名" value={student.username} />
        <DetailItem icon={<User size={20} />} label="姓名" value={student.name} />
        <DetailItem icon={<User size={20} />} label="香港身份证号" value={student.hkId || '-'} />
        <DetailItem icon={<Users size={20} />} label="班级" value={student.className || '-'} />
        <DetailItem icon={<Phone size={20} />} label="手机号" value={student.phone || '-'} />
        <DetailItem icon={<Mail size={20} />} label="邮箱" value={student.email || '-'} />
        <DetailItem icon={<Phone size={20} />} label="WhatsApp" value={student.whatsapp || '-'} />
        <DetailItem
          icon={<CheckCircle size={20} />}
          label="状态"
          value={
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              STATUS_OPTIONS.find(s => s.value === student.status)?.color || 'bg-gray-100 text-gray-800'
            }`}>
              {STATUS_OPTIONS.find(s => s.value === student.status)?.label || student.status}
            </span>
          }
        />
        <DetailItem
          icon={<Calendar size={20} />}
          label="创建时间"
          value={new Date(student.createdAt).toLocaleString('zh-CN')}
        />
        <DetailItem
          icon={<Calendar size={20} />}
          label="更新时间"
          value={new Date(student.updatedAt).toLocaleString('zh-CN')}
        />
        {student.lastLoginAt && (
          <DetailItem
            icon={<Calendar size={20} />}
            label="最后登录"
            value={new Date(student.lastLoginAt).toLocaleString('zh-CN')}
          />
        )}
        {student.lastLoginIp && (
          <DetailItem
            icon={<User size={20} />}
            label="最后登录IP"
            value={student.lastLoginIp}
          />
        )}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={() => window.close()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          关闭
        </button>
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
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}
