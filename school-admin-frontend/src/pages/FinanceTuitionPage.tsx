import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import { getToken } from '../utils/tokenService';
import {
  DollarSign,
  RefreshCw,
  AlertCircle,
  XCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';

// ============ Types ============

type TuitionStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'exempted';
type SubsidyType = 'none' | 'full' | 'partial' | 'exempted';

interface TuitionStandard {
  id: string;
  schoolId: string;
  grade: string;
  academicYear: string;
  amount: number;
  currency: string;
  paymentDeadline: string;
  isActive: boolean;
  subsidyType?: SubsidyType;
  subsidyAmount?: number;
  exemptedAmount?: number;
  subsidyRemark?: string;
  createdAt: string;
  updatedAt: string;
}

interface TuitionPayment {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  className: string;
  academicYear: string;
  amount: number;
  paidAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  status: TuitionStatus;
  subStatus?: string;
  subsidyType?: SubsidyType;
  subsidyAmount?: number;
  overdueDays?: number;
  disputeReason?: string;
  createdAt: string;
}

interface ReconciliationReport {
  academicYear: string;
  generatedAt: string;
  summary: {
    totalStudents: number;
    totalReceivable: number;
    totalReceived: number;
    totalArrears: number;
    exemptCount: number;
    exemptAmount: number;
  };
  statusDistribution: { status: string; count: number; amount: number; percentage: number; }[];
  gradeDistribution: { grade: string; totalStudents: number; receivable: number; received: number; arrears: number; }[];
  overdueSummary: { totalOverdue: number; overdueAmount: number; overdueDays: number; };
  disputedSummary: { totalDisputed: number; disputedAmount: number; };
}

// ============ Helpers ============

const statusConfig: Record<TuitionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待缴', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  paid: { label: '已缴', color: 'text-green-600', bgColor: 'bg-green-100' },
  partial: { label: '部分', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  overdue: { label: '逾期', color: 'text-red-600', bgColor: 'bg-red-100' },
  exempted: { label: '豁免', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

const subsidyConfig: Record<SubsidyType, { label: string; color: string; bgColor: string }> = {
  none: { label: '无资助', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  full: { label: '全额资助', color: 'text-green-600', bgColor: 'bg-green-100' },
  partial: { label: '部分资助', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  exempted: { label: '豁免', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

const formatCurrency = (amount: number, currency: string = 'HKD') => `${currency} $${amount.toLocaleString()}`;
const formatDate = (dateStr: string) => !dateStr ? '-' : new Date(dateStr).toLocaleDateString('zh-HK');

// ============ Main Component ============

const FinanceTuitionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'standards' | 'payments' | 'arrears' | 'report'>('standards');
  const [standards, setStandards] = useState<TuitionStandard[]>([]);
  const [payments, setPayments] = useState<TuitionPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [report, setReport] = useState<ReconciliationReport | null>(null);

  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const grades = ['中一', '中二', '中三', '中四', '中五', '中六'];

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchData(); }, [activeTab, selectedAcademicYear, selectedGrade, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'standards') {
        const params = new URLSearchParams();
        if (selectedAcademicYear) params.append('academicYear', selectedAcademicYear);
        if (selectedGrade) params.append('grade', selectedGrade);
        const response = await fetch(`${API_BASE_URL}/tuition/standards?${params}`, { headers });
        if (response.ok) { const data = await response.json(); setStandards(data.data || []); }
      } else if (activeTab === 'payments') {
        const params = new URLSearchParams();
        if (selectedAcademicYear) params.append('academicYear', selectedAcademicYear);
        if (selectedGrade) params.append('grade', selectedGrade);
        if (selectedStatus) params.append('status', selectedStatus);
        const response = await fetch(`${API_BASE_URL}/tuition/payments?${params}`, { headers });
        if (response.ok) { const data = await response.json(); setPayments(data.data || []); }
      } else if (activeTab === 'report') {
        const params = new URLSearchParams();
        if (selectedAcademicYear) params.append('academicYear', selectedAcademicYear);
        const response = await fetch(`${API_BASE_URL}/tuition/reports/reconciliation?${params}`, { headers });
        if (response.ok) { const data = await response.json(); setReport(data); }
      }
    } catch (err: any) { setError(err.message || '获取数据失败'); }
    finally { setLoading(false); }
  };

  const getStatusBadge = (status: TuitionStatus, subStatus?: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const isOverdue = status === 'overdue' || subStatus === 'overdue';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${config.bgColor} ${config.color} ${isOverdue ? 'ring-2 ring-red-500' : ''}`}>
        {config.label}
        {isOverdue && <AlertTriangle className="w-3 h-3" />}
      </span>
    );
  };

  const getSubsidyBadge = (subsidyType?: SubsidyType) => {
    if (!subsidyType || subsidyType === 'none') return null;
    const config = subsidyConfig[subsidyType];
    return <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>{config.label}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">学费管理</h1>
          <p className="text-slate-600">管理系统学费标准、缴费记录、欠费追踪和对账报表</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <div className="mb-6 flex gap-2">
          {[
            { key: 'standards', label: '学费标准', icon: FileText },
            { key: 'payments', label: '缴费记录', icon: DollarSign },
            { key: 'arrears', label: '欠费管理', icon: AlertTriangle },
            { key: 'report', label: '对账报表', icon: AlertCircle },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === key ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <Card className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">所有学年</option>
              {academicYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">所有年级</option>
              {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
            </select>
            {activeTab === 'payments' && (
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">所有状态</option>
                <option value="pending">待缴</option><option value="paid">已缴</option><option value="partial">部分</option>
                <option value="overdue">逾期</option><option value="exempted">豁免</option>
              </select>
            )}
            <Button onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" />刷新</Button>
          </div>
        </Card>

        {/* Standards Table */}
        {activeTab === 'standards' && (
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : standards.length === 0 ? (
              <div className="text-center py-12"><DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">暂无学费标准数据</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">学年</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">年级</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">金额</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">资助类型</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">资助金额</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">缴费截止日期</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">状态</th>
                  </tr></thead>
                  <tbody>
                    {standards.map((standard) => (
                      <tr key={standard.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4 text-slate-700">{standard.academicYear}</td>
                        <td className="py-4 px-4 text-slate-700">{standard.grade}</td>
                        <td className="py-4 px-4 text-slate-700 font-medium">{formatCurrency(standard.amount, standard.currency)}</td>
                        <td className="py-4 px-4">
                          {standard.subsidyType && standard.subsidyType !== 'none' ? (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${subsidyConfig[standard.subsidyType].bgColor} ${subsidyConfig[standard.subsidyType].color}`}>
                              {subsidyConfig[standard.subsidyType].label}
                            </span>
                          ) : <span className="text-slate-400 text-sm">无</span>}
                        </td>
                        <td className="py-4 px-4 text-slate-700">{standard.subsidyAmount ? formatCurrency(standard.subsidyAmount, standard.currency) : '-'}</td>
                        <td className="py-4 px-4 text-slate-700">{formatDate(standard.paymentDeadline)}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${standard.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {standard.isActive ? '启用' : '禁用'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Payments Table */}
        {activeTab === 'payments' && (
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12"><DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">暂无缴费记录</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">学生姓名</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">年级班级</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">学年</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">应缴金额</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">实缴金额</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">资助</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">状态</th>
                  </tr></thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className={`border-b border-slate-100 hover:bg-slate-50 ${payment.status === 'overdue' || payment.subStatus === 'overdue' ? 'bg-red-50' : ''}`}>
                        <td className="py-4 px-4 font-medium text-slate-900">{payment.studentName}</td>
                        <td className="py-4 px-4 text-slate-700">{payment.grade} / {payment.className}</td>
                        <td className="py-4 px-4 text-slate-700">{payment.academicYear}</td>
                        <td className="py-4 px-4 text-slate-700">{formatCurrency(payment.amount)}</td>
                        <td className="py-4 px-4 text-slate-700">{formatCurrency(payment.paidAmount || 0)}</td>
                        <td className="py-4 px-4">{getSubsidyBadge(payment.subsidyType)}</td>
                        <td className="py-4 px-4">
                          {getStatusBadge(payment.status, payment.subStatus)}
                          {(payment.status === 'overdue' || payment.subStatus === 'overdue') && payment.overdueDays && (
                            <span className="ml-2 text-xs text-red-600 font-medium">逾期{payment.overdueDays}天</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Arrears Management */}
        {activeTab === 'arrears' && (
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* AC-02: Overdue Alerts */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5" />逾期告警 (AC-02)
                  </h3>
                  <div className="space-y-2">
                    {payments.filter(p => p.status === 'overdue' || p.subStatus === 'overdue').length === 0 ? (
                      <p className="text-red-600 text-sm">暂无逾期记录</p>
                    ) : (
                      payments.filter(p => p.status === 'overdue' || p.subStatus === 'overdue').map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-200">
                          <div><span className="font-medium">{p.studentName}</span><span className="text-slate-500 ml-2">{p.grade}</span></div>
                          <div className="text-right">
                            <span className="text-red-600 font-semibold">{formatCurrency(p.amount - (p.paidAmount || 0))}</span>
                            <span className="text-red-500 text-sm ml-2">逾期{p.overdueDays || 0}天</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* AC-03: Disputed Items */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5" />争议处理 (AC-03)
                  </h3>
                  <div className="space-y-2">
                    {payments.filter(p => p.subStatus === 'disputed').length === 0 ? (
                      <p className="text-amber-600 text-sm">暂无争议记录</p>
                    ) : (
                      payments.filter(p => p.subStatus === 'disputed').map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-200">
                          <div>
                            <span className="font-medium">{p.studentName}</span>
                            <span className="text-slate-500 ml-2">{p.grade}</span>
                            <p className="text-xs text-slate-400 mt-1">原因: {p.disputeReason || '未说明'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-amber-600 font-semibold">{formatCurrency(p.amount - (p.paidAmount || 0))}</span>
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded ml-2">暂停催款</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* AC-04: Reconciliation Report */}
        {activeTab === 'report' && (
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : report ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">{report.academicYear} 学费对账报表</h2>
                  <span className="text-sm text-slate-500">生成时间: {new Date(report.generatedAt).toLocaleString('zh-CN')}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">总人数</p>
                    <p className="text-2xl font-bold text-blue-800">{report.summary.totalStudents}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">已收金额</p>
                    <p className="text-2xl font-bold text-green-800">{formatCurrency(report.summary.totalReceived)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">欠费金额</p>
                    <p className="text-2xl font-bold text-red-800">{formatCurrency(report.summary.totalArrears)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">豁免人数</p>
                    <p className="text-2xl font-bold text-purple-800">{report.summary.exemptCount}人</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">状态分布</h3>
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-4 text-slate-600">状态</th>
                      <th className="text-right py-2 px-4 text-slate-600">人数</th>
                      <th className="text-right py-2 px-4 text-slate-600">金额</th>
                      <th className="text-right py-2 px-4 text-slate-600">占比</th>
                    </tr></thead>
                    <tbody>
                      {report.statusDistribution.map((item) => (
                        <tr key={item.status} className="border-b border-slate-100">
                          <td className="py-2 px-4">{getStatusBadge(item.status as TuitionStatus)}</td>
                          <td className="py-2 px-4 text-right">{item.count}</td>
                          <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                          <td className="py-2 px-4 text-right">{item.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">年级分布</h3>
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-4 text-slate-600">年级</th>
                      <th className="text-right py-2 px-4 text-slate-600">人数</th>
                      <th className="text-right py-2 px-4 text-slate-600">应收</th>
                      <th className="text-right py-2 px-4 text-slate-600">实收</th>
                      <th className="text-right py-2 px-4 text-slate-600">欠费</th>
                    </tr></thead>
                    <tbody>
                      {report.gradeDistribution.map((item) => (
                        <tr key={item.grade} className="border-b border-slate-100">
                          <td className="py-2 px-4">{item.grade}</td>
                          <td className="py-2 px-4 text-right">{item.totalStudents}</td>
                          <td className="py-2 px-4 text-right">{formatCurrency(item.receivable)}</td>
                          <td className="py-2 px-4 text-right text-green-600">{formatCurrency(item.received)}</td>
                          <td className="py-2 px-4 text-right text-red-600">{formatCurrency(item.arrears)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">逾期情况</h4>
                    <p>逾期人数: {report.overdueSummary.totalOverdue}</p>
                    <p>逾期金额: {formatCurrency(report.overdueSummary.overdueAmount)}</p>
                    {report.overdueSummary.overdueDays > 0 && <p className="text-red-600 text-sm mt-1">最长逾期: {report.overdueSummary.overdueDays}天</p>}
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-800 mb-2">争议情况</h4>
                    <p>争议人数: {report.disputedSummary.totalDisputed}</p>
                    <p>争议金额: {formatCurrency(report.disputedSummary.disputedAmount)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12"><FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">点击"刷新"按钮生成报表</p></div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default FinanceTuitionPage;
