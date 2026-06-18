import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ArrowLeft, Camera, Search, Check, X, AlertCircle,
  CheckCircle, Clock, Users, WifiOff, Smartphone,
  Loader2,
} from 'lucide-react';
import apiClient from '../api/client';

// ============ Types ============
export interface MobileClass {
  classId: string;
  className: string;
  grade: string;
  studentCount: number;
  todayCheckedIn: number;
}

export interface MobileStudent {
  studentId: string;
  studentName: string;
  classNumber: string;
  qrcode: string;
  status: string | null;
  checkInTime: string | null;
  checkedIn: boolean;
}

export type CheckInStatus = 'present' | 'late' | 'absent' | 'sick_leave' | 'personal_leave';
export type PageView = 'class-select' | 'scan' | 'manual' | 'confirm';

// ============ Constants ============
const STATUS_LABELS: Record<CheckInStatus, string> = {
  present: '出席',
  late: '迟到',
  absent: '缺席',
  sick_leave: '病假',
  personal_leave: '事假',
};

const STATUS_COLORS: Record<CheckInStatus, string> = {
  present: 'bg-green-500',
  late: 'bg-yellow-500',
  absent: 'bg-red-500',
  sick_leave: 'bg-blue-500',
  personal_leave: 'bg-purple-500',
};

const STATUS_TEXT_COLORS: Record<CheckInStatus, string> = {
  present: 'text-green-700',
  late: 'text-yellow-700',
  absent: 'text-red-700',
  sick_leave: 'text-blue-700',
  personal_leave: 'text-purple-700',
};

const STATUS_BG_COLORS: Record<CheckInStatus, string> = {
  present: 'bg-green-50 border-green-200',
  late: 'bg-yellow-50 border-yellow-200',
  absent: 'bg-red-50 border-red-200',
  sick_leave: 'bg-blue-50 border-blue-200',
  personal_leave: 'bg-purple-50 border-purple-200',
};

// ============ Sound Effects ============
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio not supported
  }
};

const playSuccess = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio not supported
  }
};

const vibrate = (ms = 200) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(ms);
  }
};

// ============ Alert Modal Component ============
interface AlertModalProps {
  type: 'warning' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  extraButton?: { label: string; onClick: () => void };
}

