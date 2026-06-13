import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface TuitionStandard {
  id: string;
  schoolId: string;
  grade: string;
  academicYear: string;
  amount: number;
  currency: string;
  paymentDeadline: string;
  isActive: boolean;
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
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  createdAt: string;
}

const FinanceTuitionPage: React.FC = () => {
  const { t } = { t: (key: string) => key };
  const [activeTab, setActiveTab] = useState<'standards' | 'payments' | 'arrears'>('standards');
  const [standards, setStandards] = useState<TuitionStandard[]>([]);
  const [payments, setPayments] = useState<TuitionPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const grades = ['中一', '中二', '中三', '中四', '中五', '中六'];

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedAcademicYear, selectedGrade, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (activeTab === 'standards') {
        const params = new URLSearchParams();
        if (selectedAcademicYear) params.append('schoolId', selectedAcademicYear);
        if (selectedGrade) params.append('gradeId', selectedGrade);

        const response = await fetch(`${API_BASE_URL}/tuition/standards?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setStandards(data.data || []);
        }
      } else if (activeTab === 'payments') {
        const params = new URLSearchParams();
        if (selectedAcademicYear) params.append('academicYear', selectedAcademicYear);
        if (selectedGrade) params.append('grade', selectedGrade);
        if (selectedStatus) params.append('status', selectedStatus);

        const response = await fetch(`${API_BASE_URL}/tuition/payments?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setPayments(data.data || []);
        }
      }
    } catch (err: any) {
      setError(err.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            已缴
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            部分
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            逾期
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            待缴
          </span>
        );
    }
  };

  const formatCurrency = (amount: number, currency: string = 'HKD') => {
    return `${currency} $${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-HK');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">学费管理</h1>
          <p className="text-slate-600">管理系统学费标准、缴费记录和欠费情况</p>
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
            onClick={() => setActiveTab('standards')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'standards'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            学费标准
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            缴费记录
          </button>
          <button
            onClick={() => setActiveTab('arrears')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'arrears'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            欠费管理
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
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有年级</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>

            {activeTab === 'payments' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">所有状态</option>
                <option value="pending">待缴</option>
                <option value="paid">已缴</option>
                <option value="partial">部分</option>
                <option value="overdue">逾期</option>
              </select>
            )}

            <Button onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </Card>

        {/* 学费标准表格 */}
        {activeTab === 'standards' && (
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : standards.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无学费标准数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">学年</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">年级</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">金额</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">缴费截止日期</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">状态</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standards.map((standard) => (
                      <tr key={standard.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4 text-slate-700">{standard.academicYear}</td>
                        <td className="py-4 px-4 text-slate-700">{standard.grade}</td>
                        <td className="py-4 px-4 text-slate-700 font-medium">
                          {formatCurrency(standard.amount, standard.currency)}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          {formatDate(standard.paymentDeadline)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            standard.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {standard.isActive ? '启用' : '禁用'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button className="p-2" title="编辑">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button className="p-2 text-blue-600 hover:bg-blue-50" title="查看详情">
                              <Eye className="w-4 h-4" />
                            </Button>
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

        {/* 缴费记录表格 */}
        {activeTab === 'payments' && (
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无缴费记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">学生姓名</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">年级班级</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">学年</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">应缴金额</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">实缴金额</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">状态</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4 font-medium text-slate-900">{payment.studentName}</td>
                        <td className="py-4 px-4 text-slate-700">
                          {payment.grade} / {payment.className}
                        </td>
                        <td className="py-4 px-4 text-slate-700">{payment.academicYear}</td>
                        <td className="py-4 px-4 text-slate-700">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          {formatCurrency(payment.paidAmount)}
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(payment.status)}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button className="p-2 text-blue-600 hover:bg-blue-50" title="查看详情">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button className="p-2 text-green-600 hover:bg-green-50" title="收款">
                              <DollarSign className="w-4 h-4" />
                            </Button>
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

        {/* 欠费管理 */}
        {activeTab === 'arrears' && (
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">欠费管理功能开发中</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FinanceTuitionPage;
