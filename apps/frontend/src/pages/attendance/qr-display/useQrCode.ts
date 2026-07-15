import { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateQrCode,
  fetchStudentProfile,
  QrApiError,
  GenerateQrData,
  StudentProfile,
} from './api';

// ── Types ────────────────────────────────────────────────

export type QrStatus = 'loading' | 'active' | 'checked_in' | 'error' | 'rate_limited';

export interface QrState {
  status: QrStatus;
  qrCodeData: string | null;
  expiresAt: string | null;
  /** Seconds remaining before auto-refresh (30 → 0) */
  countdown: number;
  /** Error info when status === 'error' */
  errorMessage: string | null;
  /** Check-in time string when status === 'checked_in' */
  checkedInAt: string | null;
  /** Whether the network is offline */
  isOffline: boolean;
  /** Student profile info */
  student: StudentProfile | null;
}

export interface QrActions {
  /** Manually trigger a QR code refresh */
  refresh: () => void;
  /** Dismiss error banner */
  dismissError: () => void;
}

// ── Constants ────────────────────────────────────────────

const QR_TTL = 30; // seconds
const COUNTDOWN_INTERVAL = 1000; // 1 second

// ── Hook ─────────────────────────────────────────────────

export function useQrCode(): [QrState, QrActions] {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [status, setStatus] = useState<QrStatus>('loading');
  const [countdown, setCountdown] = useState(QR_TTL);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Clear timers helper ──────────────────────────────

  const clearTimers = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // ── Core: fetch QR code ──────────────────────────────

  const fetchQr = useCallback(async () => {
    clearTimers();
    setStatus('loading');

    try {
      const data: GenerateQrData = await generateQrCode();
      setQrCodeData(data.qr_code_data);
      setExpiresAt(data.expires_at);
      setCountdown(QR_TTL);
      setErrorMessage(null);
      setStatus('active');
    } catch (err) {
      if (err instanceof QrApiError) {
        if (err.code === 'ALREADY_CHECKED_IN') {
          // 今日已签到
          setQrCodeData(null);
          setExpiresAt(null);
          setCheckedInAt(
            err.checkedInAt
              ? formatTime(err.checkedInAt)
              : '今日较早时间',
          );
          setStatus('checked_in');
          clearTimers();
          return;
        }
        if (err.code === 'RATE_LIMIT') {
          setErrorMessage(err.message);
          setStatus('rate_limited');
          // Wait and retry automatically
          refreshTimeoutRef.current = setTimeout(() => {
            fetchQr();
          }, 5000);
          return;
        }
      }

      // Generic error
      setErrorMessage(err instanceof Error ? err.message : '生成二维码失败');
      setStatus('error');

      // Retry after 10 seconds on error
      refreshTimeoutRef.current = setTimeout(() => {
        fetchQr();
      }, 10000);
    }
  }, [clearTimers]);

  // ── Countdown timer ──────────────────────────────────

  const startCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Expired — auto refresh
          fetchQr();
          return QR_TTL;
        }
        return prev - 1;
      });
    }, COUNTDOWN_INTERVAL);
  }, [fetchQr]);

  // ── Initialization ───────────────────────────────────

  useEffect(() => {
    // Load student profile
    fetchStudentProfile().then(setStudent);

    // Fetch initial QR code
    fetchQr();

    return () => {
      clearTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start countdown when QR is active ────────────────

  useEffect(() => {
    if (status === 'active') {
      startCountdown();
    } else {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [status, startCountdown]);

  // ── Network status listener ─────────────────────────

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Actions ──────────────────────────────────────────

  const refresh = useCallback(() => {
    fetchQr();
  }, [fetchQr]);

  const dismissError = useCallback(() => {
    setErrorMessage(null);
    setStatus('active');
  }, []);

  // ── State ─────────────────────────────────────────────

  const state: QrState = {
    status,
    qrCodeData,
    expiresAt,
    countdown,
    errorMessage,
    checkedInAt,
    isOffline,
    student,
  };

  const actions: QrActions = {
    refresh,
    dismissError,
  };

  return [state, actions];
}

// ── Helpers ──────────────────────────────────────────────

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return isoString;
  }
}