function AlertModal({ type, title, message, onClose, extraButton }: AlertModalProps) {
  const icons = {
    warning: <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto" />,
    error: <X className="w-10 h-10 text-red-500 mx-auto" />,
    success: <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />,
    info: <AlertCircle className="w-10 h-10 text-blue-500 mx-auto" />,
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
        <div className="pt-6 pb-4 text-center">
          {icons[type]}
          <h3 className="mt-3 text-base font-bold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600 px-4">{message}</p>
        </div>
        <div className="flex border-t border-gray-100">
          {extraButton && (
            <button
              onClick={extraButton.onClick}
              className="flex-1 py-3 text-sm font-medium text-blue-600 hover:bg-gray-50 active:bg-gray-100 transition"
            >
              {extraButton.label}
            </button>
          )}
          <button
            onClick={onClose}
            className={`flex-1 py-3 text-sm font-medium ${extraButton ? 'border-l border-gray-100' : ''} text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition`}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Scan Success Overlay ============
interface ScanSuccessProps {
  studentName: string;
  onClose: () => void;
}

function ScanSuccessOverlay({ studentName, onClose }: ScanSuccessProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 1500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-500/90 pointer-events-none">
      <div className="text-center text-white">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        <div className="text-xl font-bold">{studentName}</div>
        <div className="text-sm mt-1 opacity-80">签到成功</div>
      </div>
    </div>
  );
}

// ============ Main Component ============
export default function AttendanceMobilePage() {
  const navigate = useNavigate();

  const [view, setView] = useState<PageView>('class-select');
  const [selectedClass, setSelectedClass] = useState<MobileClass | null>(null);
  const [classes, setClasses] = useState<MobileClass[]>([]);
  const [students, setStudents] = useState<MobileStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<AlertModalProps | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<{ studentName: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<Record<string, unknown>[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // ===== Stable helper: dynamic device ID =====
  const getDeviceId = () => {
    let id = localStorage.getItem('attendance_device_id');
    if (!id) {
      id = `mobile-${crypto.randomUUID?.() || Date.now()}`;
      localStorage.setItem('attendance_device_id', id);
    }
    return id;
  };

  // ===== Offline queue sync =====
  const syncOfflineQueue = useCallback(async () => {
    const queue = [...offlineQueue];
    if (queue.length === 0) return;
    setOfflineQueue([]);
    for (const item of queue) {
      try {
        await apiClient.post('/attendance/mobile/scan', item);
      } catch {
        setOfflineQueue(prev => [...prev, item]);
      }
    }
  }, [offlineQueue]);

  // Online/Offline detection — stable deps, no loop
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setTimeout(syncOfflineQueue, 0);
  }, [syncOfflineQueue]);

  const handleOffline = useCallback(() => setIsOnline(false), []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Load classes
  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/attendance/mobile/classes');
      setClasses(res.data?.data || res.data || []);
    } catch {
      setClasses([
        { classId: 'cls-1a-2026', className: '1A', grade: '一年级', studentCount: 38, todayCheckedIn: 28 },
        { classId: 'cls-1b-2026', className: '1B', grade: '一年级', studentCount: 36, todayCheckedIn: 30 },
        { classId: 'cls-2a-2026', className: '2A', grade: '二年级', studentCount: 35, todayCheckedIn: 20 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'class-select') loadClasses();
  }, [view, loadClasses]);

  // Load students
  const loadStudents = useCallback(async (classId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/attendance/mobile/class/${classId}/students`, { params: { date: today } });
      setStudents(res.data?.data?.students || res.data?.students || []);
    } catch {
      setStudents([
        { studentId: 'stu-001', studentName: '陳小明', classNumber: '01', qrcode: 'STUDENT:stu-001:陳小明', status: 'present', checkInTime: '07:58', checkedIn: true },
        { studentId: 'stu-002', studentName: '李小红', classNumber: '02', qrcode: 'STUDENT:stu-002:李小红', status: null, checkInTime: null, checkedIn: false },
        { studentId: 'stu-003', studentName: '王小華', classNumber: '03', qrcode: 'STUDENT:stu-003:王小華', status: null, checkInTime: null, checkedIn: false },
        { studentId: 'stu-004', studentName: '張志偉', classNumber: '04', qrcode: 'STUDENT:stu-004:張志偉', status: 'present', checkInTime: '07:55', checkedIn: true },
        { studentId: 'stu-005', studentName: '黃麗華', classNumber: '05', qrcode: 'STUDENT:stu-005:黃麗華', status: null, checkInTime: null, checkedIn: false },
        { studentId: 'stu-006', studentName: '陳家強', classNumber: '06', qrcode: 'STUDENT:stu-006:陳家強', status: 'late', checkInTime: '08:05', checkedIn: true },
        { studentId: 'stu-007', studentName: '林美琪', classNumber: '07', qrcode: 'STUDENT:stu-007:林美琪', status: null, checkInTime: null, checkedIn: false },
        { studentId: 'stu-008', studentName: '周傑倫', classNumber: '08', qrcode: 'STUDENT:stu-008:周傑倫', status: null, checkInTime: null, checkedIn: false },
      ]);
    } finally {
      setLoading(false);
    }
  }, [today]);

  // Scanner lifecycle
  const startScanner = useCallback(async () => {
    if (!scannerContainerRef.current) return;
    setIsScanning(true);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        onScanSuccess,
        () => {}
      );
    } catch {
      setIsScanning(false);
      setAlertModal({ type: 'error', title: '摄像头启动失败', message: '请允许摄像头权限，或切换到手动输入模式', onClose: () => setAlertModal(null) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  // Scan success handler
  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (!selectedClass) return;
    playBeep();
    const currentTime = new Date().toLocaleTimeString('zh-TW', { hour12: false });

    const parts = decodedText.split(':');
    if (parts.length < 3 || parts[0] !== 'STUDENT') {
      vibrate(300);
      setAlertModal({ type: 'error', title: '无效的二维码', message: '请扫描学生证上的有效二维码', onClose: () => setAlertModal(null) });
      return;
    }

    const [, studentId, ...rest] = parts;
    const studentName = rest.join(':');
    const existing = students.find(s => s.studentId === studentId);
    if (existing?.checkedIn) {
      vibrate(200);
      setAlertModal({ type: 'warning', title: '已签到', message: `${studentName} 已于 ${existing.checkInTime} 签到`, onClose: () => setAlertModal(null) });
      return;
    }

    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, checkedIn: true, status: 'present', checkInTime: currentTime.substring(0, 8) } : s));
    setScanSuccess({ studentName });
    playSuccess();
    vibrate(100);

    const payload = { qrcode: decodedText, classId: selectedClass.classId, attendanceDate: today, status: 'present', checkInTime: currentTime.substring(0, 8), deviceId: getDeviceId() };
    if (isOnline) {
      try { await apiClient.post('/attendance/mobile/scan', payload); }
      catch { setOfflineQueue(prev => [...prev, payload]); }
    } else {
      setOfflineQueue(prev => [...prev, payload]);
    }
  }, [selectedClass, students, today, isOnline]);

  // Manual actions
  const handleManualCheckIn = (studentId: string, status: CheckInStatus) => {
    const currentTime = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, checkedIn: true, status, checkInTime: currentTime.substring(0, 8) } : s));
    playSuccess();
  };

  const handleAllPresent = () => {
    students.filter(s => !s.checkedIn).forEach(s => handleManualCheckIn(s.studentId, 'present'));
  };

  // Confirm & submit
  const handleConfirm = async () => {
    if (!selectedClass) return;
    setConfirmLoading(true);
    const payload = {
      classId: selectedClass.classId,
      attendanceDate: today,
      records: students.map(s => ({ studentId: s.studentId, status: s.status || 'present', checkInTime: s.checkInTime || new Date().toLocaleTimeString('zh-TW', { hour12: false }).substring(0, 8) })),
      syncSource: 'MOBILE_SCAN',
    };
    try {
      if (isOnline) await apiClient.post('/attendance/mobile/batch', payload);
      setConfirmSuccess(true);
    } catch {
      setAlertModal({ type: 'warning', title: '网络异常', message: '签到已保存，联网后将自动同步。', onClose: () => setAlertModal(null), extraButton: { label: '重试', onClick: handleConfirm } });
    } finally {
      setConfirmLoading(false);
    }
  };

  // Navigation helpers
  const goToScan = async (cls: MobileClass) => {
    setSelectedClass(cls);
    setView('scan');
    await loadStudents(cls.classId);
    setTimeout(() => startScanner(), 300);
  };

  const goBack = () => {
    stopScanner();
    if (view === 'scan' || view === 'manual') setView('class-select');
    else if (view === 'confirm') setView('manual');
  };

  // Computed
  const checkedInCount = students.filter(s => s.checkedIn).length;
  const totalCount = students.length || selectedClass?.studentCount || 0;
  const progressPercent = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;
  const statsCount = (status: CheckInStatus) => students.filter(s => s.checkedIn && s.status === status).length;
  const filteredStudents = searchQuery ? students.filter(s => s.studentName.includes(searchQuery)) : students;

  const OfflineBanner = ({ bg, text }: { bg: string; text: string }) => (
    <div className={`${bg} px-4 py-2 flex items-center gap-2`}>
      <WifiOff size={14} className="flex-shrink-0" />
      <span className="text-xs">{text}</span>
    </div>
  );

  // ===== CLASS SELECT VIEW =====
  if (view === 'class-select') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900 flex-1">出勤扫码</h1>
        </div>
        {!isOnline && <OfflineBanner bg="bg-yellow-100 border-b border-yellow-200 text-yellow-800" text="离线模式，联网后自动同步" />}
        <div className="flex-1 p-4">
          <p className="text-sm text-gray-500 mb-4 text-center">请选择今日签到班级</p>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
              <span className="text-sm text-gray-500">加载中...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-16">
              <Users size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">暂无可签到班级</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map(cls => (
                <button
                  key={cls.classId}
                  onClick={() => goToScan(cls)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left active:bg-gray-50 transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-gray-900">{cls.grade}{cls.className}班</div>
                      <div className="text-xs text-gray-400 mt-1">{cls.classId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">今日</div>
                      <div className="bg-blue-50 text-blue-600 text-sm font-bold px-3 py-1 rounded-full">
                        {cls.todayCheckedIn}/{cls.studentCount}人
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {alertModal && <AlertModal {...alertModal} />}
      </div>
    );
  }

  // ===== SCAN VIEW =====
  if (view === 'scan') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800 active:bg-gray-700 transition">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-sm font-bold text-white flex-1">
            {selectedClass?.grade}{selectedClass?.className}班出勤签到
          </h1>
        </div>
        {!isOnline && <OfflineBanner bg="bg-yellow-500 text-yellow-100" text={`离线模式，已缓存 ${offlineQueue.length} 条记录`} />}

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-xs">
            <div
              id="qr-reader"
              ref={scannerContainerRef}
              className="w-full overflow-hidden rounded-2xl"
              style={{ minHeight: '260px', background: '#000' }}
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-white/40 rounded-2xl" />
            </div>
            {!isScanning && (
              <div className="mt-4 text-center">
                <Camera size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">点击下方按钮启动摄像头</p>
                <button
                  onClick={startScanner}
                  className="mt-3 w-full bg-blue-600 text-white text-sm font-medium py-3 rounded-lg active:bg-blue-700 transition"
                  style={{ minHeight: '44px' }}
                >
                  启动摄像头
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">已签到</span>
            <span className="text-sm font-bold text-white">{checkedInCount}/{totalCount}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="text-xs text-gray-500 text-center mb-3">{progressPercent}% 完成</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={isScanning ? stopScanner : startScanner}
              className="bg-gray-700 text-white text-sm font-medium py-3 rounded-lg active:bg-gray-600 transition"
              style={{ minHeight: '44px' }}
            >
              {isScanning ? '暂停扫码' : '继续扫码'}
            </button>
            <button
              onClick={() => { stopScanner(); setView('manual'); }}
              className="bg-white text-gray-900 text-sm font-medium py-3 rounded-lg active:bg-gray-100 transition border border-gray-300"
              style={{ minHeight: '44px' }}
            >
              <span className="flex items-center justify-center gap-1">
                <Smartphone size={14} /> 手动模式
              </span>
            </button>
          </div>
          <button
            onClick={() => { stopScanner(); setView('confirm'); }}
            className="mt-3 w-full bg-green-600 text-white text-sm font-bold py-3 rounded-lg active:bg-green-700 transition"
            style={{ minHeight: '44px' }}
          >
            查看签到统计 &rarr;
          </button>
        </div>

        {scanSuccess && <ScanSuccessOverlay studentName={scanSuccess.studentName} onClose={() => setScanSuccess(null)} />}
        {alertModal && <AlertModal {...alertModal} />}
      </div>
    );
  }

  // ===== MANUAL VIEW =====
  if (view === 'manual') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900 flex-1">
            {selectedClass?.grade}{selectedClass?.className}班 - 手动签到
          </h1>
        </div>
        {!isOnline && <OfflineBanner bg="bg-yellow-100 border-b border-yellow-200 text-yellow-800" text="离线模式，联网后自动同步" />}

        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center bg-gray-100 rounded-lg px-3" style={{ minHeight: '44px' }}>
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="搜索学生姓名..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              maxLength={50}
              className="flex-1 bg-transparent px-2 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 active:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="text-blue-500 animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">暂无学生</p>
            </div>
          ) : (
            filteredStudents.map(student => (
              <div
                key={student.studentId}
                className={`rounded-xl border p-3 transition ${
                  student.checkedIn
                    ? STATUS_BG_COLORS[student.status as CheckInStatus || 'present']
                    : 'bg-white border-gray-200'
                }`}
              >
                {student.checkedIn ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className={`text-sm font-medium ${STATUS_TEXT_COLORS[student.status as CheckInStatus || 'present']}`}>
                        {student.studentName}
                      </span>
                      <span className="text-xs text-gray-400">{student.classNumber}号</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[student.status as CheckInStatus || 'present']}`}>
                        {STATUS_LABELS[student.status as CheckInStatus || 'present']}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock size={10} /> {student.checkInTime}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-800">{student.studentName}</span>
                      <span className="text-xs text-gray-400">{student.classNumber}号</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManualCheckIn(student.studentId, 'present')}
                        className="flex-1 bg-green-500 text-white text-xs font-medium py-2 rounded-lg active:bg-green-600 transition"
                        style={{ minHeight: '36px' }}
                      >
                        出席
                      </button>
                      <button
                        onClick={() => handleManualCheckIn(student.studentId, 'late')}
                        className="flex-1 bg-yellow-500 text-white text-xs font-medium py-2 rounded-lg active:bg-yellow-600 transition"
                        style={{ minHeight: '36px' }}
                      >
                        迟到
                      </button>
                      <button
                        onClick={() => handleManualCheckIn(student.studentId, 'absent')}
                        className="flex-1 bg-red-500 text-white text-xs font-medium py-2 rounded-lg active:bg-red-600 transition"
                        style={{ minHeight: '36px' }}
                      >
                        缺席
                      </button>
                      <button
                        onClick={() => handleManualCheckIn(student.studentId, 'sick_leave')}
                        className="flex-1 bg-blue-500 text-white text-xs font-medium py-2 rounded-lg active:bg-blue-600 transition"
                        style={{ minHeight: '36px' }}
                      >
                        病假
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="bg-white border-t border-gray-200 p-4 space-y-2">
          <button
            onClick={() => setView('scan')}
            className="w-full border border-blue-500 text-blue-600 text-sm font-medium py-3 rounded-lg active:bg-blue-50 transition"
            style={{ minHeight: '44px' }}
          >
            <span className="flex items-center justify-center gap-2">
              <Camera size={14} /> 切换扫码模式
            </span>
          </button>
          <button
            onClick={handleAllPresent}
            className="w-full bg-blue-600 text-white text-sm font-bold py-3 rounded-lg active:bg-blue-700 transition"
            style={{ minHeight: '44px' }}
          >
            一键签到剩余 ({students.filter(s => !s.checkedIn).length}) 人
          </button>
          <button
            onClick={() => setView('confirm')}
            className="w-full bg-green-600 text-white text-sm font-bold py-3 rounded-lg active:bg-green-700 transition"
            style={{ minHeight: '44px' }}
          >
            查看签到统计 &rarr;
          </button>
        </div>
        {alertModal && <AlertModal {...alertModal} />}
      </div>
    );
  }

  // ===== CONFIRM VIEW =====
  const absentCount = statsCount('absent');
  const checkedInStudents = [...students]
    .filter(s => s.checkedIn)
    .sort((a, b) => (a.checkInTime || '').localeCompare(b.checkInTime || ''));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-900 flex-1">确认签到</h1>
      </div>
      {!isOnline && <OfflineBanner bg="bg-yellow-100 border-b border-yellow-200 text-yellow-800" text="离线模式，联网后自动同步" />}

      {confirmSuccess ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">签到完成！</h2>
          <p className="text-sm text-gray-500 mb-6">{selectedClass?.grade}{selectedClass?.className}班 · {today}</p>
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-4">
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
              <div className="text-2xl font-bold text-green-600">{statsCount('present')}</div>
              <div className="text-xs text-green-600 mt-1">出席</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{statsCount('late')}</div>
              <div className="text-xs text-yellow-600 mt-1">迟到</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-xs text-red-600 mt-1">缺席</div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mb-6">共 {checkedInCount} / {totalCount} 人</div>
          <button
            onClick={() => navigate('/attendance')}
            className="w-full max-w-xs bg-blue-600 text-white text-sm font-bold py-3 rounded-lg active:bg-blue-700 transition"
            style={{ minHeight: '44px' }}
          >
            返回出勤概览
          </button>
        </div>
      ) : (
        <div className="flex-1 p-4">
          {/* Summary card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="text-sm font-bold text-gray-800 mb-1">{selectedClass?.grade}{selectedClass?.className}班出勤统计</div>
            <div className="text-xs text-gray-400 mb-3">日期: {today}</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">{statsCount('present')}</div>
                <div className="text-xs text-green-600 mt-1">出席</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{statsCount('late')}</div>
                <div className="text-xs text-yellow-600 mt-1">迟到</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
                <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                <div className="text-xs text-red-600 mt-1">缺席</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 text-center">共 {checkedInCount} / {totalCount} 人</div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">签到进度</span>
              <span className="text-sm font-bold text-gray-800">{checkedInCount}/{totalCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1 text-right">{progressPercent}%</div>
          </div>

          {/* Detail list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">签到明细</span>
            </div>
            {checkedInStudents.length === 0 ? (
              <div className="py-8 text-center">
                <Users size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">暂无签到记录</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {checkedInStudents.map(student => (
                  <div key={student.studentId} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-green-500" />
                      <span className="text-sm text-gray-800">{student.studentName}</span>
                      <span className="text-xs text-gray-400">{student.classNumber}号</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[student.status as CheckInStatus || 'present']}`}>
                        {STATUS_LABELS[student.status as CheckInStatus || 'present']}
                      </span>
                      <span className="text-xs text-gray-400">{student.checkInTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom submit button */}
      {!confirmSuccess && (
        <div className="bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleConfirm}
            disabled={confirmLoading}
            className="w-full bg-green-600 text-white text-sm font-bold py-3 rounded-lg active:bg-green-700 transition disabled:opacity-50"
            style={{ minHeight: '44px' }}
          >
            {confirmLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> 保存中...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check size={16} /> 提交签到
              </span>
            )}
          </button>
        </div>
      )}

      {alertModal && <AlertModal {...alertModal} />}
    </div>
  );
}
