import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Eye, X, ChevronLeft, ChevronRight,
  Calendar, Clock, AlertCircle, CheckCircle, XCircle,
  RefreshCw, Trash2, Users, TrendingUp, Wifi, WifiOff,
  Check, Ban, ArrowLeft, Bell, Info
} from 'lucide-react';
import {
  AttendanceStatus,
  AttendanceRecord,
  BatchRecordInput,
  ConfirmPreviewResponse,
  AffectedStudent,
  attendanceApi,
} from '../api/attendance';

// ============ Types ============
interface DailyStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  leaveEarly: number;
  sickLeave: number;
  personalLeave: number;
  attendanceRate: number;
}

interface ClassOption {
  id: string;
  name: string;
}

type DataSourceStatus = {
  name: string;
  status: 'success' | 'failed' | 'partial' | 'offline' | 'pending';
  lastSyncTime?: string;
  recordCount?: number;
};

// ============ Constants ============
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: '出席',
  [AttendanceStatus.ABSENT]: '缺席',
  [AttendanceStatus.LATE]: '迟到',
  [AttendanceStatus.LEAVE_EARLY]: '早退',
  [AttendanceStatus.SICK_LEAVE]: '病假',
  [AttendanceStatus.PERSONAL_LEAVE]: '事假',
  [AttendanceStatus.ABSENT_WITH_LEAVE]: '请假缺勤',
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800',
  [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800',
  [AttendanceStatus.LATE]: 'bg-yellow-100 text-yellow-800',
  [AttendanceStatus.LEAVE_EARLY]: 'bg-orange-100 text-orange-800',
  [AttendanceStatus.SICK_LEAVE]: 'bg-blue-100 text-blue-800',
  [AttendanceStatus.PERSONAL_LEAVE]: 'bg-purple-100 text-purple-800',
  [AttendanceStatus.ABSENT_WITH_LEAVE]: 'bg-gray-100 text-gray-800',
};

const STATUS_ORDER: AttendanceStatus[] = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.ABSENT,
  AttendanceStatus.SICK_LEAVE,
  AttendanceStatus.PERSONAL_LEAVE,
  AttendanceStatus.LEAVE_EARLY,
  AttendanceStatus.ABSENT_WITH_LEAVE,
];

// ============ Mock Data ============
const MOCK_CLASSES: ClassOption[] = [
  { id: '1A', name: '1A' },
  { id: '1B', name: '1B' },
  { id: '2A', name: '2A' },
  { id: '2B', name: '2B' },
  { id: '3A', name: '3A' },
  { id: '3B', name: '3B' },
  { id: '4A', name: '4A' },
  { id: '4B', name: '4B' },
  { id: '5A', name: '5A' },
  { id: '5B', name: '5B' },
  { id: '6A', name: '6A' },
  { id: '6B', name: '6B' },
];

const MOCK_STUDENTS: Record<string, Array<{ id: string; name: string }>> = {
  '1A': [
    { id: 'S00101', name: '陳小明' },
    { id: 'S00102', name: '李小红' },
    { id: 'S00103', name: '王小華' },
    { id: 'S00104', name: '張志偉' },
    { id: 'S00105', name: '黃麗華' },
    { id: 'S00106', name: '陳家強' },
    { id: 'S00107', name: '林美琪' },
    { id: 'S00108', name: '周傑倫' },
  ],
};

