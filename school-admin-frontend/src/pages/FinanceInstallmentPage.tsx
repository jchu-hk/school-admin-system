import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import {
  CreditCard,
  Clock,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Plus,
  Eye,
  TrendingUp,
  FileText,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// ============ Types ============

type InstallmentPlanStatus =
  | 'pending_review'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired';

type ScheduleStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

interface InstallmentSchedule {
  id: string;
  sequence: number;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: ScheduleStatus;
}

interface InstallmentPlan {
  id: string;
  tuitionPaymentId: string;
  studentId: string;
  studentName: string;
  totalAmount: number;
  installmentCount: number;
  installmentAmount: number;
  startDate: string;
  endDate: string | null;
  status: InstallmentPlanStatus;
  reviewNotes?: string;
  createdAt: string;
  schedules: InstallmentSchedule[];
}

interface SubStatusItem {
  studentId: string;
  studentName: string;
  amount: number;
  dueDate?: string;
  overdueDays?: number;
  paymentId: string;
}

interface SubStatus {
  installmentPlan: SubStatusItem[];
  overdue: SubStatusItem[];
  disputed: SubStatusItem[];
}

// ============ Helpers ============

const statusConfig: Record<
  InstallmentPlanStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending_review: { label: '待审核', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  active: { label: '生效中', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-50' },
  cancelled: { label: '已取消', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  expired: { label: '已过期', color: 'text-red-600', bgColor: 'bg-red-50' },
};

const scheduleStatusConfig: Record<ScheduleStatus, { label: string; color: string }> = {
  pending: { label: '待还款', color: 'text-amber-600' },
  paid: { label: '已还款', color: 'text-green-600' },
  overdue: { label: '已逾期', color: 'text-red-600' },
  cancelled: { label: '已取消', color: 'text-gray-400' },
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
};

// ============ Main Component ============

const FinanceInstallmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'review' | 'plans' | 'apply' | 'sub-status'
  >('overview');
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [pendingPlans, setPendingPlans] = useState<InstallmentPlan[]>([]);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Apply form
  const [applyPaymentId, setApplyPaymentId] = useState('');
  const [applyCount, setApplyCount] = useState(3);
  const [applyReason, setApplyReason] = useState('');

  // Review form
  const [reviewPlanId, setReviewPlanId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}` };

  // ============ Data Fetching ============

  const fetchPendingPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/tuition/installment/pending-review/list?page=1&pageSize=50`,
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setPendingPlans(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch pending plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tuition/payments/sub-status?mine=true`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch sub-status:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/tuition/installment/parent/me?page=1&pageSize=50`,
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setPlans(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const viewPlanDetail = async (planId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tuition/installment/${planId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedPlan(data);
        setShowDetail(true);
      }
    } catch (e) {
      console.error('Failed to fetch plan detail:', e);
    }
  };

  // ============ Actions ============

  const submitReview = async () => {
    if (!reviewPlanId) return;
    if (reviewAction === 'reject' && !reviewNotes) {
      alert('请填写拒绝原因');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/tuition/installment/${reviewPlanId}/review`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: reviewAction,
            notes: reviewNotes,
            reason: reviewAction === 'reject' ? reviewNotes : undefined,
          }),
        },
      );
      if (res.ok) {
        await fetchPendingPlans();
        setReviewPlanId(null);
        setReviewNotes('');
        alert(reviewAction === 'approve' ? '已通过审核' : '已拒绝申请');
      } else {
        const data = await res.json();
        alert(data.message || '操作失败');
      }
    } catch (e) {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyPaymentId || !applyCount) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tuition/installment/apply`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tuitionPaymentId: applyPaymentId,
          installmentCount: applyCount,
          reason: applyReason,
        }),
      });
      if (res.ok) {
        setApplyPaymentId('');
        setApplyReason('');
        alert('分期申请已提交，请等待审核');
        fetchMyPlans();
        setActiveTab('plans');
      } else {
        const data = await res.json();
        alert(data.message || '申请失败');
      }
    } catch {
      alert('申请失败');
    } finally {
      setActionLoading(false);
    }
  };

  // ============ Effects ============

  useEffect(() => {
    if (activeTab === 'review') fetchPendingPlans();
    if (activeTab === 'sub-status') fetchSubStatus();
    if (activeTab === 'plans') fetchMyPlans();
  }, [activeTab]);

  // ============ Render ============

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard className="text-blue-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">学费分期付款管理</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {[
          { key: 'overview', label: '概览', icon: TrendingUp },
          { key: 'review', label: '待审核', icon: Clock, badge: pendingPlans.length },
          { key: 'plans', label: '我的分期', icon: FileText },
          { key: 'apply', label: '申请分期', icon: Plus },
          { key: 'sub-status', label: '欠费子状态', icon: AlertTriangle },
        ].map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
            {key === 'review' && badge > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 rounded-full">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="待审核申请"
            value={pendingPlans.length}
            icon={Clock}
            color="amber"
            onClick={() => { setActiveTab('review'); }}
          />
          <StatCard
            title="生效中的分期"
            value={plans.filter((p) => p.status === 'active').length}
            icon={CreditCard}
            color="blue"
          />
          <StatCard
            title="本月待还款"
            value={formatAmount(
              plans.flatMap((p) => p.schedules).filter((s) => s.status === 'pending')
                .reduce((sum, s) => sum + s.amount, 0),
            )}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="逾期期次"
            value={plans.flatMap((p) => p.schedules).filter((s) => s.status === 'overdue').length}
            icon={AlertTriangle}
            color="red"
          />
        </div>
      )}

      {/* Review Tab */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">待审核分期申请</h2>
            <Button onClick={fetchPendingPlans} variant="outline" size="sm">
              <RefreshCw size={14} className="mr-1" />
              刷新
            </Button>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : pendingPlans.length === 0 ? (
            <EmptyState message="暂无待审核的分期申请" />
          ) : (
            <div className="space-y-4">
              {pendingPlans.map((plan) => (
                <Card key={plan.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-semibold text-gray-800">{plan.studentName}</span>
                        <StatusBadge status={plan.status} />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div><span className="text-gray-400">总金额：</span>{formatAmount(plan.totalAmount)}</div>
                        <div><span className="text-gray-400">分期数：</span>{plan.installmentCount}期</div>
                        <div><span className="text-gray-400">每期：</span>{formatAmount(plan.installmentAmount)}</div>
                        <div><span className="text-gray-400">申请时间：</span>{formatDate(plan.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button variant="outline" size="sm" onClick={() => viewPlanDetail(plan.id)}>
                        <Eye size={14} className="mr-1" />查看
                      </Button>
                      {reviewPlanId === plan.id ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setReviewAction('approve')}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                reviewAction === 'approve'
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}
                            >
                              <CheckCircle size={14} className="inline mr-1" />批准
                            </button>
                            <button
                              onClick={() => setReviewAction('reject')}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                reviewAction === 'reject'
                                  ? 'bg-red-100 text-red-700 border border-red-300'
                                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}
                            >
                              <XCircle size={14} className="inline mr-1" />拒绝
                            </button>
                          </div>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder={reviewAction === 'approve' ? '审核备注（可选）' : '拒绝原因（必填）'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={submitReview}
                              disabled={actionLoading || (reviewAction === 'reject' && !reviewNotes)}
                              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                              size="sm"
                            >
                              {actionLoading ? '提交中...' : '确认提交'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setReviewPlanId(null)}>
                              取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReviewInline(plan.id, setReviewPlanId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle size={14} className="mr-1" />审核
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">我的分期计划</h2>
            <Button onClick={fetchMyPlans} variant="outline" size="sm">
              <RefreshCw size={14} className="mr-1" />刷新
            </Button>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : plans.length === 0 ? (
            <EmptyState message="暂无分期记录" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-gray-400" />
                        <span className="font-semibold">{plan.studentName}</span>
                        <StatusBadge status={plan.status} />
                      </div>
                      <div className="text-xs text-gray-400">申请于 {formatDate(plan.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">{formatAmount(plan.totalAmount)}</div>
                      <div className="text-xs text-gray-400">{plan.installmentCount}期 × {formatAmount(plan.installmentAmount)}</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>还款进度</span>
                      <span>{plan.schedules.filter((s) => s.status === 'paid').length}/{plan.schedules.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(plan.schedules.filter((s) => s.status === 'paid').length / Math.max(plan.schedules.length, 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Payment */}
                  {plan.status === 'active' && plan.schedules
                    .filter((s) => s.status === 'pending')
                    .slice(0, 1)
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 mb-3">
                        <span className="text-sm">
                          <span className="text-amber-600 font-medium">第{s.sequence}期</span>
                          <span className="text-gray-500 ml-2">{formatDate(s.dueDate)}</span>
                        </span>
                        <span className="font-semibold text-amber-700">{formatAmount(s.amount)}</span>
                      </div>
                    ))}

                  <Button variant="outline" size="sm" className="w-full" onClick={() => viewPlanDetail(plan.id)}>
                    <Eye size={14} className="mr-1" />查看详情
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply Tab */}
      {activeTab === 'apply' && (
        <div className="max-w-xl">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">申请学费分期</h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  缴费记录ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={applyPaymentId}
                  onChange={(e) => setApplyPaymentId(e.target.value)}
                  placeholder="请输入缴费记录ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分期期数 <span className="text-red-500">*</span>（2-12期）
                </label>
                <select
                  value={applyCount}
                  onChange={(e) => setApplyCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n}>{n} 期</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申请说明</label>
                <textarea
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  placeholder="请说明申请分期的原因（可选）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">分期说明：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>分期期数范围：2-12期</li>
                  <li>申请提交后需财务人员审核</li>
                  <li>审核通过后自动生效</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={actionLoading || !applyPaymentId}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? '提交中...' : '提交分期申请'}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Sub-Status Tab */}
      {activeTab === 'sub-status' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">欠费子状态统计</h2>
            <Button onClick={fetchSubStatus} variant="outline" size="sm">
              <RefreshCw size={14} className="mr-1" />刷新
            </Button>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  key: 'installmentPlan',
                  label: '分期中',
                  icon: CreditCard,
                  color: 'blue',
                  data: subStatus?.installmentPlan || [],
                },
                {
                  key: 'overdue',
                  label: '已逾期',
                  icon: AlertTriangle,
                  color: 'red',
                  data: subStatus?.overdue || [],
                },
                {
                  key: 'disputed',
                  label: '争议中',
                  icon: FileText,
                  color: 'amber',
                  data: subStatus?.disputed || [],
                },
              ].map(({ key, label, icon: Icon, color, data }) => (
                <Card key={key} className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon size={20} className={`text-${color}-600`} />
                    <h3 className="font-semibold text-gray-700">{label}</h3>
                    <span className={`ml-auto bg-${color}-100 text-${color}-700 text-xs px-2 py-0.5 rounded-full`}>
                      {data.length}
                    </span>
                  </div>
                  {data.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
                  ) : (
                    <div className="space-y-2">
                      {data.map((item) => (
                        <div key={item.paymentId} className={`bg-${color}-50 rounded-lg p-3`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{item.studentName}</span>
                            {item.overdueDays && (
                              <span className={`text-xs bg-${color}-200 text-${color}-800 px-1.5 py-0.5 rounded`}>
                                逾期{item.overdueDays}天
                              </span>
                            )}
                          </div>
                          <div className={`text-sm font-semibold mt-1 text-${color}-700`}>
                            {formatAmount(item.amount)}
                          </div>
                          {item.dueDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              还款日：{formatDate(item.dueDate)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan Detail Modal */}
      {showDetail && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">分期计划详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">学生：</span><span className="font-medium">{selectedPlan.studentName}</span></div>
                <div><span className="text-gray-400">状态：</span><StatusBadge status={selectedPlan.status} /></div>
                <div><span className="text-gray-400">总金额：</span><span className="font-medium">{formatAmount(selectedPlan.totalAmount)}</span></div>
                <div><span className="text-gray-400">分期数：</span>{selectedPlan.installmentCount}期</div>
                <div><span className="text-gray-400">开始日期：</span>{formatDate(selectedPlan.startDate)}</div>
                <div><span className="text-gray-400">结束日期：</span>{formatDate(selectedPlan.endDate || '')}</div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">还款计划表</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">期次</th>
                      <th className="px-3 py-2 text-right text-gray-600 font-medium">金额</th>
                      <th className="px-3 py-2 text-center text-gray-600 font-medium">到期日</th>
                      <th className="px-3 py-2 text-center text-gray-600 font-medium">还款日</th>
                      <th className="px-3 py-2 text-center text-gray-600 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlan.schedules.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100">
                        <td className="px-3 py-2">第{s.sequence}期</td>
                        <td className="px-3 py-2 text-right font-medium">{formatAmount(s.amount)}</td>
                        <td className="px-3 py-2 text-center">{formatDate(s.dueDate)}</td>
                        <td className="px-3 py-2 text-center">{s.paidDate ? formatDate(s.paidDate) : '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            s.status === 'paid' ? 'bg-green-100 text-green-700' :
                            s.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            s.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {scheduleStatusConfig[s.status].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedPlan.reviewNotes && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <span className="text-gray-500">审核备注：</span>{selectedPlan.reviewNotes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ Helper: Inline Review ============
function handleReviewInline(planId: string, setReviewPlanId: (id: string) => void) {
  setReviewPlanId(planId);
}

// ============ Sub-components ============

function StatCard({
  title, value, icon: Icon, color, onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const c = colorMap[color] || { bg: 'bg-gray-50', text: 'text-gray-600' };
  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-md transition ${onClick ? 'hover:border-blue-400' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${c.bg}`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: InstallmentPlanStatus }) {
  const config = statusConfig[status] || statusConfig.pending_review;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <p className="text-gray-400">{message}</p>
    </div>
  );
}

export default FinanceInstallmentPage;
