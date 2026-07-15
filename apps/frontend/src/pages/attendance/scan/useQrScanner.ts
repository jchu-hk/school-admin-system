import { useState, useRef, useCallback, useEffect } from 'react';
import { scanQrCode, syncOfflineBatch, ScanApiError } from './api';

/**
 * useQrScanner — QR扫码逻辑 Hook
 *
 * 职责:
 * 1. 请求并管理摄像头权限（getUserMedia）
 * 2. 使用 jsQR 解码 QR 码帧
 * 3. 调用 scan API 验证签到
 * 4. 离线缓存 + 网络恢复自动同步
 * 5. 维护最近签到记录（localStorage）
 */

// ==================== 类型定义 ====================

export type ScanStatus =
  | 'idle'          // 初始/暂停态
  | 'initializing'  // 正在请求摄像头
  | 'scanning'      // 扫码中
  | 'success'       // 成功 🟢
  | 'expired'       // 过期 🟡
  | 'duplicate'     // 重复 🔵
  | 'invalid'       // 伪造/无效 🔴
  | 'offline';      // 离线模式 📴

export interface ScanResultData {
  /** 结果状态码 */
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
  result: 'success' | 'duplicate' | 'invalid';
}

// ==================== 离线缓存 ====================

const OFFLINE_CACHE_KEY = 'qr_scan_offline_cache';
const RECENT_SCANS_KEY = 'qr_scan_recent_scans';
const LAST_DEVICE_ID_KEY = 'qr_scan_device_id';

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(LAST_DEVICE_ID_KEY);
  if (!id) {
    id = `web-scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(LAST_DEVICE_ID_KEY, id);
  }
  return id;
}

function getOfflineCache(): string[] {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToOfflineCache(qrData: string) {
  const cache = getOfflineCache();
  cache.push(qrData);
  while (cache.length > 200) cache.shift();
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
}

function clearOfflineCache() {
  localStorage.removeItem(OFFLINE_CACHE_KEY);
}

function getRecentScans(): RecentScan[] {
  try {
    const raw = localStorage.getItem(RECENT_SCANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecentScan(scan: RecentScan) {
  const list = getRecentScans();
  list.unshift(scan);
  while (list.length > 5) list.pop();
  localStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(list));
}

// ==================== 常量 ====================

const SCAN_INTERVAL_MS = 500;
const AUTO_RETURN_MS = 3000;

// ==================== jsQR 动态加载 ====================

// 动态加载 jsQR（纯 JS 二维码解码库）
// 从 window 获取（CDN 加载）或动态 import
let jsQRModule: ((data: Uint8ClampedArray, width: number, height: number, options?: any) => { data: string } | null) | null = null;

async function ensureJsQR(): Promise<boolean> {
  if (jsQRModule) return true;
  try {
    if ((window as any).jsQR) {
      jsQRModule = (window as any).jsQR;
      return true;
    }
    // 使用动态 import — 模块名 jsQR 仅运行时决定，TypeScript 不检查路径
    const mod = await import(/* @vite-ignore */ 'jsqr');
    jsQRModule = mod.default || mod;
    return true;
  } catch {
    if ((window as any).jsQR) {
      jsQRModule = (window as any).jsQR;
      return true;
    }
    return false;
  }
}

// ==================== Hook ====================

export function useQrScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoReturnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScanningRef = useRef(false);
  const deviceIdRef = useRef<string>(getOrCreateDeviceId());

  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>(getRecentScans());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // ── 内部扫描启停 ──

  const stopScanningInternal = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  const scheduleAutoReturn = useCallback(() => {
    if (autoReturnTimerRef.current) clearTimeout(autoReturnTimerRef.current);
    autoReturnTimerRef.current = setTimeout(() => {
      setScanResult(null);
      setStatus('scanning');
      startScanningInternal();
    }, AUTO_RETURN_MS);
  }, []);

  const decodeQR = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !jsQRModule) return null;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQRModule(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    return code?.data || null;
  }, []);

  const performScan = useCallback(async () => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      const qrData = decodeQR();
      if (!qrData) return;

      stopScanningInternal();

      if (!navigator.onLine) {
        addToOfflineCache(qrData);
        setStatus('offline');
        setScanResult({
          status: 'invalid',
          message: '已缓存至本地（离线模式）',
        });
        scheduleAutoReturn();
        return;
      }

      try {
        const data = await scanQrCode(qrData, deviceIdRef.current);
        setStatus('success');
        const now = new Date(data.scanned_at || Date.now());
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setScanResult({
          status: 'success',
          student_name: data.student_name,
          class_name: data.class_name,
          scanned_at: data.scanned_at,
          student_id: data.student_id,
          message: '签到成功！',
        });
        addRecentScan({
          id: data.student_id,
          student_name: data.student_name,
          class_name: data.class_name,
          time: timeStr,
          result: 'success',
        });
        setRecentScans(getRecentScans());
      } catch (err) {
        if (err instanceof ScanApiError) {
          if (err.isExpired) {
            setStatus('expired');
            setScanResult({ status: 'expired', message: err.message });
          } else if (err.isDuplicate) {
            setStatus('duplicate');
            setScanResult({ status: 'duplicate', message: err.message, scanned_at: err.checkedInAt });
          } else {
            setStatus('invalid');
            setScanResult({ status: 'invalid', message: err.message });
            console.warn('[SECURITY] 无效QR码尝试:', {
              qr_data: qrData.slice(0, 32) + '...',
              device_id: deviceIdRef.current,
              error: err.code,
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          setStatus('invalid');
          setScanResult({ status: 'invalid', message: '扫码失败，请重试' });
        }
      }

      scheduleAutoReturn();
    } finally {
      isScanningRef.current = false;
    }
  }, [decodeQR, stopScanningInternal, scheduleAutoReturn]);

  // NOTE: useCallback below references `performScan` which references `startScanningInternal`.
  // To avoid circular dependencies, we define startScanningInternal after performScan
  // using a ref-based approach for the interval.
  const startScanningInternal = useCallback(() => {
    if (scanTimerRef.current) return;
    scanTimerRef.current = setInterval(performScan, SCAN_INTERVAL_MS);
  }, [performScan]);

  // ── 网络状态监听 ──

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
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

  // ── 同步离线缓存 ──

  const syncOfflineCache = useCallback(async () => {
    const cache = getOfflineCache();
    if (cache.length === 0) return;
    setIsSyncing(true);
    try {
      await syncOfflineBatch({
        device_id: deviceIdRef.current,
        batch: cache.map((qrRaw) => ({
          qr_raw: qrRaw,
          scanned_at: new Date().toISOString(),
        })),
      });
      clearOfflineCache();
    } catch {
      // 保留缓存，下次重试
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ── 请求摄像头 ──

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
      if (err.name === 'NotAllowedError') {
        setError('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问');
      } else if (err.name === 'NotFoundError') {
        setError('未检测到摄像头设备');
      } else if (err.name === 'NotReadableError') {
        setError('摄像头被其他应用占用，请关闭后重试');
      } else {
        setError(`摄像头启动失败: ${err.message}`);
      }
      return false;
    }
  }, []);

  // ── 公开方法 ──

  const startScanning = useCallback(async () => {
    setError(null);
    setStatus('initializing');

    const jsQrReady = await ensureJsQR();
    if (!jsQrReady) {
      setError('二维码解码库加载失败，请刷新页面重试');
      setStatus('idle');
      return;
    }

    const ok = await requestCamera();
    if (!ok) {
      setStatus('idle');
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    setStatus('scanning');
    startScanningInternal();
  }, [requestCamera, startScanningInternal]);

  const stopScanning = useCallback(() => {
    stopScanningInternal();
    if (autoReturnTimerRef.current) {
      clearTimeout(autoReturnTimerRef.current);
      autoReturnTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, [stopScanningInternal]);

  const resumeScanning = useCallback(async () => {
    setScanResult(null);
    await startScanning();
  }, [startScanning]);

  // ── 组件卸载清理 ──

  useEffect(() => {
    return () => {
      stopScanningInternal();
      if (autoReturnTimerRef.current) clearTimeout(autoReturnTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stopScanningInternal]);

  return {
    videoRef,
    status,
    scanResult,
    error,
    recentScans,
    isOnline,
    isSyncing,
    startScanning,
    stopScanning,
    resumeScanning,
  };
}
