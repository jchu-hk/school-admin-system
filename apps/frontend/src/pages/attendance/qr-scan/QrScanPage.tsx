import React, { useEffect, useMemo, useState } from 'react';
import CameraScanBox from './CameraScanBox';
import ScanResultToast from './ScanResultToast';
import RecentScans from './RecentScans';
import { useCameraScan, ScanStatus } from './useCameraScan';
import './qr-scan.css';

/**
 * QrScanPage — 教职工扫码签到主页面
 *
 * 布局 (Mobile 端):
 * ┌──────────────────────────────┐
 * │  👤 李老师 (教职工)    [登出] │
 * ├──────────────────────────────┤
 * │                              │
 * │    ┌──────────────────────┐  │
 * │    │  CameraScanBox       │  │
 * │    │  (四角扫描框)         │  │
 * │    └──────────────────────┘  │
 * │                              │
 * │  ──────── 最近签到 ──────── │
 * │  🟢 张小明 三年级一班 07:28   │
 * │  🟢 李小花 三年级二班 07:31   │
 * │  🔴 王大力 已签到(重复)       │
 * └──────────────────────────────┘
 *
 * 功能:
 * - 加载后请求摄像头权限，自动进入扫码模式
 * - 识别 QR 码后调用 scan API
 * - 显示结果弹窗（3秒后自动回到扫码）
 * - 缓存最近5条签到记录
 * - 离线模式黄色 banner
 */

// ==================== 模拟用户数据 ====================
// 实际项目中应从 auth context / jwt token 中解析
interface StaffInfo {
  name: string;
  role: string;
}

const MOCK_STAFF: StaffInfo = {
  name: '李老师',
  role: '教职工',
};

// ==================== 主组件 ====================

const QrScanPage: React.FC = () => {
  const {
    videoRef,
    status,
    scanResult,
    error,
    recentScans,
    isOnline,
    isSyncing,
    debugInfo,
    startScanning,
    stopScanning,
  } = useCameraScan();

  const [showToast, setShowToast] = useState(false);

  // 页面加载时自动启动摄像头扫码
  useEffect(() => {
    startScanning();
    // 组件卸载时释放
    return () => {
      stopScanning();
    };
  }, [startScanning, stopScanning]);

  // 检测到 scanResult 时显示弹窗
  useEffect(() => {
    if (scanResult) {
      setShowToast(true);
    } else {
      setShowToast(false);
    }
  }, [scanResult]);

  // 判断 toast 的状态类型
  const toastStatus = useMemo<Extract<ScanStatus, 'success' | 'expired' | 'duplicate' | 'invalid'> | null>(() => {
    if (!scanResult) return null;
    return scanResult.status as any;
  }, [scanResult]);

  // ===== 登出处理 =====
  const handleLogout = () => {
    stopScanning();
    // 实际项目跳转到登录页
    window.location.href = '/login';
  };

  // ===== 重新扫码 =====
  const handleRetry = () => {
    startScanning();
  };

  // ===== 手动暂停/继续 =====
  const [paused, setPaused] = useState(false);
  const handleTogglePause = () => {
    if (paused) {
      setPaused(false);
      startScanning();
    } else {
      setPaused(true);
      stopScanning();
    }
  };

  // 各状态下的底部按钮
  const renderActionButton = () => {
    if (status === 'initializing') {
      return null;
    }

    if (status === 'idle' || paused) {
      return (
        <button
          onClick={handleRetry}
          className="w-full py-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium rounded-xl transition-colors duration-150 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          启动扫码
        </button>
      );
    }

    return (
      <button
        onClick={handleTogglePause}
        className="w-full py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 font-medium rounded-xl transition-colors duration-150 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        暂停扫码
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* ===== 顶部工具栏 ===== */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {/* 头像占位 */}
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.523 0-10 4.477-10 10h20c0-5.523-4.477-10-10-10z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {MOCK_STAFF.name}
            </p>
            <p className="text-[11px] text-gray-400">{MOCK_STAFF.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 同步状态指示器 */}
          {isSyncing && (
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              同步中
            </div>
          )}

          {/* 登出按钮 */}
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 hover:text-red-600 active:text-red-700 font-medium px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            登出
          </button>
        </div>
      </header>

      {/* ===== 离线模式 Banner ===== */}
      {!isOnline && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-yellow-700">
            📴 已切换离线模式 — 签到记录将缓存在本地，网络恢复后自动同步
          </p>
        </div>
      )}

      {/* ===== 主内容区域 ===== */}
      <main className="flex-1 px-4 pt-4 pb-6">
        {/* 摄像头预览 */}
        <CameraScanBox
          videoRef={videoRef}
          status={status}
          error={error}
        />

        {/* 操作按钮 */}
        <div className="mt-4">
          {renderActionButton()}
        </div>

        {/* 当前状态指示 */}
        <div className="mt-3 text-center">
          <StatusIndicator status={status} />
          <p className="text-[10px] text-gray-400 mt-1">{debugInfo || ' '}</p>
        </div>

        {/* 最近签到列表 */}
        <RecentScans scans={recentScans} />
      </main>

      {/* ===== 扫描结果弹窗 ===== */}
      {scanResult && toastStatus && (
        <ScanResultToast
          result={scanResult}
          status={toastStatus}
          visible={showToast}
        />
      )}
    </div>
  );
};

// ==================== 状态指示器 ====================

interface StatusIndicatorProps {
  status: ScanStatus;
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  switch (status) {
    case 'initializing':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
          正在初始化摄像头...
        </span>
      );
    case 'scanning':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          扫描中 — 请对准学生QR码
        </span>
      );
    case 'offline':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-yellow-600">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          离线模式 — 扫码将缓存到本地
        </span>
      );
    case 'success':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
          ✅ 签到成功 — 3秒后自动恢复
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-yellow-600">
          ⚠️ QR码已过期
        </span>
      );
    case 'duplicate':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
          ℹ️ 该学生已签到
        </span>
      );
    case 'invalid':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
          ❌ 无效QR码
        </span>
      );
    case 'idle':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          扫码已暂停
        </span>
      );
  }
}

export default QrScanPage;
