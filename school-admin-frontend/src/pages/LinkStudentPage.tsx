import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { Link2, Unlink, Plus, Users, UserMinus, Loader2 } from 'lucide-react'
import { useI18n } from '../i18n'

interface LinkedStudent {
  id: string
  studentId: string
  studentName?: string
  relationship: 'father' | 'mother' | 'guardian' | 'other'
  isPrimary: boolean
  verifiedAt: string | null
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  father: '父亲',
  mother: '母亲',
  guardian: '监护人',
  other: '其他',
}

const RELATIONSHIP_OPTIONS = [
  { value: 'father', label: '父亲' },
  { value: 'mother', label: '母亲' },
  { value: 'guardian', label: '监护人' },
  { value: 'other', label: '其他' },
]

interface AddStudentForm {
  studentId: string
  relationship: string
  isPrimary: boolean
}

export default function LinkStudentPage() {
  const { t } = useI18n()
  const [students, setStudents] = useState<LinkedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 })

  const fetchStudents = async (page = 1) => {
    try {
      setLoading(true)
      const res = await apiClient.get('/api/auth/linked-students', {
        params: { page, pageSize: 20 },
      })
      if (res.data.success) {
        setStudents(res.data.data.items)
        setPagination(res.data.data.pagination)
      }
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    const formData = new FormData(form)
    const data: AddStudentForm = {
      studentId: formData.get('studentId') as string,
      relationship: formData.get('relationship') as string,
      isPrimary: formData.get('isPrimary') === 'on',
    }

    if (!data.studentId.trim()) {
      setError('请输入学生ID')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      const res = await apiClient.post('/api/auth/link-student', {
        studentId: data.studentId,
        relationship: data.relationship,
        isPrimary: data.isPrimary,
      })
      if (res.data.success) {
        setSuccessMsg('关联成功')
        setShowAddForm(false)
        fetchStudents()
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '关联失败'
      if (err.response?.data?.code === 'ALREADY_LINKED') {
        setError('该学生已关联此账号')
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlink = async (linkId: string) => {
    try {
      const res = await apiClient.delete(`/api/auth/link-student/${linkId}`)
      if (res.data.success) {
        setConfirmUnlink(null)
        fetchStudents()
      }
    } catch {
      setError('解除关联失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Link2 className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-gray-800">关联子女账号</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          关联您的子女账号，随时查看在校情况
        </p>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Success Message */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            ✓ {successMsg}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Linked Students List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Users size={18} />
              已关联子女 ({pagination.total})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="animate-spin mr-2" size={20} />
              加载中...
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-40" />
              <p>暂无关联的子女账号</p>
              <p className="text-sm mt-1">点击下方按钮添加关联</p>
            </div>
          ) : (
            <ul className="divide-y">
              {students.map((student) => (
                <li key={student.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 truncate">
                          {student.studentName || student.studentId}
                        </p>
                        {student.isPrimary && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            主联系人
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {RELATIONSHIP_LABELS[student.relationship] || student.relationship}
                        {student.verifiedAt && (
                          <span className="ml-2">
                            · 已验证 {new Date(student.verifiedAt).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmUnlink(student.id)}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 flex-shrink-0"
                    >
                      <Unlink size={14} />
                      解除关联
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                第 {pagination.page} / {pagination.totalPages} 页
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchStudents(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  onClick={() => fetchStudents(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Student Form / Button */}
        {showAddForm ? (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-800 mb-4">添加子女账号</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学生ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="studentId"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请输入学生的ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关系</label>
                <select
                  name="relationship"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  defaultValue="father"
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPrimary"
                  id="isPrimary"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPrimary" className="text-sm text-gray-700">
                  设为主要联系人
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Plus size={16} />
                  {submitting ? '关联中...' : '确认关联'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setError('')
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 font-medium py-4 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            添加子女账号
          </button>
        )}
      </div>

      {/* Unlink Confirmation Modal */}
      {confirmUnlink && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <UserMinus className="text-red-600" size={28} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-center text-gray-800 mb-2">
              确认解除关联？
            </h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              解除后，您将无法查看该子女的在校情况
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmUnlink(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={() => handleUnlink(confirmUnlink)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
              >
                确认解除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
