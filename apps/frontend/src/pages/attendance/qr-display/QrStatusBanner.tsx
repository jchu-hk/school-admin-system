import React from 'react';
import type { QrStatus } from './useQrCode';

interface QrStatusBannerProps {
  status: QrStatus;
  isOffline: boolean;
  errorMessage: string | null;
  checkedInAt: string | null;
  onDismissError?: () => void;
}

/**
 * QrStatusBanner — 状态提示条
 *
 * 覆盖场景:
 * - 已签到: 绿色成功条
 * - 离线: 黄色警告条
 * - 错误: 红色错误条 (可关闭)
 * - 速率限制: 黄色提示
 */
export const QrStatusBanner: React.FC<QrStatusBannerProps> = ({
  status,
  isOffline,
  errorMessage,
  checkedInAt,
  onDismissError,
}) => {
  // ── 离线 Banner (最高优先级，不与其他状态冲突) ──
  if (isOffline) {
    return (
      <div className="qr-banner qr-banner--warning">
        <span className="qr-banner__icon">📶</span>
        <span className="qr-banner__text">
          网络不稳定，二维码已生成仍可使用
        </span>
      </div>
    );
  }

  // ── 已签到 ──
  if (status === 'checked_in') {
    return (
      <div className="qr-banner qr-banner--success">
        <span className="qr-banner__icon">✅</span>
        <span className="qr-banner__text">
          今日已签到 {checkedInAt ? ` ${checkedInAt}` : ''}
        </span>
      </div>
    );
  }

  // ── 错误状态 ──
  if (status === 'error' && errorMessage) {
    return (
      <div className="qr-banner qr-banner--error">
        <span className="qr-banner__icon">❌</span>
        <span className="qr-banner__text">{errorMessage}</span>
        {onDismissError && (
          <button
            className="qr-banner__close"
            onClick={onDismissError}
            aria-label="关闭提示"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // ── 速率限制 ──
  if (status === 'rate_limited') {
    return (
      <div className="qr-banner qr-banner--warning">
        <span className="qr-banner__icon">⏳</span>
        <span className="qr-banner__text">
          {errorMessage ?? '操作太频繁，请稍候'}
        </span>
      </div>
    );
  }

  // ── 无状态 → 不渲染 ──
  return null;
};
