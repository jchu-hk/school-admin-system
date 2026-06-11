import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react'
import { useI18n } from '../i18n'

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(6, '密码至少6位'),
})

const otpSchema = z.object({
  otpCode: z.string().min(6, '请输入6位验证码').max(6, '验证码为6位数字'),
})

type LoginForm = z.infer<typeof loginSchema>
type OtpForm = z.infer<typeof otpSchema>

interface LoginResponse {
  temp_token?: string
  sessionId?: string
  requiresOtp?: boolean
  otpType?: string
  access_token?: string
  message?: string
}

export default function Login() {
  const { t } = useI18n()
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [loginData, setLoginData] = useState<LoginResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
  } = useForm<OtpForm>({ resolver: zodResolver(otpSchema) })

  const onLoginSubmit = async (data: LoginForm) => {
    try {
      setError('')
      setIsSubmitting(true)
      const res = await axios.post<LoginResponse>('/api/auth/login', data)
      
      // 如果需要OTP验证
      if (res.data.requiresOtp) {
        setLoginData(res.data)
        setStep('otp')
        setIsSubmitting(false)
        return
      }
      
      // 直接返回access_token的情况
      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token)
        window.location.href = '/dashboard'
        return
      }
      
      setError('登录响应格式错误')
      setIsSubmitting(false)
    } catch (err: any) {
      setError(err.response?.data?.message || t.login.error)
      setIsSubmitting(false)
    }
  }

  const onOtpSubmit = async (data: OtpForm) => {
    try {
      setError('')
      setIsSubmitting(true)
      
      const res = await axios.post<{ access_token: string }>('/api/auth/verify-otp', {
        tempToken: loginData?.temp_token,
        code: data.otpCode,
        otpType: loginData?.otpType || 'email',
      })
      
      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token)
        window.location.href = '/dashboard'
      } else {
        setError('验证失败，未获取到访问令牌')
        setIsSubmitting(false)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '验证码错误')
      setIsSubmitting(false)
    }
  }

  const handleBackToLogin = () => {
    setStep('login')
    setLoginData(null)
    setError('')
  }

  // OTP验证界面
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Shield className="text-blue-600" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">双重验证</h1>
          <p className="text-center text-gray-500 mb-8">
            已向您的{loginData?.otpType === 'email' ? '邮箱' : '手机'}发送验证码，请输入6位验证码
          </p>
          
          <form onSubmit={handleSubmitOtp(onOtpSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <input
                {...registerOtp('otpCode')}
                type="text"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              {otpErrors.otpCode && <p className="text-red-500 text-sm mt-1">{otpErrors.otpCode.message}</p>}
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn size={18} />
              {isSubmitting ? '验证中...' : '验证'}
            </button>
            
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full text-gray-500 text-sm hover:text-gray-700 transition"
            >
              返回登录
            </button>
          </form>
        </div>
      </div>
    )
  }

  // 登录界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">{t.login.title}</h1>
        <p className="text-center text-gray-500 mb-8">{t.login.subtitle}</p>
        <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.login.username}</label>
            <input
              {...register('username')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t.login.usernamePlaceholder}
            />
            {loginErrors.username && <p className="text-red-500 text-sm mt-1">{loginErrors.username.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.login.password}</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPwd ? 'text' : 'password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                placeholder={t.login.passwordPlaceholder}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {loginErrors.password && <p className="text-red-500 text-sm mt-1">{loginErrors.password.message}</p>}
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn size={18} />
            {isSubmitting ? t.login.loggingIn : t.login.loginButton}
          </button>
        </form>
      </div>
    </div>
  )
}
