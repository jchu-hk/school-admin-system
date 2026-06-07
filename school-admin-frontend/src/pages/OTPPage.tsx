/**
 * OTP二次认证页面组件
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { authAPI, tokenManager } from '../api/auth';
import type { APIError } from '../types/auth';

// 表单验证Schema
const otpSchema = z.object({
  otp: z
    .string()
    .length(6, '请输入6位验证码')
    .regex(/^\d+$/, '验证码必须为数字'),
});

type OTPFormData = z.infer<typeof otpSchema>;

export default function OTPPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(120); // 2分钟倒计时
  const [canResend, setCanResend] = useState(false);

  // 获取待验证的用户名
  const username = localStorage.getItem('pendingUsername');

  useEffect(() => {
    // 如果没有待验证的用户名,返回登录页
    if (!username) {
      navigate('/login');
      return;
    }

    // 倒计时逻辑
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [username, navigate]);

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    mode: 'onChange',
  });

  const otpValue = watch('otp');

  // 自动聚焦下一个输入框
  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue('otp', value);

    // 聚焦到下一个输入框
    const currentIndex = parseInt(e.target.dataset.index || '0');
    const nextInput = document.querySelector(`input[data-index="${currentIndex + 1}"]`) as HTMLInputElement;
    if (value && nextInput) {
      nextInput.focus();
    }
  };

  const onSubmit = async (data: OTPFormData) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.verifyOTP(data);

      if (response.code === 0) {
        // OTP验证成功,保存token
        tokenManager.setTokens(
          response.data.token,
          response.data.refreshToken,
          response.data.expiresIn
        );

        // 清除待验证的用户名
        localStorage.removeItem('pendingUsername');

        // 跳转到仪表板
        navigate('/dashboard');
      } else {
        setError(response.message || '验证失败');
        // 清空输入
        setValue('otp', '');
      }
    } catch (err) {
      const apiError = err as APIError;
      setError(apiError.message || '验证失败，请稍后重试');
      setValue('otp', '');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || !username) return;

    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.resendOTP({ username });

      if (response.code === 0) {
        // 重新发送成功,重置倒计时
        setCountdown(120);
        setCanResend(false);
        setValue('otp', '');
      } else {
        setError(response.message || '重新发送失败');
      }
    } catch (err) {
      const apiError = err as APIError;
      setError(apiError.message || '重新发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('pendingUsername');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-blue-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">二次验证</h1>
          <p className="text-blue-200">请输入发送到您手机的6位验证码</p>
        </div>

        {/* OTP表单卡片 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* OTP输入框 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                验证码
              </label>
              <div className="flex gap-2 justify-center">
                {[...Array(6)].map((_, index) => (
                  <input
                    key={index}
                    data-index={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    {...register('otp')}
                    value={otpValue?.[index] || ''}
                    onChange={handleOTPChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpValue?.[index] && index > 0) {
                        const prevInput = document.querySelector(
                          `input[data-index="${index - 1}"]`
                        ) as HTMLInputElement;
                        prevInput?.focus();
                      }
                    }}
                  />
                ))}
              </div>
              {errors.otp && (
                <p className="mt-2 text-sm text-red-600 text-center">{errors.otp.message}</p>
              )}
            </div>

            {/* 倒计时和重新发送 */}
            <div className="flex items-center justify-center gap-4 text-sm">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新发送验证码
                </button>
              ) : (
                <p className="text-gray-600">
                  验证码将在 <span className="font-mono font-bold text-blue-600">{formatCountdown(countdown)}</span> 后过期
                </p>
              )}
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>验证中...</span>
                </div>
              ) : (
                '验证'
              )}
            </button>

            {/* 返回登录 */}
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              返回登录
            </button>
          </form>
        </div>

        {/* 底部信息 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-blue-200">
            遇到问题?请联系校务处
          </p>
        </div>
      </div>
    </div>
  );
}