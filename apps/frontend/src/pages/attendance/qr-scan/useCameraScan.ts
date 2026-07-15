import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useCameraScan — 摄像头管理与扫码逻辑
 *
 * 职责:
 * 1. 请求并管理摄像头权限
 * 2. 提供 video 流给 <CameraScanBox>
 * 3. 基于 setInterval 驱动二维码检测（模拟/真实解码）
 * 4. 回调通知父组件扫码结果
 */

// ==================== 类型定义 ====================

export type ScanStatus =
  | 'idle'        // 初始态
  | 'initializing' // 正在请求摄像头
  | 'scanning'    // 扫码中
  | 'success'     // 成功 🟢
  | 'expired'     // 过期 🟡
  | 'duplicate'   // 重复 🔵
  | 'invalid'     // 伪造/无效 🔴
  | 'offline';    // 离线模式

export interface ScanResultData {
  /** 结果状态码 (success|expired|duplicate|invalid) */
  status: 'success' | 'expired' | 'duplicate' | 'invalid';
  /** 学生姓名（仅 success 时有值） */
  student_name?: string;
  /** 班级名称（仅 success 时有值） */
  class_name?: string;
  /** 签到时间 ISO 字符串 */
  scanned_at?: string;
  /** 学生ID */
  student_id?: string;
  /** 后端返回的消息文本 */
  message?: string;
  /** 错误码 */
  error?: string;
}

export interface RecentScan {
  /** 唯一标识 */
  id: string;
  /** 学生姓名 */
  student_name: string;
  /** 班级 */
  class_name: string;
  /** 签到时间 (HH:mm 格式) */
  time: string;
  /** 结果 (success | duplicate | invalid) */
  result: string;
}

// ==================== 离线缓存 ====================

const OFFLINE_CACHE_KEY = 'qr_scan_offline_cache';
const RECENT_SCANS_KEY = 'qr_scan_recent_scans';
const MAX_RECENT_SCANS = 5;

