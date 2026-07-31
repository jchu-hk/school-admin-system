import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search, Plus, Edit2, Trash2, Eye, X, ChevronLeft, ChevronRight,
  User, Phone, Mail, Calendar, Users, Home
} from 'lucide-react'
import apiClient, { isAxiosError } from '../api/client'
import { getToken } from '../utils/tokenService'

// ============ Types ============
enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

enum StudentStatus {
  ACTIVE = 'active',
  GRADUATED = 'graduated',
  WITHDRAWN = 'withdrawn',
  TRANSFERRED = 'transferred',
}

interface Student {
  id: string
  student_id?: string          // 学号（如 2026-0001）
  name_zh: string              // 中文姓名
  name_en?: string             // 英文姓名
  gender: Gender               // 性别
  birth_date: string           // 出生日期 YYYY-MM-DD
  admission_date: string       // 入学日期 YYYY-MM-DD
  address?: string
  phone?: string
  email?: string
  hk_id?: string
  guardian_name?: string        // 监护人姓名
  guardian_phone?: string       // 监护人电话
  guardian_relationship?: string
  emergency_contact?: string   // 紧急联系人
  emergency_phone?: string     // 紧急联系电话
  notes?: string
  status: StudentStatus
  class_name?: string          // 来自联表查询
  class_id?: string
  academic_year?: string
  created_at: string
  updated_at: string
}

interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

type ClassApiResponse = { id: string; name: string; grade?: string }[]

// ============ Validation Schema ============
const createStudentSchema = z.object({
  student_id: z.string().max(10).optional().or(z.literal('')),
  name_zh: z.string().min(1, '中文姓名不能为空').max(100),
  class_id: z.string().optional().or(z.literal('')),
  name_en: z.string().max(100).optional().or(z.literal('')),
  gender: z.string(), // Allow empty string for form, validate on submit

  birth_date: z.string().min(1, '请选择出生日期'),
  admission_date: z.string().min(1, '请选择入学日期'),
  hk_id: z.string().regex(/^[A-Z][0-9]{6}\([0-9A]\)$/, '香港身份证格式不正确').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  guardian_name: z.string().max(100).optional().or(z.literal('')),
  guardian_phone: z.string().max(20).optional().or(z.literal('')),
  guardian_relationship: z.string().max(50).optional().or(z.literal('')),
  emergency_contact: z.string().max(100).optional().or(z.literal('')),
  emergency_phone: z.string().max(20).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal('')),
})

const editStudentSchema = createStudentSchema

// Submission validation schema (enforces required fields)
const studentSubmissionSchema = z.object({
  student_id: z.string().max(10).optional().or(z.literal('')),
  name_zh: z.string().min(1, '中文姓名不能为空').max(100),
  class_id: z.string().optional().or(z.literal('')),
  name_en: z.string().max(100).optional().or(z.literal('')),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER], {
    required_error: '请选择性别',
  }),
  birth_date: z.string().min(1, '请选择出生日期'),
  admission_date: z.string().min(1, '请选择入学日期'),
  hk_id: z.string().regex(/^[A-Z][0-9]{6}\([0-9A]\)$/, '香港身份证格式不正确').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  guardian_name: z.string().max(100).optional().or(z.literal('')),
  guardian_phone: z.string().max(20).optional().or(z.literal('')),
  guardian_relationship: z.string().max(50).optional().or(z.literal('')),
  emergency_contact: z.string().max(100).optional().or(z.literal('')),
  emergency_phone: z.string().max(20).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum([StudentStatus.ACTIVE, StudentStatus.GRADUATED, StudentStatus.WITHDRAWN, StudentStatus.TRANSFERRED], {
    required_error: '请选择状态',
  }),
})

type StudentFormData = z.infer<typeof createStudentSchema>

// ============ Constants ============
const PAGE_SIZE = 20

const GENDER_OPTIONS = [
  { value: Gender.MALE, label: '男' },
  { value: Gender.FEMALE, label: '女' },
  { value: Gender.OTHER, label: '其他' },
]

const STATUS_OPTIONS = [
  { value: StudentStatus.ACTIVE, label: '在读', color: 'bg-green-100 text-green-800' },
  { value: StudentStatus.GRADUATED, label: '已毕业', color: 'bg-blue-100 text-blue-800' },
  { value: StudentStatus.WITHDRAWN, label: '已退学', color: 'bg-gray-100 text-gray-800' },
  { value: StudentStatus.TRANSFERRED, label: '已转学', color: 'bg-yellow-100 text-yellow-800' },
]

const TODAY = new Date().toISOString().split('T')[0]

// 删除权限：仅允许删除“在读”状态的学生（该学生不在当前在册名单内）。
// 注意：系统中不存在 draft 状态，因此无法按“仅 Draft 可删除”实现，#296 已按真实状态收敛。
const canDeleteStudent = (status?: StudentStatus): boolean => status === StudentStatus.ACTIVE

