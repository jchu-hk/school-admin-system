import React from 'react';

/**
 * CameraScanBox — 摄像头扫码组件
 *
 * 带四角扫描框的全屏摄像头预览:
 * - 全屏摄像头预览
 * - 四角扫描框（类似扫码枪 UI）
 * - "请对准学生QR码" 提示文字
 * - 支持各种扫描状态下的不同视觉表现
 */

interface CameraScanBoxProps {
  /** video 元素 ref */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** 扫描状态 */
  status: string;
  /** 错误信息 */
  error: string | null;
  /** 是否可交互（非扫描中禁用按钮） */
  disabled?: boolean;
}

const CameraScanBox: React.FC<CameraScanBoxProps> = ({
  videoRef,
  status,
  error,
  disabled = false,
}) => {
  const isInitializing = status === 'initializing';
  const isIdle = status === 'idle';
  const isActive = status === 'scanning' || status === 'offline';
  const hasError = !!error;

  // 扫描框四角的 CSS 样式
  const cornerStyle: React.CSSProperties = {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: isActive ? '#22c55e' : '#94a3b8',
    borderStyle: 'solid',
  };

  const topLeft = { ...cornerStyle, top: 12, left: 12, borderWidth: '3px 0 0 3px', borderRadius: '4px 0 0 0' };
  const topRight = { ...cornerStyle, top: 12, right: 12, borderWidth: '3px 3px 0 0', borderRadius: '0 4px 0 0' };
  const bottomLeft = { ...cornerStyle, bottom: 12, left: 12, borderWidth: '0 0 3px 3px', borderRadius: '0 0 0 4px' };
  const bottomRight = { ...cornerStyle, bottom: 12, right: 12, borderWidth: '0 3px 3px 0', borderRadius: '0 0 4px 0' };

  return (
    <div className="relative w-full overflow-hidden bg-black rounded-xl" style={{ aspectRatio: '4/3' }}>
      {/* 视频预览 */}
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
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-300">正在请求摄像头...</p>
            </div>
          )}
          {isIdle && !isInitializing && (
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

      {/* 扫描框叠加层 — 只在扫码模式或离线模式下显示 */}
      {(isActive) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* 半透明蒙层 */}
          <div className="absolute inset-0 bg-black/30" />

          {/* 扫描框 */}
          <div className="relative w-3/5" style={{ maxWidth: 280, aspectRatio: '1/1' }}>
            {/* 扫描框内部（透明） */}
            <div className="w-full h-full" />

            {/* 四角 */}
            <div style={topLeft} />
            <div style={topRight} />
            <div style={bottomLeft} />
            <div style={bottomRight} />

            {/* 扫描线动画 */}
            <div className="absolute left-0 right-0 h-0.5 bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-scan-line" />
          </div>

          {/* 底部提示文字 */}
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-white text-sm font-medium tracking-wider">
              {status === 'offline' ? '📴 离线模式 — 缓存记录中' : '请对准学生QR码'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraScanBox;
