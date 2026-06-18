import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { Eye, EyeOff, Check, X, Lock } from 'lucide-react'
import { getToken } from '../utils/tokenService'
import { useEffect } from 'react'

const setPasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, '密码至少8个字符')
    .max(32, '密码最多32个字符')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, '密码必须包含特殊字符'),
  confirmPassword: z.string().min(1, '请确认密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次密码输入不一致',
  path: ['confirmPassword'],
})

type SetPasswordForm = z.infer<typeof setPasswordSchema>

const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: '最少8个字符', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: '包含大写字母', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: '包含小写字母', test: (p: string) => /[a-z]/.test(p) },
  { key: 'numbers', label: '包含数字', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: '包含特殊字符', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

export default function SetPasswordPage() {
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Guard: require authentication
  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
    }
  }, [navigate])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
    mode: 'onBlur',
  })

  const newPassword = watch('newPassword', '')

  const onSubmit = async (data: SetPasswordForm) => {
    try {
      setError('')
      setIsSubmitting(true)

      const res = await apiClient.post('/api/auth/set-password', {
        oldPassword: data.oldPassword || undefined,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })

      if (res.data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      }
    } catch (err: any) {
      const code = err.response?.data?.code
      const message = err.response?.data?.message || '设置失败'
      setError(message)
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">密码设置成功</h2>
          <p className="text-gray-500">正在跳转到主页...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Lock className="text-blue-600" size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">设置账户密码</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">请设置您的账户密码以保护账号安全</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Old Password - optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              原密码（修改密码时填写）
            </label>
            <div className="relative">
              <input
                {...register('oldPassword')}
                type={showOld ? 'text' : 'password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                placeholder="首次设置可留空"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.oldPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showNew ? 'text' : 'password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                placeholder="请输入新密码"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Password Strength Checklist */}
          {newPassword && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-gray-500 mb-2">密码强度:</p>
              {PASSWORD_REQUIREMENTS.map((req) => {
                const passed = req.test(newPassword)
                return (
                  <div key={req.key} className="flex items-center gap-2 text-xs">
                    {passed ? (
                      <Check size={12} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <X size={12} className="text-gray-400 flex-shrink-0" />
                    )}
                    <span className={passed ? 'text-green-600' : 'text-gray-400'}>
                      {req.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                placeholder="请再次输入密码"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Lock size={18} />
            {isSubmitting ? '设置中...' : '确认设置'}
          </button>
        </form>
      </div>
    </div>
  )
}