const DEFAULT_FORM_VALUES = {
  student_id: '',
  name_zh: '',
  class_id: '',
  name_en: '',
  gender: '',
  birth_date: '',
  admission_date: TODAY,
  hk_id: '',
  phone: '',
  email: '',
  address: '',
  guardian_name: '',
  guardian_phone: '',
  guardian_relationship: '',
  emergency_contact: '',
  emergency_phone: '',
  notes: '',
  status: StudentStatus.ACTIVE,
}

// ============ Sub-components ============
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/50" onClick={onClose} />
        <div className="relative z-10 inline-block w-full max-w-2xl p-6 my-8 overflow-y-auto text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl max-h-[85vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X size={20} /></button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
    </div>
  )
}

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => Promise<void>
  handleSubmit: ReturnType<typeof useForm<StudentFormData>['handleSubmit']>
  onCancel: () => void
  isSubmitting: boolean
  isEdit?: boolean
  register: ReturnType<typeof useForm<StudentFormData>>['register']
  errors: ReturnType<typeof useForm<StudentFormData>>['formState']['errors']
  classes: { id: string; name: string; grade?: string }[]
}

function StudentForm({ onSubmit, handleSubmit, onCancel, isSubmitting, isEdit, register, errors, classes }: StudentFormProps) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 基本信息 */}
      <div className="border-b pb-3 mb-3">
        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">基本信息</h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="学号" error={errors.student_id}>
          <input type="text" {...register('student_id')} data-testid="field-student_id" maxLength={10}
            readOnly={isEdit}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`}
            placeholder="例如：2026-0001" />
        </Field>
        <Field label="中文姓名" required error={errors.name_zh}>
          <input type="text" {...register('name_zh')} data-testid="field-name_zh"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name_zh ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="请输入中文姓名" />
        </Field>
        <Field label="所属班级" error={errors.class_id}>
          <select {...register('class_id')} data-testid="field-class_id"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择班级</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.grade ? `${c.grade} - ${c.name}` : c.name}</option>)}
          </select>
        </Field>
        <Field label="英文姓名" error={errors.name_en}>
          <input type="text" {...register('name_en')} data-testid="field-name_en"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="WONG SIU MING" />
        </Field>
        <Field label="性别" required error={errors.gender}>
          <select {...register('gender')} data-testid="field-gender"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}>
            <option value="">请选择</option>
            {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="出生日期" required error={errors.birth_date}>
          <input type="date" {...register('birth_date')} data-testid="field-birth_date"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.birth_date ? 'border-red-500' : 'border-gray-300'}`} />
        </Field>
        <Field label="入学日期" required error={errors.admission_date}>
          <input type="date" {...register('admission_date')} data-testid="field-admission_date"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.admission_date ? 'border-red-500' : 'border-gray-300'}`} />
        </Field>
        <Field label="状态" error={errors.status}>
          <select {...register('status')} data-testid="field-status"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="香港身份证" error={errors.hk_id}>
          <input type="text" {...register('hk_id')} data-testid="field-hk_id"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="例如：A123456(7)" />
        </Field>
      </div>

      {/* 联系方式 */}
      <div className="border-b pb-3 mb-3">
        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">联系方式</h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="联系电话" error={errors.phone}>
          <input type="text" {...register('phone')} data-testid="field-phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="例如：91234567" />
        </Field>
        <Field label="邮箱" error={errors.email}>
          <input type="email" {...register('email')} data-testid="field-email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="parent@example.com" />
        </Field>
        <div className="col-span-2">
          <Field label="家庭地址" error={errors.address}>
            <input type="text" {...register('address')} data-testid="field-address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="请输入家庭地址" />
          </Field>
        </div>
      </div>

      {/* 监护人信息 */}
      <div className="border-b pb-3 mb-3">
        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">监护人信息</h4>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="监护人姓名" error={errors.guardian_name}>
          <input type="text" {...register('guardian_name')} data-testid="field-guardian_name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="请输入监护人姓名" />
        </Field>
        <Field label="监护人电话" error={errors.guardian_phone}>
          <input type="text" {...register('guardian_phone')} data-testid="field-guardian_phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="例如：91234567" />
        </Field>
        <Field label="与学生关系" error={errors.guardian_relationship}>
          <input type="text" {...register('guardian_relationship')} data-testid="field-guardian_relationship"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="例如：父亲/母亲" />
        </Field>
      </div>

      {/* 紧急联系人 */}
      <div className="border-b pb-3 mb-3">
        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">紧急联系人</h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="紧急联系人" error={errors.emergency_contact}>
          <input type="text" {...register('emergency_contact')} data-testid="field-emergency_contact"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="请输入紧急联系人姓名" />
        </Field>
        <Field label="紧急联系电话" error={errors.emergency_phone}>
          <input type="text" {...register('emergency_phone')} data-testid="field-emergency_phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="例如：91234567" />
        </Field>
        <div className="col-span-2">
          <Field label="备注" error={errors.notes}>
            <textarea {...register('notes')} data-testid="field-notes" rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="其他备注信息（可选）" />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" data-testid="btn-cancel" onClick={onCancel} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
        <button type="submit" data-testid="btn_save" disabled={isSubmitting}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? '提交中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

function StudentDetail({ student }: { student: Student }) {
  const rows: [string, string, React.ReactNode][] = [
    ['学号', student.student_id || '-', <span key="id" />],
    ['中文姓名', student.name_zh, <span key="zh" />],
    ['英文姓名', student.name_en || '-', <span key="en" />],
    ['性别', GENDER_OPTIONS.find(g => g.value === student.gender)?.label || student.gender, <span key="gender" />],
    ['出生日期', student.birth_date, <span key="bd" />],
    ['入学日期', student.admission_date, <span key="ad" />],
    ['香港身份证', student.hk_id || '-', <span key="hkid" />],
    ['联系电话', student.phone || '-', <span key="phone" />],
    ['邮箱', student.email || '-', <span key="email" />],
    ['家庭地址', student.address || '-', <span key="addr" />],
    ['班级', student.class_name || '-', <span key="cls" />],
    ['监护人', `${student.guardian_name || '-'}${student.guardian_relationship ? ` (${student.guardian_relationship})` : ''}`, <span key="guard" />],
    ['监护人电话', student.guardian_phone || '-', <span key="gphone" />],
    ['紧急联系人', student.emergency_contact || '-', <span key="ec" />],
    ['紧急联系电话', student.emergency_phone || '-', <span key="ephone" />],
    ['状态', <span key="status" className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_OPTIONS.find(o => o.value === student.status)?.color || 'bg-gray-100'}`}>{STATUS_OPTIONS.find(o => o.value === student.status)?.label || student.status}</span>, <span key="s2" />],
    ['创建时间', new Date(student.created_at).toLocaleString('zh-CN'), <span key="c" />],
    ['更新时间', new Date(student.updated_at).toLocaleString('zh-CN'), <span key="u" />],
  ]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([label, value], i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-sm text-gray-500 min-w-[90px]">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
          </div>
        ))}
      </div>
      {student.notes && (
        <div className="pt-3 border-t">
          <p className="text-sm text-gray-500 mb-1">备注</p>
          <p className="text-sm text-gray-900">{student.notes}</p>
        </div>
      )}
      <div className="flex justify-end pt-3 border-t">
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">关闭</button>
      </div>
    </div>
  )
}

