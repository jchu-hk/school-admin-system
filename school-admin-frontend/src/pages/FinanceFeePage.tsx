import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import {
  Receipt,
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
  Camera,
} from 'lucide-react';

interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  className: string;
  feeType: string;
  amount: number;
  currency: string;
  paymentDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  status: 'paid' | 'pending' | 'overdue';
  createdAt: string;
}

interface FeeType {
  id: string;
  name: string;
  code: string;
  description: string;
  defaultAmount: number;
  currency: string;
  isActive: boolean;
}

const FinanceFeePage: React.FC = () => {
  const { t } = { t: (key: string) => key };
  const [activeTab, setActiveTab] = useState<'records' | 'types'>('records');
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedFeeType, setSelectedFeeType] = useState('');
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const grades = ['中一', '中二', '中三', '中四', '中五', '中六'];
  const feeTypeOptions = ['午膳费', '校车费', '课本费', '活动费', '考试费', '其他'];
  const statuses = [
    { value: 'paid', label: '已缴' },
    { value: 'pending', label: '待缴' },
    { value: 'overdue', label: '逾期' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedGrade, selectedStatus, selectedFeeType]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (activeTab === 'records') {
        const params = new URLSearchParams();
        if (selectedGrade) params.append('grade', selectedGrade);
        if (selectedStatus) params.append('status', selectedStatus);
        if (selectedFeeType) params.append('feeType', selectedFeeType);

        const response = await fetch(`${API_BASE_URL}/fee/records?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRecords(data.data || []);
        }
      } else if (activeTab === 'types') {
        const response = await fetch(`${API_BASE_URL}/fee/types`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setFeeTypes(data.data || []);
        }
      }
    } catch (err: any) {
      setError(err.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOcrUpload = async (file: File) => {
    setOcrProcessing(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch(`${API_BASE_URL}/fee/ocr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert(`OCR识别成功！金额: ${data.amount}`);
        fetchData();
      } else {
        alert('OCR识别失败');
      }
    } catch (err) {
      alert('OCR处理出错');
    } finally {
      setOcrProcessing(false);
      setShowOcrModal(false);
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">费用管理</h1>
          <p className="text-slate-600">管理各类学校费用收取和记录</p>
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
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'records'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            缴费记录
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'types'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            费用类型
          </button>
        </div>

        {/* 筛选栏 */}
        <Card className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
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

            <select
              value={selectedFeeType}
              onChange={(e) => setSelectedFeeType(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有类型</option>
              {feeTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有状态</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <Button onClick={() => setShowOcrModal(true)}>
              <Camera className="w-4 h-4 mr-2" />
              OCR识别
            </Button>

            <Button onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </Card>

        {/* 缴费记录表格 */}
        {activeTab === 'records' && (
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无缴费记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">学生姓名</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">年级班级</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">费用类型</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">金额</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">缴费日期</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">收据编号</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">状态</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4 font-medium text-slate-900">{record.studentName}</td>
                        <td className="py-4 px-4 text-slate-700">
                          {record.grade} / {record.className}
                        </td>
                        <td className="py-4 px-4 text-slate-700">{record.feeType}</td>
                        <td className="py-4 px-4 text-slate-700">
                          {formatCurrency(record.amount, record.currency)}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          {record.paymentDate ? formatDate(record.paymentDate) : '-'}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          {record.receiptNumber || '-'}
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(record.status)}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button className="p-2 text-blue-600 hover:bg-blue-50" title="查看">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {record.status !== 'paid' && (
                              <Button className="p-2 text-green-600 hover:bg-green-50" title="收款">
                                <Receipt className="w-4 h-4" />
                              </Button>
                            )}
                            <Button className="p-2" title="下载收据">
                              <Download className="w-4 h-4" />
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

        {/* 费用类型管理 */}
        {activeTab === 'types' && (
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">费用类型列表</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增类型
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : feeTypes.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无费用类型</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {feeTypes.map((type) => (
                  <div key={type.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{type.name}</h4>
                        <span className="text-xs text-slate-500">{type.code}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        type.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {type.isActive ? '启用' : '禁用'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{type.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">
                        {formatCurrency(type.defaultAmount, type.currency)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button className="p-2" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* OCR模态框 */}
        {showOcrModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">OCR收据识别</h2>
              </div>

              <div className="p-6">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-4">
                  <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">上传收据图片进行OCR识别</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleOcrUpload(e.target.files[0])}
                    className="hidden"
                    id="ocr-upload"
                  />
                  <label htmlFor="ocr-upload">
                    <Button as="span" className="cursor-pointer">
                      {ocrProcessing ? '处理中...' : '选择图片'}
                    </Button>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end">
                <Button
                  onClick={() => setShowOcrModal(false)}
                  className="px-6"
                >
                  关闭
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceFeePage;
