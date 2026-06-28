import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  XCircle,
  Eye,
} from 'lucide-react';
import {
  getRentals,
  getOverdueRentals,
  createRental,
  updateRental,
  deleteRental,
  approveRental,
  lendAsset,
  returnAsset,
  rejectRental,
  getAssets,
  AssetRental,
  CreateRentalDto,
  UpdateRentalDto,
  RentalQueryParams,
  Asset,
} from '../api/asset';

const AssetRentalPage: React.FC = () => {
  const [rentals, setRentals] = useState<AssetRental[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState<AssetRental | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);

  const statusOptions = [
    { value: 'pending', label: '待审批', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { value: 'approved', label: '已审批', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    { value: 'lent', label: '已借出', icon: ArrowRight, color: 'text-green-500', bg: 'bg-green-50' },
    { value: 'returned', label: '已归还', icon: RotateCcw, color: 'text-gray-500', bg: 'bg-gray-50' },
    { value: 'overdue', label: '已逾期', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { value: 'rejected', label: '已拒绝', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const getStatusInfo = (status: string) => {
    return statusOptions.find((item) => item.value === status) || 
      { label: status, icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50' };
  };

  useEffect(() => {
    fetchData();
    fetchAssets();
    fetchOverdueCount();
  }, [page, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: RentalQueryParams = {
        page,
        pageSize,
        keyword: searchKeyword || undefined,
        status: selectedStatus || undefined,
      };
      const response = await getRentals(params);
      setRentals(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || '获取租借记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await getAssets({ pageSize: 100 });
      setAssets(response.data);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    }
  };

  const fetchOverdueCount = async () => {
    try {
      const overdue = await getOverdueRentals();
      setOverdueCount(overdue.length);
    } catch (err) {
      console.error('Failed to fetch overdue:', err);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此租借记录吗？')) return;
    try {
      await deleteRental(id);
      fetchData();
      fetchOverdueCount();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveRental(id, {});
      fetchData();
      fetchOverdueCount();
    } catch (err: any) {
      alert(err.message || '审批失败');
    }
  };

  const handleLend = async (id: string) => {
    try {
      await lendAsset(id);
      fetchData();
      fetchOverdueCount();
    } catch (err: any) {
      alert(err.message || '发放失败');
    }
  };

  const handleReturn = async (id: string) => {
    try {
      await returnAsset(id, {});
      fetchData();
      fetchOverdueCount();
    } catch (err: any) {
      alert(err.message || '归还失败');
    }
  };

  const handleReject = async (id: string) => {
    const note = prompt('请输入拒绝原因：');
    if (note === null) return;
    try {
      await rejectRental(id, note);
      fetchData();
    } catch (err: any) {
      alert(err.message || '拒绝失败');
    }
  };

  const handleView = (rental: AssetRental) => {
    setSelectedRental(rental);
    setShowDetailModal(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">资产租借管理</h1>
          {overdueCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-sm rounded-full">
              {overdueCount} 条逾期
            </span>
          )}
        </div>
        <Button onClick={() => { setSelectedRental(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          创建租借申请
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="搜索借用人姓名..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="px-3 py-2 border rounded-md"
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          >
            <option value="">所有状态</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Button onClick={handleSearch} variant="outline">
            <Search className="w-4 h-4 mr-2" />
            搜索
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">借用人</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">部门</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">借用日期</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">应还日期</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">数量</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用途</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : rentals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                rentals.map((rental) => {
                  const statusInfo = getStatusInfo(rental.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={rental.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{rental.borrowerName}</td>
                      <td className="px-4 py-3 text-sm">{rental.borrowerDepartment || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(rental.lendDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {rental.dueDate ? new Date(rental.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{rental.quantity}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${statusInfo.bg}`}>
                          <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[150px] truncate">
                        {rental.purpose || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => handleView(rental)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="查看"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {rental.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(rental.id)}
                                className="p-1 hover:bg-green-100 rounded"
                                title="审批通过"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => handleReject(rental.id)}
                                className="p-1 hover:bg-red-100 rounded"
                                title="拒绝"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                          {rental.status === 'approved' && (
                            <button
                              onClick={() => handleLend(rental.id)}
                              className="p-1 hover:bg-blue-100 rounded"
                              title="确认发放"
                            >
                              <ArrowRight className="w-4 h-4 text-blue-600" />
                            </button>
                          )}
                          {(rental.status === 'lent' || rental.status === 'overdue') && (
                            <button
                              onClick={() => handleReturn(rental.id)}
                              className="p-1 hover:bg-green-100 rounded"
                              title="确认归还"
                            >
                              <RotateCcw className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          {['pending', 'rejected'].includes(rental.status) && (
                            <button
                              onClick={() => handleDelete(rental.id)}
                              className="p-1 hover:bg-red-100 rounded"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-500">
            共 {total} 条记录，第 {page} / {totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Modal */}
      {showModal && (
        <RentalModal
          assets={assets}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchData();
            fetchOverdueCount();
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRental && (
        <RentalDetailModal
          rental={selectedRental}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};

// Rental Modal Component
interface RentalModalProps {
  assets: Asset[];
  onClose: () => void;
  onSave: () => void;
}

const RentalModal: React.FC<RentalModalProps> = ({ assets, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<CreateRentalDto>>({
    assetId: '',
    borrowerId: '',
    borrowerName: '',
    borrowerDepartment: '',
    lendDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    quantity: 1,
    purpose: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableAssets = assets.filter(a => 
    a.status === 'available' && a.availableQuantity > 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId) {
      setError('请选择资产');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createRental(formData as CreateRentalDto);
      onSave();
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const selectedAsset = assets.find(a => a.id === formData.assetId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">创建租借申请</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">选择资产 *</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.assetId || ''}
                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                required
              >
                <option value="">请选择资产</option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.code}) - 可用: {asset.availableQuantity} {asset.unit || '个'}
                  </option>
                ))}
              </select>
              {selectedAsset && (
                <div className="mt-2 text-sm text-gray-500">
                  可用数量: {selectedAsset.availableQuantity} {selectedAsset.unit || '个'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">借用人姓名 *</label>
              <Input
                required
                value={formData.borrowerName || ''}
                onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                placeholder="请输入借用人姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">借用人部门</label>
              <Input
                value={formData.borrowerDepartment || ''}
                onChange={(e) => setFormData({ ...formData, borrowerDepartment: e.target.value })}
                placeholder="请输入部门名称"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">借用日期 *</label>
                <Input
                  type="date"
                  required
                  value={formData.lendDate || ''}
                  onChange={(e) => setFormData({ ...formData, lendDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">应还日期</label>
                <Input
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">借用数量</label>
              <Input
                type="number"
                min={1}
                max={selectedAsset?.availableQuantity || 1}
                value={formData.quantity || 1}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">借用用途</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                value={formData.purpose || ''}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="请输入借用用途"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">备注</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="其他备注信息"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? '提交中...' : '提交申请'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Rental Detail Modal Component
interface RentalDetailModalProps {
  rental: AssetRental;
  onClose: () => void;
}

const RentalDetailModal: React.FC<RentalDetailModalProps> = ({ rental, onClose }) => {
  const statusOptions = [
    { value: 'pending', label: '待审批', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { value: 'approved', label: '已审批', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'lent', label: '已借出', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'returned', label: '已归还', color: 'text-gray-600', bg: 'bg-gray-50' },
    { value: 'overdue', label: '已逾期', color: 'text-red-600', bg: 'bg-red-50' },
    { value: 'rejected', label: '已拒绝', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const statusInfo = statusOptions.find((s) => s.value === rental.status) || 
    { label: rental.status, color: 'text-gray-600', bg: 'bg-gray-50' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">租借详情</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">状态</span>
              <span className={`px-2 py-1 rounded text-sm ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">借用人</div>
                <div className="font-medium">{rental.borrowerName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">部门</div>
                <div>{rental.borrowerDepartment || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">借用日期</div>
                <div>{new Date(rental.lendDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">应还日期</div>
                <div>{rental.dueDate ? new Date(rental.dueDate).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">实际归还日期</div>
                <div>{rental.returnDate ? new Date(rental.returnDate).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">借用数量</div>
                <div>{rental.quantity}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">借用用途</div>
              <div>{rental.purpose || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">备注</div>
              <div>{rental.note || '-'}</div>
            </div>
            {rental.returnNote && (
              <div>
                <div className="text-sm text-gray-500">归还备注</div>
                <div>{rental.returnNote}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500">经办人</div>
              <div>{rental.renterName || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">创建时间</div>
              <div>{new Date(rental.createdAt).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetRentalPage;