// ============ Component ============
export default function AttendancePage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'manual' | 'anomaly'>('overview');

  // Filter state
  const [selectedClass, setSelectedClass] = useState<string>('1A');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );

  // Data state
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [affectedStudents, setAffectedStudents] = useState<AffectedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual entry state
  const [manualRecords, setManualRecords] = useState<BatchRecordInput[]>([]);
  const [previewData, setPreviewData] = useState<ConfirmPreviewResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  // Data source status (mock — in production from API)
  const [dataSourceStatuses, setDataSourceStatuses] = useState<DataSourceStatus[]>([
    { name: 'eClass API', status: 'success', lastSyncTime: '07:05:22', recordCount: 38 },
    { name: '门禁刷卡机-RFID-001', status: 'success', lastSyncTime: '07:58:00' },
    { name: '门禁刷卡机-RFID-002', status: 'offline', lastSyncTime: '07:45:00' },
    { name: '人脸识别闸机-FACE-001', status: 'success', lastSyncTime: '07:59:00' },
  ]);

  // ============ Load Data ============
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, affectedData] = await Promise.all([
        attendanceApi.getDailyStats(selectedDate, selectedClass).catch(() => null),
        attendanceApi.getAffectedStudents(selectedDate).catch(() => null),
      ]);
      if (statsData) {
        setStats(statsData);
      }
      if (affectedData) {
        setAffectedStudents(affectedData.students);
      }
    } catch (err) {
      setError('加载出勤数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedClass]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============ Manual Entry Handlers ============
  const initManualRecords = () => {
    const students = MOCK_STUDENTS[selectedClass] || [];
    const initial: BatchRecordInput[] = students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      classId: selectedClass,
      status: AttendanceStatus.PRESENT,
      checkInTime: '',
      remark: '',
    }));
    setManualRecords(initial);
    setPreviewData(null);
    setShowPreview(false);
    setBatchId(null);
  };

  useEffect(() => {
    if (activeTab === 'manual') {
      initManualRecords();
    }
  }, [activeTab, selectedClass]);

  const updateManualRecord = (index: number, field: keyof BatchRecordInput, value: string) => {
    setManualRecords((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handlePreview = async () => {
    setSubmitting(true);
    try {
      const data = await attendanceApi.confirmPreview({
        classId: selectedClass,
        attendanceDate: selectedDate,
        records: manualRecords,
      });
      setPreviewData(data);
      setShowPreview(true);
    } catch {
      setError('预览生成失败，请检查数据');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (!previewData) return;
    setSubmitting(true);
    try {
      const result = await attendanceApi.batchCreate({
        classId: selectedClass,
        attendanceDate: selectedDate,
        records: manualRecords,
      });
      setBatchId(result.batchId);
      setSubmitSuccess(`成功保存 ${result.count} 条记录`);
      setShowPreview(false);
      setManualRecords([]);
      loadData();
    } catch {
      setError('批量保存失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchRevoke = async () => {
    if (!batchId) return;
    if (!confirm('确定要撤销这批记录吗？此操作不可恢复。')) return;
    try {
      await attendanceApi.batchRevoke(batchId);
      setBatchId(null);
      setSubmitSuccess(null);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || '撤销失败');
    }
  };

  // ============ Render ============
  const renderDataSourceStatus = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Wifi size={18} className="text-blue-600" />
        数据源同步状态
      </h3>
      <div className="space-y-3">
        {dataSourceStatuses.map((src) => (
          <div key={src.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              {src.status === 'success' && <CheckCircle size={16} className="text-green-500" />}
              {src.status === 'offline' && <WifiOff size={16} className="text-red-500" />}
              {src.status === 'pending' && <RefreshCw size={16} className="text-yellow-500 animate-spin" />}
              {src.status === 'partial' && <AlertCircle size={16} className="text-yellow-500" />}
              {src.status === 'failed' && <XCircle size={16} className="text-red-500" />}
              <span className="text-sm text-gray-700">{src.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {src.lastSyncTime && <span>最后同步: {src.lastSyncTime}</span>}
              {src.recordCount && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{src.recordCount}条</span>}
              <span className={`px-2 py-0.5 rounded-full ${
                src.status === 'success' ? 'bg-green-100 text-green-700' :
                src.status === 'offline' ? 'bg-red-100 text-red-700' :
                src.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {src.status === 'success' ? '✅ 正常' :
                 src.status === 'offline' ? '❌ 离线' :
                 src.status === 'pending' ? '⚠️ 同步中' :
                 src.status === 'partial' ? '⚠️ 部分成功' : '❌ 失败'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAffectedStudents = () => {
    if (affectedStudents.length === 0) return null;
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-4">
        <h3 className="text-base font-semibold text-amber-800 mb-3 flex items-center gap-2">
          <AlertCircle size={18} />
          受影响学生列表（{affectedStudents.length}人）
        </h3>
        <p className="text-sm text-amber-700 mb-3">以下学生的出勤数据来源于同步失败的数据源，请确认：</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-amber-700 border-b border-amber-200">
                <th className="py-2 pr-4">学号</th>
                <th className="py-2 pr-4">姓名</th>
                <th className="py-2 pr-4">班级</th>
                <th className="py-2 pr-4">受影响数据源</th>
                <th className="py-2">建议操作</th>
              </tr>
            </thead>
            <tbody>
              {affectedStudents.map((s) => (
                <tr key={s.studentId} className="border-b border-amber-100 last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">{s.studentId}</td>
                  <td className="py-2 pr-4">{s.studentName}</td>
                  <td className="py-2 pr-4">{s.classId}</td>
                  <td className="py-2 pr-4 text-xs text-gray-600">{s.affectedSources.join(', ')}</td>
                  <td className="py-2">
                    <button className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition">
                      确认到校
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">班级</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {MOCK_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-500 mt-1">应到人数</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-5">
            <div className="text-2xl font-bold text-green-700">{stats.present}</div>
            <div className="text-sm text-green-600 mt-1">出席</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-5">
            <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
            <div className="text-sm text-red-600 mt-1">缺席</div>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
            <div className="text-2xl font-bold text-yellow-700">{stats.late}</div>
            <div className="text-sm text-yellow-600 mt-1">迟到</div>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <div className="text-2xl font-bold text-purple-700">{stats.sickLeave}</div>
            <div className="text-sm text-purple-600 mt-1">病假</div>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
            <div className="text-2xl font-bold text-orange-700">{stats.leaveEarly}</div>
            <div className="text-sm text-orange-600 mt-1">早退</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 col-span-2">
            <div className="text-2xl font-bold text-blue-700">{stats.attendanceRate}%</div>
            <div className="text-sm text-blue-600 mt-1">出勤率</div>
          </div>
        </div>
      )}

      {/* Data Source Status */}
      {renderDataSourceStatus()}

      {/* Affected Students */}
      {renderAffectedStudents()}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <AlertCircle size={16} className="inline mr-2" />
          {error}
        </div>
      )}
    </div>
  );

  const renderManualTab = () => {
    if (submitSuccess && !showPreview) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{submitSuccess}</h3>
          <p className="text-sm text-gray-500 mb-2">
            批量撤销截止时间：15分钟内可撤销
          </p>
          {batchId && (
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => { setSubmitSuccess(null); initManualRecords(); }}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Plus size={16} /> 继续录入
              </button>
              <button
                onClick={handleBatchRevoke}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition text-sm"
              >
                <Trash2 size={16} /> 批量撤销
              </button>
            </div>
          )}
        </div>
      );
    }

    if (showPreview && previewData) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">📋 确认预览</h3>
          <p className="text-sm text-gray-500 mb-4">
            班级: {previewData.classId} | 日期: {previewData.attendanceDate} | 共 {previewData.studentCount} 名学生
          </p>

          {/* Status Summary */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
            {STATUS_ORDER.map((status) => {
              const count = previewData.statusSummary[status] || 0;
              if (count === 0) return null;
              return (
                <div key={status} className={`rounded-lg p-3 text-center ${STATUS_COLORS[status]}`}>
                  <div className="text-xl font-bold">{count}</div>
                  <div className="text-xs mt-1">{STATUS_LABELS[status]}</div>
                </div>
              );
            })}
          </div>

          {/* Record List */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">学号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">姓名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">状态</th>
                </tr>
              </thead>
              <tbody>
                {previewData.records.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{r.studentId}</td>
                    <td className="px-4 py-2">{r.studentName}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
            >
              <ArrowLeft size={16} /> 返回修改
            </button>
            <button
              onClick={handleBatchSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
            >
              <Check size={16} />
              {submitting ? '保存中...' : '确认保存'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-800">📝 人工录入出勤记录</h3>
          <button
            onClick={initManualRecords}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw size={14} /> 重置
          </button>
        </div>

        {/* Entry Info */}
        <div className="grid grid-cols-2 gap-4 mb-5 bg-gray-50 rounded-lg p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">班级</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {MOCK_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Record Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700 w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">学号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">姓名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">到校时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">备注</th>
              </tr>
            </thead>
            <tbody>
              {manualRecords.map((record, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{record.studentId}</td>
                  <td className="px-4 py-2">{record.studentName}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {STATUS_ORDER.map((status) => (
                        <label key={status} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${i}`}
                            value={status}
                            checked={record.status === status}
                            onChange={() => updateManualRecord(i, 'status', status)}
                            className="text-blue-600"
                          />
                          <span className="text-xs">{STATUS_LABELS[status]}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="time"
                      value={record.checkInTime || ''}
                      onChange={(e) => updateManualRecord(i, 'checkInTime', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="备注"
                      value={record.remark || ''}
                      onChange={(e) => updateManualRecord(i, 'remark', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs w-28"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {manualRecords.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Users size={32} className="mx-auto mb-2" />
            <p>请先选择班级</p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={handlePreview}
            disabled={submitting || manualRecords.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
          >
            <Eye size={16} />
            {submitting ? '生成预览...' : '生成确认预览'}
          </button>
        </div>
      </div>
    );
  };

  const renderAnomalyTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">⚠️ 异常检测</h3>
      <p className="text-sm text-gray-500 mb-5">基于历史数据自动检测出勤异常模式</p>

      <div className="space-y-4">
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-amber-600" />
            <span className="font-medium text-amber-800">连续缺席 ≥3天</span>
            <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">medium</span>
          </div>
          <p className="text-sm text-amber-700">检测到1名学生连续缺席3天以上，请关注。</p>
        </div>

        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-yellow-600" />
            <span className="font-medium text-yellow-800">连续迟到 ≥3次/7天</span>
            <span className="ml-auto text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">medium</span>
          </div>
          <p className="text-sm text-yellow-700">检测到2名学生一周内迟到3次以上。</p>
        </div>

        <div className="text-center py-8 text-gray-400">
          <Info size={32} className="mx-auto mb-2" />
          <p className="text-sm">暂无其他异常</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生出勤概览</h1>
          <p className="text-sm text-gray-500 mt-1">F-ATT-001 · 每日出勤数据管理</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className={`w-2 h-2 rounded-full ${dataSourceStatuses.some(s => s.status === 'offline') ? 'bg-red-500' : 'bg-green-500'}`} />
          {dataSourceStatuses.some(s => s.status === 'offline') ? '部分数据源离线' : '数据源正常'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1">
        {[
          { key: 'overview', label: '出勤概览', icon: TrendingUp },
          { key: 'manual', label: '人工录入', icon: Plus },
          { key: 'anomaly', label: '异常检测', icon: AlertCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'manual' && renderManualTab()}
      {activeTab === 'anomaly' && renderAnomalyTab()}
    </div>
  );
}