// ============ Main Component ============
export default function StudentPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [classes, setClasses] = useState<{ id: string; name: string; grade?: string }[]>([])

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) { window.location.href = '/login'; return }

      const params = new URLSearchParams({ page: page.toString(), pageSize: PAGE_SIZE.toString() })
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (classFilter) params.append('class_id', classFilter)

      const response = await apiClient.get<{ data: PaginatedResponse<Student> }>(
        `/students?${params}`
      )

      const { items, pagination } = response.data.data
      setStudents(items || [])
      setTotal(pagination.total)
      setTotalPages(pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch students:', error)
      if (isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter, classFilter])

  const fetchClasses = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return
      const response = await apiClient.get<ClassApiResponse>(
        '/classes'
      )
      setClasses(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { fetchClasses() }, [fetchClasses])

  // Handlers
  const handleCreate = async (data: StudentFormData) => {
    try {
      // Validate with strict schema before submission
      const validated = studentSubmissionSchema.parse(data)
      const payload = {
        ...validated,
        gender: validated.gender || undefined,
        create_user_account: false,
      }
      await apiClient.post('/students', payload)
      setShowCreateModal(false)
      reset(DEFAULT_FORM_VALUES)
      setPage(1)
      await fetchStudents()
      alert('学生创建成功！')
    } catch (error) {
      if (error instanceof z.ZodError) {
        alert(`表单验证失败: ${error.errors.map(e => e.message).join('; ')}`)
      } else if (isAxiosError(error) && error.response?.data?.message) {
        alert(`创建失败: ${JSON.stringify(error.response.data.message)}`)
      } else {
        console.error('Failed to create student:', error)
        alert('创建失败，请检查网络或联系管理员')
      }
    }
  }

  const handleUpdate = async (data: StudentFormData) => {
    if (!selectedStudent) return
    try {
      // Validate with strict schema before submission
      const validated = studentSubmissionSchema.parse(data)
      await apiClient.put(`/students/${selectedStudent.id}`, {
        ...validated,
        gender: validated.gender || undefined, // send undefined instead of empty string
      })
      setShowEditModal(false)
      reset()
      await fetchStudents()
      alert('学生信息更新成功！')
    } catch (error) {
      if (error instanceof z.ZodError) {
        alert(`表单验证失败: ${error.errors.map(e => e.message).join('; ')}`)
      } else if (isAxiosError(error) && error.response?.data?.message) {
        alert(`更新失败: ${JSON.stringify(error.response.data.message)}`)
      } else {
        console.error('Failed to update student:', error)
        alert('更新失败，请检查网络或联系管理员')
      }
    }
  }

  const handleDelete = async () => {
    if (!selectedStudent) return
    try {
      const token = getToken()
      await apiClient.delete(`/students/${selectedStudent.id}`)
      setShowDeleteConfirm(false)
      setSelectedStudent(null)
      await fetchStudents()
      alert('学生删除成功！')
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.message) {
        alert(`删除失败: ${JSON.stringify(error.response.data.message)}`)
      } else {
        console.error('Failed to delete student:', error)
        alert('删除失败，请检查网络或联系管理员')
      }
    }
  }

  const toDateInputValue = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student)
    reset({
      student_id: student.student_id || '',
      name_zh: student.name_zh,
      name_en: student.name_en || '',
      gender: student.gender,
      birth_date: toDateInputValue(student.birth_date),
      admission_date: toDateInputValue(student.admission_date),
      hk_id: student.hk_id || '',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      guardian_relationship: student.guardian_relationship || '',
      emergency_contact: student.emergency_contact || '',
      emergency_phone: student.emergency_phone || '',
      notes: student.notes || '',
      status: student.status || StudentStatus.ACTIVE,
      class_id: (student as any).currentClass?.class_id || '',
    })
    setShowEditModal(true)
  }

  const openDetailModal = (student: Student) => {
    setSelectedStudent(student)
    setShowDetailModal(true)
  }

  // Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">学生管理</h2>
        <button
          onClick={() => { reset(DEFAULT_FORM_VALUES); setShowCreateModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          data-testid="btn_new_student"
        >
          <Plus size={20} /> 新增学生
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索学号或姓名..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="filter_class"
            >
              <option value="">全部班级</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.grade ? `${c.grade} - ${c.name}` : c.name}</option>)}
            </select>
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="filter_status"
            >
              <option value="">全部状态</option>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">性别</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">班级</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">加载中...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">暂无数据</td></tr>
              ) : students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm text-gray-900">{s.student_id || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{s.name_zh}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {GENDER_OPTIONS.find(g => g.value === s.gender)?.label || s.gender}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{(s as any).currentClass?.class_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      STATUS_OPTIONS.find(o => o.value === s.status)?.color || 'bg-gray-100'
                    }`}>
                      {STATUS_OPTIONS.find(o => o.value === s.status)?.label || s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openDetailModal(s) }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded" title="查看"><Eye size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(s) }}
                        className="p-1.5 text-gray-500 hover:text-green-600 rounded" title="编辑"><Edit2 size={16} /></button>
                      {canDeleteStudent(s.status) && (
                        <button onClick={(e) => { e.stopPropagation(); setSelectedStudent(s); setShowDeleteConfirm(true) }}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded" title="删除"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <p className="text-sm text-gray-700">
            显示第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} 条，共 {total} 条
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let num = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
              return (
                <button key={num} onClick={() => setPage(num)}
                  className={`w-9 h-9 border rounded text-sm ${num === page ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-50'}`}>
                  {num}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <Modal title="新增学生" onClose={() => setShowCreateModal(false)}>
          <StudentForm onSubmit={handleCreate} onCancel={() => setShowCreateModal(false)}
            isSubmitting={isSubmitting} register={register} errors={errors}
            handleSubmit={handleSubmit} classes={classes} />
        </Modal>
      )}
      {showEditModal && selectedStudent && (
        <Modal title="编辑学生" onClose={() => setShowEditModal(false)}>
          <StudentForm onSubmit={handleUpdate} onCancel={() => setShowEditModal(false)}
            isSubmitting={isSubmitting} isEdit register={register} errors={errors}
            handleSubmit={handleSubmit} classes={classes} />
        </Modal>
      )}
      {showDetailModal && selectedStudent && (
        <Modal title="学生详情" onClose={() => setShowDetailModal(false)}>
          <StudentDetail student={selectedStudent} />
        </Modal>
      )}
      {showDeleteConfirm && selectedStudent && (
        <Modal title="删除确认" onClose={() => setShowDeleteConfirm(false)}>
          <div className="space-y-4">
            <p className="text-gray-700">确定要删除学生 <span className="font-semibold">{selectedStudent.name_zh}</span> 吗？</p>
            <p className="text-sm text-gray-500">此操作将软删除该学生档案。</p>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setShowDeleteConfirm(false)} data-testid="btn-cancel" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={handleDelete} data-testid="btn-confirm-delete" className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">确认删除</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