/** 从 LocalStorage 读取未同步的离线缓存 */
function getOfflineCache(): string[] {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 写入离线缓存 */
function addToOfflineCache(qrData: string) {
  const cache = getOfflineCache();
  cache.push(qrData);
  // 最多保留 200 条离线记录
  while (cache.length > 200) cache.shift();
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
}

/** 清空离线缓存 */
function clearOfflineCache() {
  localStorage.removeItem(OFFLINE_CACHE_KEY);
}

/** 读取最近签到列表 */
function getRecentScans(): RecentScan[] {
  try {
    const raw = localStorage.getItem(RECENT_SCANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 添加一条最近的签到记录（最多5条） */
function addRecentScan(scan: RecentScan) {
  const list = getRecentScans();
  list.unshift(scan);
  while (list.length > MAX_RECENT_SCANS) list.pop();
  localStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(list));
}

// ==================== 扫描间隔 (ms) ====================
// 实际二维码检测间隔（真实项目使用 jsQR 等库）
const SCAN_INTERVAL_MS = 500;

// ==================== API 路径 ====================
const SCAN_API_URL = '/api/attendance/qr/scan';
const SYNC_API_URL = '/api/attendance/qr/sync-batch';

// ==================== Hook ====================

export function useCameraScan() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScanningRef = useRef(false);

  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>(getRecentScans());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // ===== 网络状态监听 =====
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // 网络恢复 → 尝试同步离线数据
      syncOfflineCache();
    };
    const goOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ===== 同步离线缓存 =====
  const syncOfflineCache = useCallback(async () => {
    const cache = getOfflineCache();
    if (cache.length === 0) return;
    setIsSyncing(true);
    try {
      const response = await fetch(SYNC_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          device_id: 'web-scan-' + Date.now(),
          batch: cache.map((qr) => ({
            qr_raw: qr,
            scanned_at: new Date().toISOString(),
          })),
        }),
      });
      if (response.ok) {
        clearOfflineCache();
      }
    } catch {
      // 同步失败保持缓存
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ===== 请求摄像头权限 =====
  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (err: any) {
      setError(
        err.name === 'NotAllowedError'
          ? '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问'
          : err.name === 'NotFoundError'
          ? '未检测到摄像头设备'
          : '摄像头启动失败: ' + err.message
      );
      return false;
    }
  }, []);

  // ===== 解码二维码（使用 jsQR） =====
  const decodeQR = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    // 延迟加载 jsQR（如果浏览器环境中可用）
    const jsQR = (window as any).jsQR;
    if (!jsQR) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 当视频有足够分辨率时采样
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    return code?.data || null;
  }, []);

  // ===== 调用扫码 API =====
  const callScanApi = useCallback(
    async (qrData: string): Promise<ScanResultData> => {
      try {
        const response = await fetch(SCAN_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            qr_code_data: qrData,
            device_id: 'web-scan-' + Date.now(),
          }),
        });

        const body = await response.json();

        if (response.ok && body.success) {
          const d = body.data;
          return {
            status: 'success',
            student_name: d.student_name,
            class_name: d.class_name,
            scanned_at: d.scanned_at,
            student_id: d.student_id,
            message: '签到成功！',
          };
        }

        // 处理错误响应
        const err =
          body?.error ||
          body?.data?.error ||
          body?.message ||
          '未知错误';

        if (
          err === 'QR_EXPIRED' ||
          body?.error === 'QR_EXPIRED'
        ) {
          return { status: 'expired', message: 'QR码已过期，请让学生刷新' };
        }
        if (
          err === 'DUPLICATE_SCAN' ||
          err === 'DUPLICATE_CHECKIN' ||
          body?.error === 'DUPLICATE_SCAN' ||
          body?.error === 'DUPLICATE_CHECKIN'
        ) {
          return {
            status: 'duplicate',
            message: '该学生已签到',
            scanned_at: body?.checked_in_at,
          };
        }
        if (
          err === 'INVALID_QR_FORMAT' ||
          err === 'INVALID_SIGNATURE' ||
          err === 'QR_NOT_FOUND' ||
          body?.error === 'INVALID_QR_FORMAT' ||
          body?.error === 'INVALID_SIGNATURE' ||
          body?.error === 'QR_NOT_FOUND'
        ) {
          return { status: 'invalid', message: '无效QR码' };
        }

        // 默认当作无效
        return { status: 'invalid', message: body?.message || '无效QR码' };
      } catch (err: any) {
        // 网络错误 → 离线模式
        return { status: 'invalid', message: '网络异常，请检查连接' };
      }
    },
    []
  );

  // ===== 执行一次扫码 =====
  const performScan = useCallback(async () => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      const qrData = decodeQR();
      if (!qrData) return;

      // 一旦检测到 QR 码，立即停止扫描
      stopScanningInternal();

      let result: ScanResultData;

      if (!navigator.onLine) {
        // 离线模式：缓存 QR 数据
        addToOfflineCache(qrData);
        setStatus('offline');
        result = {
          status: 'invalid',
          message: '已缓存至本地（离线模式）',
        };
      } else {
        result = await callScanApi(qrData);
      }

      setScanResult(result);
      setStatus(result.status);

      // 成功 → 添加到最近签到列表
      if (result.status === 'success') {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}`;
        const scan: RecentScan = {
          id: result.student_id || Date.now().toString(),
          student_name: result.student_name || '未知',
          class_name: result.class_name || '',
          time: timeStr,
          result: 'success',
        };
        addRecentScan(scan);
        setRecentScans(getRecentScans());
      }

      // 3 秒后自动恢复扫码
      setTimeout(() => {
        setScanResult(null);
        setStatus('scanning');
        startScanningInternal();
      }, 3000);
    } catch {
      // ignore
    } finally {
      isScanningRef.current = false;
    }
  }, [decodeQR, callScanApi]);

  const startScanningInternal = useCallback(() => {
    if (scanTimerRef.current) return;
    scanTimerRef.current = setInterval(performScan, SCAN_INTERVAL_MS);
  }, [performScan]);

  const stopScanningInternal = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  // ===== 公开的扫码控制方法 =====
  const startScanning = useCallback(async () => {
    setError(null);
    setStatus('initializing');

    const ok = await requestCamera();
    if (!ok) {
      setStatus('idle');
      return;
    }

    // 创建离屏 canvas
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    setStatus('scanning');
    startScanningInternal();
  }, [requestCamera, startScanningInternal]);

  const stopScanning = useCallback(() => {
    stopScanningInternal();

    // 释放摄像头
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus('idle');
  }, [stopScanningInternal]);

  // ===== 清理 =====
  useEffect(() => {
    return () => {
      stopScanningInternal();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stopScanningInternal]);

  return {
    /** 视频元素 ref */
    videoRef,
    /** 当前扫描状态 */
    status,
    /** 最近扫描结果 */
    scanResult,
    /** 错误信息 */
    error,
    /** 最近签到列表 */
    recentScans,
    /** 是否在线 */
    isOnline,
    /** 是否正在同步离线数据 */
    isSyncing,
    /** 开始扫描 */
    startScanning,
    /** 停止扫描 */
    stopScanning,
  };
}
