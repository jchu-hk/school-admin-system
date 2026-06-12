import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search, Plus, Edit2, Trash2, Eye, X, ChevronLeft, ChevronRight,
  User, Phone, Mail, Users, Filter, CheckCircle, XCircle, Shield,
  Key, Upload, Download, Lock, UserCog, Settings2
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
  department?: string
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

interface Role {
  id: string
  name: string
  code: UserRole
  description?: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============ Validation Schema ============
const userSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名不能超过50个字符'),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名不能超过100个字符'),
  role: z.enum([UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT, UserRole.SCHOOL_STAFF, UserRole.SCHOOL_DIRECTOR, UserRole.SYSTEM_ADMIN]),
  department: z.string().max(100, '部门不能超过100个字符').optional().or(z.literal('')),
  phone: z.string()
    .regex(/^852[0-9]{8}$/, '香港手机号格式不正确，应为852开头加8位数字')
    .optional()
    .or(z.literal('')),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  password: z.string()
    .min(8, '密码至少8位')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, '密码必须包含特殊字符')
    .optional()
    .or(z.literal('')),
})

type UserFormData = z.infer<typeof userSchema>

// ============ Constants ============
const PAGE_SIZE = 20

const ROLE_OPTIONS = [
  { value: UserRole.STUDENT, label: '学生', color: 'bg-blue-100 text-blue-800' },
  { value: UserRole.TEACHER, label: '教师', color: 'bg-green-100 text-green-800' },
  { value: UserRole.PARENT, label: '家长', color: 'bg-purple-100 text-purple-800' },
  { value: UserRole.SCHOOL_STAFF, label: '学校职员', color: 'bg-yellow-100 text-yellow-800' },
  { value: UserRole.SCHOOL_DIRECTOR, label: '学校主任', color: 'bg-orange-100 text-orange-800' },
  { value: UserRole.SYSTEM_ADMIN, label: '系统管理员', color: 'bg-red-100 text-red-800' },
]

const STATUS_OPTIONS = [
  { value: UserStatus.ACTIVE, label: '活跃', color: 'bg-green-100 text-green-800' },
  { value: UserStatus.INACTIVE, label: '未激活', color: 'bg-gray-100 text-gray-800' },
  { value: UserStatus.DISABLED, label: '已禁用', color: 'bg-red-100 text-red-800' },
]

const DEPARTMENT_OPTIONS = [
  '教务处',
  '学生事务处',
  '财务部',
  '行政部',
  '图书馆',
  '体育部',
  '科学部',
  '艺术部',
  '信息技术部',
]

// 权限列表
const PERMISSIONS = [
  { key: 'user:read', label: '查看用户', category: '用户管理' },
  { key: 'user:create', label: '创建用户', category: '用户管理' },
  { key: 'user:update', label: '编辑用户', category: '用户管理' },
  { key: 'user:delete', label: '删除用户', category: '用户管理' },
  { key: 'student:read', label: '查看学生', category: '学生管理' },
  { key: 'student:create', label: '创建学生', category: '学生管理' },
  { key: 'student:update', label: '编辑学生', category: '学生管理' },
  { key: 'student:delete', label: '删除学生', category: '学生管理' },
  { key: 'leave:read', label: '查看请假', category: '请假管理' },
  { key: 'leave:approve', label: '审批请假', category: '请假管理' },
  { key: 'inquiry:read', label: '查看查询', category: '家长查询' },
  { key: 'inquiry:reply', label: '回复查询', category: '家长查询' },
  { key: 'course:read', label: '查看课程', category: '课程管理' },
  { key: 'course:manage', label: '管理课程', category: '课程管理' },
  { key: 'report:read', label: '查看报表', category: '报表管理' },
  { key: 'system:settings', label: '系统设置', category: '系统管理' },
]

