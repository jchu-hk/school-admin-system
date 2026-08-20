import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { Eye, EyeOff, Check, X, Lock } from 'lucide-react'
import { getToken } from '../utils/tokenService'
import { useEffect } from 'react'
import { useI18n, type Translations } from '../i18n'

const SPECIAL_RE = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/

function createSetPasswordSchema(sp: Translations['setPassword']) {
  return z.object({
    oldPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, sp.minLength)
      .max(32, sp.maxLength)
      .regex(/[A-Z]/, sp.requireUpper)
      .regex(/[a-z]/, sp.requireLower)
      .regex(/[0-9]/, sp.requireNumber)
      .regex(SPECIAL_RE, sp.requireSpecial),
    confirmPassword: z.string().min(1, sp.confirmRequired),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: sp.mismatch,
    path: ['confirmPassword'],
  })
}

type SetPasswordForm = z.infer<ReturnType<typeof createSetPasswordSchema>>

export default function SetPasswordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const PASSWORD_REQUIREMENTS = [
    { key: 'length', label: t.setPassword.length, test: (p: string) => p.length >= 8 },
    { key: 'uppercase', label: t.setPassword.uppercase, test: (p: string) => /[A-Z]/.test(p) },
    { key: 'lowercase', label: t.setPassword.lowercase, test: (p: string) => /[a-z]/.test(p) },
    { key: 'numbers', label: t.setPassword.numbers, test: (p: string) => /[0-9]/.test(p) },
    { key: 'special', label: t.setPassword.special, test: (p: string) => SPECIAL_RE.test(p) },
  ]

  // Guard: require authentication
  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
    }
  }, [navigate])

  const setPasswordSchema = createSetPasswordSchema(t.setPassword)

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

      const res = await apiClient.post('/auth/set-password', {
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
      const message = err.response?.data?.message || t.setPassword.settingFailed
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.setPassword.success}</h2>
          <p className="text-gray-500">{t.setPassword.redirecting}</p>
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
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">{t.setPassword.title}</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">{t.setPassword.subtitle}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Old Password - optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.setPassword.oldPassword}
            </label>
            <div className="relative">
              <input
                {...register('oldPassword')}
                type={showOld ? 'text' : 'password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                placeholder={t.setPassword.oldPasswordPlaceholder}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.setPassword.newPassword}</label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showNew ? 'text' : 'password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                placeholder={t.setPassword.newPasswordPlaceholder}
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
              <p className="text-xs font-medium text-gray-500 mb-2">{t.setPassword.passwordStrength}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.setPassword.confirmPassword}</label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                placeholder={t.setPassword.confirmPasswordPlaceholder}
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
            {isSubmitting ? t.setPassword.setting : t.setPassword.confirm}
          </button>
        </form>
      </div>
    </div>
  )
}
