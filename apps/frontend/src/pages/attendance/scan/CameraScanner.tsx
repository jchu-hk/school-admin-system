import React from 'react';
import type { ScanStatus } from './useQrScanner';

/**
 * CameraScanner — 摄像头预览 + 扫码框组件
 *
 * 布局:
 * ┌──────────────────────────┐
 * │   [摄像头视频预览区域]     │
 * │   ┌──────────────────┐   │
 * │   │  ┌─┐          ┌─┐│   │
 * │   │  │ │  扫描框   │ ││   │
 * │   │  │ └──────────┘ ││   │
 * │   │  └─┐          ┌─┘│   │
 * │   │    └──────────┘   │   │
 * │   └──────────────────┘   │
 * │   请对准学生QR码          │
 * └──────────────────────────┘
 */

interface CameraScannerProps {
  /** <video> 元素 ref */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** 扫描状态 */
  status: ScanStatus;
  /** 错误信息 */
  error: string | null;
}

const CameraScanner: React.FC<CameraScannerProps> = ({
  videoRef,
  status,
  error,
}) => {
  const isInitializing = status === 'initializing';
  const isIdle = status === 'idle';
  const isActive = status === 'scanning' || status === 'offline';
  const hasError = !!error;

  const cornerColor = status === 'scanning' ? '#22c55e' : status === 'offline' ? '#eab308' : '#94a3b8';

  const cornerBase: React.CSSProperties = {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: cornerColor,
    borderStyle: 'solid',
    borderWidth: 0,
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-black rounded-xl"
      style={{ aspectRatio: '4/3' }}
    >
      {/* ── 视频或占位 ── */}
      {videoRef.current ? (
        <video
          ref={videoRef as React.Ref<HTMLVideoElement>}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {isInitializing && (
            <div className="text-center text-white">
              <div className="w-10 h-10 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-300">正在请求摄像头...</p>
            </div>
          )}
          {isIdle && (
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-sm text-gray-400">点击下方按钮启动扫码</p>
            </div>
          )}
          {hasError && (
            <div className="text-center px-4">
              <svg className="w-12 h-12 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 扫码叠加层 ── */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* 半透明蒙层 */}
          <div className="absolute inset-0 bg-black/30" />

          {/* 扫描框 */}
          <div className="relative w-3/5" style={{ maxWidth: 260, aspectRatio: '1/1' }}>
            {/* 四角 — 使用绝对定位的 border 绘制 */}
            <div style={{ ...cornerBase, top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: '3px 0 0 0' }} />
            <div style={{ ...cornerBase, top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3, borderRadius: '0 3px 0 0' }} />
            <div style={{ ...cornerBase, bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: '0 0 0 3px' }} />
            <div style={{ ...cornerBase, bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: '0 0 3px 0' }} />

            {/* 扫描线 */}
            <div
              className={`absolute left-2 right-2 h-[2px] ${
                status === 'offline' ? 'bg-yellow-400' : 'bg-green-400'
              } shadow-[0_0_6px_rgba(34,197,94,0.5)]`}
              style={{ animation: 'scan-line 2.5s ease-in-out infinite' }}
            />
          </div>

          {/* 底部提示 */}
          <div className="absolute bottom-6 left-0 right-0 text-center px-4">
            <p className="text-white text-xs font-medium tracking-wider drop-shadow-sm">
              {status === 'offline'
                ? '📴 离线模式 — 签到缓存中'
                : '请对准学生QR码'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraScanner;
