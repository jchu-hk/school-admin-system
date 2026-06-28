import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Wrench,
  Archive,
} from 'lucide-react';
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStatistics,
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  AssetQueryParams,
} from '../api/asset';

const AssetManagementPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [statistics, setStatistics] = useState<{
    totalAssets: number;
    totalValue: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
  } | null>(null);

  const categories = [
    { value: 'electronics', label: '电子设备' },
    { value: 'furniture', label: '家具' },
    { value: 'sports', label: '体育用品' },
    { value: 'audio_visual', label: '音视频设备' },
    { value: 'computer', label: '计算机设备' },
    { value: 'office', label: '办公用品' },
    { value: 'laboratory', label: '实验室设备' },
    { value: 'library', label: '图书资料' },
    { value: 'vehicle', label: '车辆' },
    { value: 'other', label: '其他' },
  ];

  const statuses = [
    { value: 'available', label: '可用', icon: CheckCircle, color: 'text-green-500' },
    { value: 'in_use', label: '使用中', icon: Clock, color: 'text-blue-500' },
    { value: 'maintenance', label: '维护中', icon: Wrench, color: 'text-yellow-500' },
    { value: 'retired', label: '已报废', icon: Archive, color: 'text-gray-500' },
    { value: 'lost', label: '丢失', icon: AlertCircle, color: 'text-red-500' },
  ];

  const getStatusIcon = (status: string) => {
    const s = statuses.find((item) => item.value === status);
    const Icon = s?.icon || Package;
    return <Icon className={`w-4 h-4 ${s?.color || 'text-gray-500'}`} />;
  };

  const getStatusLabel = (status: string) => {
    return statuses.find((item) => item.value === status)?.label || status;
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((item) => item.value === category)?.label || category;
  };

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, [page, selectedCategory, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AssetQueryParams = {
        page,
        pageSize,
        keyword: searchKeyword || undefined,
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
      };
      const response = await getAssets(params);
      setAssets(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || '获取资产列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await getAssetStatistics('default-school');
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此资产吗？')) return;
    try {
      await deleteAsset(id);
      fetchData();
      fetchStatistics();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowModal(true);
  };

  const handleView = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDetailModal(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">资产管理</h1>
        </div>
        <Button onClick={() => { setSelectedAsset(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          添加资产
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-500">资产总数</div>
            <div className="text-2xl font-bold">{statistics.totalAssets}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">资产总值</div>
            <div className="text-2xl font-bold">¥{statistics.totalValue.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">可用资产</div>
            <div className="text-2xl font-bold text-green-600">
              {statistics.byStatus['available'] || 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">使用中</div>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.byStatus['in_use'] || 0}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="搜索资产名称、编号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="px-3 py-2 border rounded-md"
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          >
            <option value="">所有类别</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded-md"
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          >
            <option value="">所有状态</option>
            {statuses.map((s) => (
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">资产编号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">资产名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">类别</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">品牌/型号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">数量</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">存放位置</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">价值</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{asset.code}</td>
                    <td className="px-4 py-3 text-sm font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-sm">{getCategoryLabel(asset.category)}</td>
                    <td className="px-4 py-3 text-sm">
                      {asset.brand && <span>{asset.brand}</span>}
                      {asset.model && <span className="text-gray-500"> / {asset.model}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {asset.availableQuantity} / {asset.quantity} {asset.unit || '个'}
                    </td>
                    <td className="px-4 py-3 text-sm">{asset.location || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(asset.status)}
                        {getStatusLabel(asset.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">¥{Number(asset.value).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(asset)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="查看"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(asset)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Add/Edit Modal */}
      {showModal && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchData();
            fetchStatistics();
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};

// Asset Modal Component
interface AssetModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSave: () => void;
}

const AssetModal: React.FC<AssetModalProps> = ({ asset, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<CreateAssetDto>>({
    schoolId: 'default-school',
    name: '',
    code: '',
    category: 'other',
    brand: '',
    model: '',
    serialNumber: '',
    quantity: 1,
    unit: '个',
    value: 0,
    location: '',
    status: 'available',
    description: '',
    remark: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setFormData({
        schoolId: asset.schoolId,
        name: asset.name,
        code: asset.code,
        category: asset.category,
        brand: asset.brand,
        model: asset.model,
        serialNumber: asset.serialNumber,
        quantity: asset.quantity,
        unit: asset.unit,
        value: asset.value,
        location: asset.location,
        status: asset.status,
        description: asset.description,
        remark: asset.remark,
      });
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (asset) {
        await updateAsset(asset.id, formData as UpdateAssetDto);
      } else {
        await createAsset(formData as CreateAssetDto);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { value: 'electronics', label: '电子设备' },
    { value: 'furniture', label: '家具' },
    { value: 'sports', label: '体育用品' },
    { value: 'audio_visual', label: '音视频设备' },
    { value: 'computer', label: '计算机设备' },
    { value: 'office', label: '办公用品' },
    { value: 'laboratory', label: '实验室设备' },
    { value: 'library', label: '图书资料' },
    { value: 'vehicle', label: '车辆' },
    { value: 'other', label: '其他' },
  ];

  const statuses = [
    { value: 'available', label: '可用' },
    { value: 'in_use', label: '使用中' },
    { value: 'maintenance', label: '维护中' },
    { value: 'retired', label: '已报废' },
    { value: 'lost', label: '丢失' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{asset ? '编辑资产' : '添加资产'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">资产名称 *</label>
              <Input
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">资产编号 *</label>
              <Input
                required
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">类别</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.category || 'other'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">状态</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.status || 'available'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">品牌</label>
              <Input
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">型号</label>
              <Input
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">序列号</label>
              <Input
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">数量</label>
              <Input
                type="number"
                min={1}
                value={formData.quantity || 1}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">单位</label>
              <Input
                value={formData.unit || ''}
                placeholder="个、台、套"
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">价值 (元)</label>
              <Input
                type="number"
                min={0}
                value={formData.value || 0}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">存放位置</label>
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">购买日期</label>
              <Input
                type="date"
                value={formData.purchaseDate || ''}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">描述</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">备注</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                value={formData.remark || ''}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Asset Detail Modal Component
interface AssetDetailModalProps {
  asset: Asset;
  onClose: () => void;
}

const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, onClose }) => {
  const categories = [
    { value: 'electronics', label: '电子设备' },
    { value: 'furniture', label: '家具' },
    { value: 'sports', label: '体育用品' },
    { value: 'audio_visual', label: '音视频设备' },
    { value: 'computer', label: '计算机设备' },
    { value: 'office', label: '办公用品' },
    { value: 'laboratory', label: '实验室设备' },
    { value: 'library', label: '图书资料' },
    { value: 'vehicle', label: '车辆' },
    { value: 'other', label: '其他' },
  ];

  const statuses = [
    { value: 'available', label: '可用', color: 'text-green-600' },
    { value: 'in_use', label: '使用中', color: 'text-blue-600' },
    { value: 'maintenance', label: '维护中', color: 'text-yellow-600' },
    { value: 'retired', label: '已报废', color: 'text-gray-600' },
    { value: 'lost', label: '丢失', color: 'text-red-600' },
  ];

  const getCategoryLabel = (category: string) => {
    return categories.find((item) => item.value === category)?.label || category;
  };

  const getStatusInfo = (status: string) => {
    return statuses.find((item) => item.value === status) || { label: status, color: 'text-gray-600' };
  };

  const statusInfo = getStatusInfo(asset.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">资产详情</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-sm text-gray-500">资产名称</div>
              <div className="font-medium">{asset.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">资产编号</div>
              <div className="font-medium">{asset.code}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">类别</div>
              <div>{getCategoryLabel(asset.category)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">状态</div>
              <div className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">品牌</div>
              <div>{asset.brand || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">型号</div>
              <div>{asset.model || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">序列号</div>
              <div>{asset.serialNumber || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">数量</div>
              <div>{asset.quantity} {asset.unit || '个'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">可用数量</div>
              <div className="text-green-600 font-medium">{asset.availableQuantity}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">单位</div>
              <div>{asset.unit || '个'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">资产价值</div>
              <div className="font-medium">¥{Number(asset.value).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">存放位置</div>
              <div>{asset.location || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">供应商</div>
              <div>{asset.supplier || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">购买日期</div>
              <div>{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-500">描述</div>
              <div>{asset.description || '-'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-500">备注</div>
              <div>{asset.remark || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">创建时间</div>
              <div>{new Date(asset.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">更新时间</div>
              <div>{new Date(asset.updatedAt).toLocaleString()}</div>
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

export default AssetManagementPage;