// ============ Main Component ============
export default function UserPage() {
  // State
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [newPassword, setNewPassword] = useState('')
  
  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      name: '',
      role: UserRole.SCHOOL_STAFF,
      department: '',
      phone: '',
      email: '',
      password: '',
    },
  })

  // API calls
  const fetchUsers = useCallback(async () => {
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
      
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('status', statusFilter)
      if (departmentFilter) params.append('department', departmentFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await apiClient.get<{ users: User[]; total: number; page?: number; limit?: number; totalPages?: number }>(`/api/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setUsers(response.data.users || [])
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      if (isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, statusFilter, departmentFilter, searchTerm])

  const fetchRoles = useCallback(async () => {
    try {
      const token = getToken()
      const response = await apiClient.get<Role[]>('/api/roles', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRoles(response.data || [])
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [fetchUsers, fetchRoles])

  // Handlers
  const handleCreate = async (data: UserFormData) => {
    try {
      const token = getToken()
      await apiClient.post('/api/users', {
        ...data,
        status: UserStatus.ACTIVE,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowCreateModal(false)
      reset()
      fetchUsers()
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    }
  }

  const handleUpdate = async (data: UserFormData) => {
    if (!selectedUser) return
    
    try {
      const token = getToken()
      const updateData = { ...data }
      if (!updateData.password) {
        delete (updateData as Partial<UserFormData>).password
      }
      
      await apiClient.patch(`/api/users/${selectedUser.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowEditModal(false)
      reset()
      fetchUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    
    try {
      const token = getToken()
      await apiClient.delete(`/api/users/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowDeleteConfirm(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      const token = getToken()
      const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE
      await apiClient.patch(`/api/users/${user.id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchUsers()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return
    
    try {
      const token = getToken()
      await apiClient.post(`/api/users/${selectedUser.id}/reset-password`, { password: newPassword }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowResetPasswordModal(false)
      setNewPassword('')
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to reset password:', error)
    }
  }

  const handleImportExcel = () => {
    // 触发文件选择
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const formData = new FormData()
      formData.append('file', file)
      
      try {
        const token = getToken()
        await apiClient.post('/api/users/import', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        })
        fetchUsers()
        alert('导入成功')
      } catch (error) {
        console.error('Failed to import users:', error)
        alert('导入失败')
      }
    }
    input.click()
  }

  const handleDownloadTemplate = () => {
    const headers = ['username', 'name', 'role', 'department', 'phone', 'email', 'password']
    const csv = headers.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'user_import_template.csv'
    link.click()
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    reset({
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      email: user.email || '',
      password: '',
    })
    setShowEditModal(true)
  }

  const openDetailModal = (user: User) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  const openDeleteConfirm = (user: User) => {
    setSelectedUser(user)
    setShowDeleteConfirm(true)
  }

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user)
    setNewPassword('')
    setShowResetPasswordModal(true)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Render
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-6 border-b-2 font-medium text-sm transition ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="inline-block mr-2" size={18} />
            用户管理
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-4 px-6 border-b-2 font-medium text-sm transition ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="inline-block mr-2" size={18} />
            角色权限
          </button>
        </nav>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">用户管理</h2>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                <Download size={18} />
                下载模板
              </button>
              <button
                onClick={handleImportExcel}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                <Upload size={18} />
                批量导入
              </button>
              <button
                onClick={() => {
                  reset()
                  setShowCreateModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={20} />
                新增用户
              </button>
            </div>
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
                    placeholder="搜索用户名或姓名..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Role filter */}
              <div className="w-40">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部角色</option>
                  {ROLE_OPTIONS.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {/* Department filter */}
              <div className="w-40">
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部部门</option>
                  {DEPARTMENT_OPTIONS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
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
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            ROLE_OPTIONS.find(r => r.value === user.role)?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            STATUS_OPTIONS.find(s => s.value === user.status)?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {STATUS_OPTIONS.find(s => s.value === user.status)?.label || user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openDetailModal(user)
                              }}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="查看详情"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(user)
                              }}
                              className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition"
                              title="编辑"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openResetPasswordModal(user)
                              }}
                              className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition"
                              title="重置密码"
                            >
                              <Key size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleStatus(user)
                              }}
                              className={`p-1.5 rounded transition ${
                                user.status === UserStatus.ACTIVE
                                  ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={user.status === UserStatus.ACTIVE ? '禁用' : '启用'}
                            >
                              {user.status === UserStatus.ACTIVE ? <XCircle size={18} /> : <CheckCircle size={18} />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteConfirm(user)
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
        </>
      ) : (
        /* Role Management */
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">角色权限管理</h2>
            <button
              onClick={() => {
                setSelectedRole(null)
                setShowRoleModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              新增角色
            </button>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROLE_OPTIONS.map((roleOption) => {
              const roleUsers = users.filter(u => u.role === roleOption.value).length
              return (
                <div key={roleOption.value} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${roleOption.color}`}>
                        {roleOption.label}
                      </span>
                      <p className="text-sm text-gray-500 mt-2">{roleOption.value}</p>
                    </div>
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Users size={24} className="text-gray-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{roleUsers}</span>
                    <span className="text-sm text-gray-500">用户</span>
                  </div>
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <button
                      onClick={() => {
                        const role: Role = {
                          id: roleOption.value,
                          name: roleOption.label,
                          code: roleOption.value,
                          permissions: [],
                          createdAt: '',
                          updatedAt: '',
                        }
                        setSelectedRole(role)
                        setShowPermissionModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      <Settings2 size={16} />
                      配置权限
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Permission Matrix */}
          <div className="bg-white rounded-xl shadow overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">权限矩阵</h3>
              <p className="text-sm text-gray-500 mt-1">查看各角色的权限配置</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">权限</th>
                    {ROLE_OPTIONS.map(role => (
                      <th key={role.value} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {role.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {PERMISSIONS.map((perm) => (
                    <tr key={perm.key} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                          <p className="text-xs text-gray-500">{perm.category}</p>
                        </div>
                      </td>
                      {ROLE_OPTIONS.map(role => (
                        <td key={role.value} className="px-4 py-3 text-center">
                          {role.value === UserRole.SYSTEM_ADMIN ? (
                            <CheckCircle size={18} className="mx-auto text-green-500" />
                          ) : role.value === UserRole.SCHOOL_DIRECTOR && ['user:read', 'student:read', 'leave:read', 'inquiry:read', 'course:read', 'report:read'].includes(perm.key) ? (
                            <CheckCircle size={18} className="mx-auto text-green-500" />
                          ) : role.value === UserRole.SCHOOL_STAFF && ['student:read', 'leave:read', 'inquiry:read', 'course:read'].includes(perm.key) ? (
                            <CheckCircle size={18} className="mx-auto text-green-500" />
                          ) : role.value === UserRole.TEACHER && ['student:read', 'leave:read', 'course:read'].includes(perm.key) ? (
                            <CheckCircle size={18} className="mx-auto text-green-500" />
                          ) : (
                            <XCircle size={18} className="mx-auto text-gray-300" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="新增用户" onClose={() => setShowCreateModal(false)}>
          <UserForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            isSubmitting={isSubmitting}
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <Modal title="编辑用户" onClose={() => setShowEditModal(false)}>
          <UserForm
            onSubmit={handleUpdate}
            onCancel={() => setShowEditModal(false)}
            isSubmitting={isSubmitting}
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
            isEdit
          />
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <Modal title="用户详情" onClose={() => setShowDetailModal(false)}>
          <UserDetail user={selectedUser} />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedUser && (
        <Modal title="删除确认" onClose={() => setShowDeleteConfirm(false)}>
          <div className="space-y-4">
            <p className="text-gray-700">
              确定要删除用户 <span className="font-semibold">{selectedUser.name}</span> 吗？
            </p>
            <p className="text-sm text-gray-500">
              此操作将软删除该用户记录，数据可恢复。
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

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <Modal title="重置密码" onClose={() => setShowResetPasswordModal(false)}>
          <div className="space-y-4">
            <p className="text-gray-700">
              为用户 <span className="font-semibold">{selectedUser.name}</span> 重置密码
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                新密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="请输入新密码"
              />
              <p className="mt-1 text-xs text-gray-500">
                密码至少8位，包含大小写字母、数字和特殊字符
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                取消
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPassword || newPassword.length < 8}
                className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认重置
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Permission Modal */}
      {showPermissionModal && selectedRole && (
        <PermissionModal
          role={selectedRole}
          onClose={() => setShowPermissionModal(false)}
        />
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
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
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

interface UserFormProps {
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  register: ReturnType<typeof useForm<UserFormData>>['register']
  handleSubmit: ReturnType<typeof useForm<UserFormData>>['handleSubmit']
  errors: ReturnType<typeof useForm<UserFormData>>['formState']['errors']
  isEdit?: boolean
}

function UserForm({ onSubmit, onCancel, isSubmitting, register, handleSubmit, errors, isEdit }: UserFormProps) {
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
            disabled={isEdit}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            } ${isEdit ? 'bg-gray-100' : ''}`}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            角色 <span className="text-red-500">*</span>
          </label>
          <select
            {...register('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {ROLE_OPTIONS.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
          <select
            {...register('department')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择部门</option>
            {DEPARTMENT_OPTIONS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
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

        <div className={isEdit ? 'col-span-2' : 'col-span-2'}>
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

interface UserDetailProps {
  user: User
}

function UserDetail({ user }: UserDetailProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailItem icon={<User size={20} />} label="用户名" value={user.username} />
        <DetailItem icon={<User size={20} />} label="姓名" value={user.name} />
        <DetailItem 
          icon={<Shield size={20} />} 
          label="角色" 
          value={
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              ROLE_OPTIONS.find(r => r.value === user.role)?.color || 'bg-gray-100 text-gray-800'
            }`}>
              {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
            </span>
          } 
        />
        <DetailItem icon={<Users size={20} />} label="部门" value={user.department || '-'} />
        <DetailItem icon={<Phone size={20} />} label="手机号" value={user.phone || '-'} />
        <DetailItem icon={<Mail size={20} />} label="邮箱" value={user.email || '-'} />
        <DetailItem 
          icon={<CheckCircle size={20} />} 
          label="状态" 
          value={
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              STATUS_OPTIONS.find(s => s.value === user.status)?.color || 'bg-gray-100 text-gray-800'
            }`}>
              {STATUS_OPTIONS.find(s => s.value === user.status)?.label || user.status}
            </span>
          } 
        />
        <DetailItem 
          icon={<Lock size={20} />} 
          label="双因素认证" 
          value={user.otpEnabled ? '已启用' : '未启用'} 
        />
        <DetailItem 
          icon={<UserCog size={20} />} 
          label="创建时间" 
          value={new Date(user.createdAt).toLocaleString('zh-CN')} 
        />
        <DetailItem 
          icon={<UserCog size={20} />} 
          label="更新时间" 
          value={new Date(user.updatedAt).toLocaleString('zh-CN')} 
        />
        {user.lastLoginAt && (
          <DetailItem 
            icon={<UserCog size={20} />} 
            label="最后登录" 
            value={new Date(user.lastLoginAt).toLocaleString('zh-CN')} 
          />
        )}
        {user.lastLoginIp && (
          <DetailItem 
            icon={<UserCog size={20} />} 
            label="最后登录IP" 
            value={user.lastLoginIp} 
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

interface PermissionModalProps {
  role: Role
  onClose: () => void
}

function PermissionModal({ role, onClose }: PermissionModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role.permissions || [])

  const handleSave = async () => {
    try {
      const token = getToken()
      await apiClient.patch(`/api/roles/${role.id}`, { permissions: selectedPermissions }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      onClose()
    } catch (error) {
      console.error('Failed to save permissions:', error)
    }
  }

  const togglePermission = (permKey: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permKey) 
        ? prev.filter(p => p !== permKey)
        : [...prev, permKey]
    )
  }

  // 按分类分组权限
  const groupedPermissions = PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, typeof PERMISSIONS>)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">配置权限 - {role.name}</h3>
              <p className="text-sm text-gray-500 mt-1">勾选该角色拥有的权限</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{category}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {perms.map(perm => (
                    <label key={perm.key} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              保存权限配置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
