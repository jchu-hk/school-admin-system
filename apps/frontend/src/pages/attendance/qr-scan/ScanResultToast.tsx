import React from 'react';
import type { ScanResultData, ScanStatus } from './useCameraScan';

/**
 * ScanResultToast — 扫描结果动画组件
 *
 * 根据扫描结果显示对应的图标、颜色和提示：
 * - 成功 🟢 → 绿色上滑动画
 * - 过期 🟡 → 黄色警告
 * - 重复 🔵 → 蓝色提示
 * - 伪造/无效 🔴 → 红色警告
 */

interface ScanResultToastProps {
  /** 扫描结果数据 */
  result: ScanResultData;
  /** 扫描状态（用于判断显示/隐藏） */
  status: Extract<ScanStatus, 'success' | 'expired' | 'duplicate' | 'invalid'>;
  /** 是否可见 */
  visible: boolean;
}

// ==================== 各状态配置 ====================

interface Config {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  title: string;
}

function getConfig(status: string, result: ScanResultData): Config {
  switch (status) {
    case 'success':
      return {
        icon: (
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3 animate-bounce-in">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
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
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
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
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
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
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
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

  const config = getConfig(status, result);

  // 格式化签到时间
  let timeStr = '';
  if (result.scanned_at) {
    const d = new Date(result.scanned_at);
    timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div
        className={`
          mx-4 p-6 rounded-2xl border-2 shadow-xl max-w-sm w-full
          animate-slide-up ${config.bgColor} ${config.borderColor}
        `}
      >
        {/* 图标 */}
        {config.icon}

        {/* 标题 */}
        <h3 className={`text-lg font-bold text-center mb-2 ${config.textColor}`}>
          {config.title}
        </h3>

        {/* 成功时显示学生详情 */}
        {status === 'success' && result.student_name && (
          <div className="text-center mb-2">
            <p className="text-xl font-semibold text-gray-900">
              {result.student_name}
            </p>
            {result.class_name && (
              <p className="text-sm text-gray-500 mt-1">{result.class_name}</p>
            )}
          </div>
        )}

        {/* 时间 */}
        {timeStr && (
          <p className="text-center text-sm text-gray-500">
            签到时间：{timeStr}
          </p>
        )}

        {/* 消息 */}
        {result.message && (
          <p className={`text-center text-sm mt-2 ${config.textColor}`}>
            {result.message}
          </p>
        )}

        {/* 3秒倒计时提示 */}
        <p className="text-center text-xs text-gray-400 mt-4">
          3 秒后自动返回扫码...
        </p>
      </div>
    </div>
  );
};

export default ScanResultToast;
