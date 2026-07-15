import React from 'react';
import type { ScanResultData } from './useQrScanner';

/**
 * ScanResultToast — 扫码结果弹窗
 *
 * 成功  🟢: 绿色 + 上滑动画 + 学生姓名/班级/时间
 * 过期  🟡: 黄色 ⚠️ 提示
 * 重复  🔵: 蓝色 ℹ️ 提示
 * 无效  🔴: 红色 ❌ 警告（伪造QR、解码失败等）
 */

type ToastStatus = 'success' | 'expired' | 'duplicate' | 'invalid';

interface ScanResultToastProps {
  result: ScanResultData;
  status: ToastStatus;
  visible: boolean;
}

// ── 各状态样式配置 ──

interface StyleConfig {
  icon: React.ReactNode;
  containerClass: string;
  titleClass: string;
  title: string;
}

function getStyleConfig(status: ToastStatus): StyleConfig {
  switch (status) {
    case 'success':
      return {
        icon: (
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-10 h-10 text-green-500 animate-bounce-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
        containerClass: 'bg-green-50 border-green-200',
        titleClass: 'text-green-800',
        title: '✅ 签到成功！',
      };
    case 'expired':
      return {
        icon: (
          <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ),
        containerClass: 'bg-yellow-50 border-yellow-200',
        titleClass: 'text-yellow-800',
        title: '⚠️ QR码已过期',
      };
    case 'duplicate':
      return {
        icon: (
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ),
        containerClass: 'bg-blue-50 border-blue-200',
        titleClass: 'text-blue-800',
        title: 'ℹ️ 该学生已签到',
      };
    case 'invalid':
    default:
      return {
        icon: (
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ),
        containerClass: 'bg-red-50 border-red-200',
        titleClass: 'text-red-800',
        title: '❌ 无效QR码',
      };
  }
}

const ScanResultToast: React.FC<ScanResultToastProps> = ({
  result,
  status,
  visible,
}) => {
  if (!visible) return null;

  const config = getStyleConfig(status);

  // 格式化时间
  const timeStr = result.scanned_at
    ? (() => {
        const d = new Date(result.scanned_at);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      })()
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className={`
          mx-4 p-6 rounded-2xl border-2 shadow-xl max-w-sm w-full
          animate-slide-up ${config.containerClass}
        `}
      >
        {config.icon}

        <h3 className={`text-lg font-bold text-center mb-2 ${config.titleClass}`}>
          {config.title}
        </h3>

        {/* 成功 → 学生详情 */}
        {status === 'success' && result.student_name && (
          <div className="text-center mb-2">
            <p className="text-xl font-semibold text-gray-900">{result.student_name}</p>
            {result.class_name && (
              <p className="text-sm text-gray-500 mt-1">{result.class_name}</p>
            )}
          </div>
        )}

        {/* 重复 → 显示首次签到时间 */}
        {status === 'duplicate' && result.scanned_at && (
          <p className="text-center text-sm text-gray-500">
            首次签到时间：{timeStr}
          </p>
        )}

        {/* 过期/无效 → 显示消息 */}
        {result.message && (
          <p className={`text-center text-sm mt-2 ${config.titleClass}`}>
            {result.message}
          </p>
        )}

        {/* 倒计时提示 */}
        <p className="text-center text-xs text-gray-400 mt-4">
          3 秒后自动返回扫码...
        </p>
      </div>
    </div>
  );
};

export default ScanResultToast;
