import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import {
  Award,
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Users,
  DollarSign,
} from 'lucide-react';

interface Scholarship {
  id: string;
  name: string;
  code: string;
  description: string;
  amount: number;
  currency: string;
  academicYear: string;
  applicationDeadline: string;
  eligibilityCriteria: string;
  status: 'open' | 'closed' | 'pending' | 'awarded';
  totalBudget: number;
  usedBudget: number;
  createdAt: string;
}

interface Application {
  id: string;
  scholarshipId: string;
  scholarshipName: string;
  studentId: string;
  studentName: string;
  grade: string;
  className: string;
  appliedAt: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'awarded';
  reviewerComment?: string;
  awardedAmount?: number;
}

const FinanceScholarshipPage: React.FC = () => {
  const { t } = { t: (key: string) => key };
  const [activeTab, setActiveTab] = useState<'scholarships' | 'applications'>('scholarships');
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const statusOptions = [
    { value: 'open', label: '开放申请' },
    { value: 'pending', label: '待审核' },
    { value: 'reviewing', label: '审核中' },
    { value: 'approved', label: '已批准' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'awarded', label: '已发放' },
    { value: 'closed', label: '已结束' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedStatus, selectedAcademicYear]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (activeTab === 'scholarships') {
        const params = new URLSearchParams();
        if (selectedStatus) params.append('status', selectedStatus);
        if (selectedAcademicYear) params.append('academicYear', selectedAcademicYear);

        const response = await fetch(`${API_BASE_URL}/scholarship/scholarships?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setScholarships(data.data || []);
        }
      } else if (activeTab === 'applications') {
        const params = new URLSearchParams();
        if (selectedStatus) params.append('status', selectedStatus);

        const response = await fetch(`${API_BASE_URL}/scholarship/applications?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setApplications(data.data || []);
        }
      }
    } catch (err: any) {
      setError(err.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      open: { bg: 'bg-green-100', text: 'text-green-700', icon: Clock, label: '开放申请' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: '待审核' },
      reviewing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock, label: '审核中' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: '已批准' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: '已拒绝' },
      awarded: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Award, label: '已发放' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle, label: '已结束' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'HKD') => {
    return `${currency} $${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-HK');
  };

  const getBudgetPercentage = (used: number, total: number) => {
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">奖学金管理</h1>
          <p className="text-slate-600">管理奖学金项目和学生申请</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* 标签页切换 */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('scholarships')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'scholarships'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            奖学金项目
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            申请记录
          </button>
        </div>

        {/* 筛选栏 */}
        <Card className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有学年</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有状态</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <Button onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </Card>

        {/* 奖学金项目列表 */}
        {activeTab === 'scholarships' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">奖学金项目</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增奖学金
              </Button>
            </div>

            {loading ? (
              <Card>
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </Card>
            ) : scholarships.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">暂无奖学金项目</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {scholarships.map((scholarship) => (
                  <Card key={scholarship.id} hover className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900 mb-1">
                            {scholarship.name}
                          </h4>
                          <span className="text-sm text-slate-500">{scholarship.code}</span>
                        </div>
                        {getStatusBadge(scholarship.status)}
                      </div>

                      <p className="text-slate-600 mb-4 line-clamp-2">
                        {scholarship.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">金额</p>
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(scholarship.amount, scholarship.currency)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">截止日期</p>
                            <p className="font-semibold text-slate-900">
                              {formatDate(scholarship.applicationDeadline)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 预算使用情况 */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">预算使用</span>
                          <span className="text-slate-900">
                            {formatCurrency(scholarship.usedBudget, scholarship.currency)} / 
                            {formatCurrency(scholarship.totalBudget, scholarship.currency)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${getBudgetPercentage(scholarship.usedBudget, scholarship.totalBudget)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          已使用 {getBudgetPercentage(scholarship.usedBudget, scholarship.totalBudget)}%
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <span className="text-sm text-slate-500">
                          学年: {scholarship.academicYear}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button className="p-2" title="查看详情">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button className="p-2" title="编辑">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button className="p-2" title="导出">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 申请记录列表 */}
        {activeTab === 'applications' && (
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无申请记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">学生姓名</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">年级班级</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">奖学金项目</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">申请日期</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">状态</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4 font-medium text-slate-900">{app.studentName}</td>
                        <td className="py-4 px-4 text-slate-700">
                          {app.grade} / {app.className}
                        </td>
                        <td className="py-4 px-4 text-slate-700">{app.scholarshipName}</td>
                        <td className="py-4 px-4 text-slate-700">
                          {formatDate(app.appliedAt)}
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(app.status)}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button className="p-2 text-blue-600 hover:bg-blue-50" title="查看">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(app.status === 'pending' || app.status === 'reviewing') && (
                              <>
                                <Button className="p-2 text-green-600 hover:bg-green-50" title="批准">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button className="p-2 text-red-600 hover:bg-red-50" title="拒绝">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default FinanceScholarshipPage;
