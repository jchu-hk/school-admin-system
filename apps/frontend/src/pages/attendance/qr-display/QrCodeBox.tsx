import React, { useEffect, useRef, useState } from 'react';
import type { QrStatus } from './useQrCode';

const QR_SIZE = 250;

interface QrCodeBoxProps {
  qrCodeData: string | null;
  status: QrStatus;
  countdown: number;
  /** Called when the countdown reaches 0 */
  onRefresh?: () => void;
}

/**
 * QrCodeBox — QR码显示 + 倒计时进度条
 *
 * 使用原生 Canvas 绘制 QR 码（通过 qrcode 库生成矩阵数据）
 * 当 status === 'checked_in' 时显示 ✅ 代替 QR 码
 */
export const QrCodeBox: React.FC<QrCodeBoxProps> = ({
  qrCodeData,
  status,
  countdown,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrError, setQrError] = useState(false);

  // ── 动态导入并渲染 QR 码 ──
  useEffect(() => {
    if (!qrCodeData || status !== 'active') return;

    let cancelled = false;
    setQrError(false);

    (async () => {
      try {
        const QRCode = await import('qrcode');
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        await QRCode.toCanvas(canvas, qrCodeData, {
          width: QR_SIZE,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        });
      } catch {
        if (!cancelled) {
          setQrError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qrCodeData, status]);

  // ── 渲染逻辑 ──────────────────────────────────────

  // 已签到状态
  if (status === 'checked_in') {
    return (
      <div className="qr-box">
        <div className="qr-box__checked-in">
          <span className="qr-box__check-icon">✅</span>
          <span className="qr-box__check-text">今日已签到</span>
        </div>
      </div>
    );
  }

  // 加载中
  if (status === 'loading' && !qrCodeData) {
    return (
      <div className="qr-box">
        <div className="qr-box__loading">
          <div className="qr-spinner" />
          <span>生成二维码中…</span>
        </div>
      </div>
    );
  }

  // QR 渲染出错
  if (qrError) {
    return (
      <div className="qr-box">
        <div className="qr-box__error">
          <span className="qr-box__error-icon">⚠️</span>
          <span>二维码渲染失败</span>
        </div>
      </div>
    );
  }

  // 正常显示 QR 码
  return (
    <div className="qr-box">
      <div className="qr-box__canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={QR_SIZE}
          height={QR_SIZE}
          className="qr-box__canvas"
        />
      </div>

      {/* 倒计时进度条 */}
      <div className="qr-box__countdown">
        <div className="qr-box__countdown-text">
          二维码剩余 <strong>{countdown}</strong> 秒
        </div>
        <div className="qr-progress-bar">
          <div
            className="qr-progress-bar__fill"
            style={{ width: `${(countdown / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
