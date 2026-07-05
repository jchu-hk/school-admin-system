import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search, Plus, X, ChevronLeft, ChevronRight,
  Calendar, Clock, FileText, User, CheckCircle, XCircle,
  Filter, History, AlertCircle, RefreshCw, BarChart3, Utensils
} from 'lucide-react'
import apiClient from '../api/client'

enum LunchOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

enum LunchChangeType { ADD = 'add', CANCEL = 'cancel', MODIFY = 'modify' }
enum LunchChangeStatus { PENDING = 'pending', APPROVED = 'approved', REJECTED = 'rejected', AUTO_REJECTED = 'auto_rejected' }

interface LunchOrder {
  id: string; studentId: string; student?: { name: string }; orderDate: string; menuName: string
  menuPrice: number; quantity: number; totalAmount: number; status: LunchOrderStatus
}

interface LunchChange {
  id: string; studentId: string; student?: { name: string }; changeType: LunchChangeType
  originalItem?: string; newItem?: string; status: LunchChangeStatus; rejectReason?: string
  creator?: { name: string }; createdAt: string
}

interface LunchMenu { id: string; name: string; description?: string; price: number; supplier?: string; status: 'active' | 'inactive' }
interface CutoffStatus { cutoffTime: string; isAfterCutoff: boolean; pendingChangesCount: number }
interface SupplierReport { suppliers: Array<{ supplier: string; totalOrders: number; totalAmount: number }>; grandTotal: { orders: number; amount: number } }
interface Prediction { predictions: Array<{ date: string; predictedOrders: number; predictedAmount: number; confidence: 'high' | 'medium' | 'low' }>; basedOnDays: number }

type Tab = 'orders' | 'changes' | 'menu' | 'stats'

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-800' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
}

const changeStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已批准', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
  auto_rejected: { label: '自动拒绝', color: 'bg-gray-100 text-gray-600' },
}

const changeTypeLabels: Record<string, { label: string; color: string }> = {
  add: { label: '加单', color: 'bg-blue-100 text-blue-800' },
  cancel: { label: '取消', color: 'bg-red-100 text-red-800' },
  modify: { label: '更改', color: 'bg-orange-100 text-orange-800' },
}

const orderSchema = z.object({
  studentId: z.string().min(1, '请选择学生'),
  orderDate: z.string().min(1, '请选择日期'),
  menuName: z.string().min(1, '请输入菜品名称'),
  menuPrice: z.number().min(0, '价格不能为负'),
  quantity: z.number().min(1).default(1),
  notes: z.string().optional(),
})

const changeSchema = z.object({
  studentId: z.string().min(1, '请选择学生'),
  changeType: z.enum(['add', 'cancel', 'modify']),
  orderId: z.string().optional(),
  originalItem: z.string().optional(),
  newItem: z.string().optional(),
  newQuantity: z.number().min(1).optional(),
  newPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
})

const rejectSchema = z.object({ rejectReason: z.string().min(1, '请输入拒绝原因') })

type OrderForm = z.infer<typeof orderSchema>
type ChangeForm = z.infer<typeof changeSchema>
type RejectForm = z.infer<typeof rejectSchema>

export default function LunchOrderPage() {
  const [activeTab, setActiveTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<LunchOrder[]>([])
  const [changes, setChanges] = useState<LunchChange[]>([])
  const [menus, setMenus] = useState<LunchMenu[]>([])
  const [cutoffStatus, setCutoffStatus] = useState<CutoffStatus | null>(null)
  const [supplierReport, setSupplierReport] = useState<SupplierReport | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [total, setTotal] = useState(0)
  const [changesTotal, setChangesTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderFilter, setOrderFilter] = useState({ status: '', startDate: '', endDate: '' })
  const [changeFilter, setChangeFilter] = useState({ status: '', changeType: '' })
  const [statsDateRange, setStatsDateRange] = useState(() => {
    const end = new Date()
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
  })
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedChange, setSelectedChange] = useState<LunchChange | null>(null)
  const [page, setPage] = useState(1)
  const [changePage, setChangePage] = useState(1)
  const limit = 20

  const orderForm = useForm<OrderForm>({ resolver: zodResolver(orderSchema), defaultValues: { quantity: 1 } })
  const changeForm = useForm<ChangeForm>({ resolver: zodResolver(changeSchema), defaultValues: { changeType: 'add', quantity: 1 } })
  const rejectForm = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) })

  const fetchOrders = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(limit) })
      if (orderFilter.status) params.append('status', orderFilter.status)
      if (orderFilter.startDate) params.append('startDate', orderFilter.startDate)
      if (orderFilter.endDate) params.append('endDate', orderFilter.endDate)
      const { data } = await apiClient.get(`/lunch?${params}`)
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } catch { setError('获取订单列表失败') } finally { setLoading(false) }
  }, [page, orderFilter])

  const fetchChanges = useCallback(async (p = changePage) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(limit) })
      if (changeFilter.status) params.append('status', changeFilter.status)
      if (changeFilter.changeType) params.append('changeType', changeFilter.changeType)
      const { data } = await apiClient.get(`/lunch/changes?${params}`)
      setChanges(data.changes || [])
      setChangesTotal(data.total || 0)
    } catch { setError('获取变更列表失败') } finally { setLoading(false) }
  }, [changePage, changeFilter])

  const fetchMenus = useCallback(async () => {
    try { const { data } = await apiClient.get('/lunch/menu/items'); setMenus(data.menus || []) } catch { }
  }, [])

  const fetchCutoffStatus = useCallback(async () => {
    try { const { data } = await apiClient.get('/lunch/cutoff-status'); setCutoffStatus(data) } catch { }
  }, [])

  const fetchSupplierReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate: statsDateRange.startDate, endDate: statsDateRange.endDate })
      const { data } = await apiClient.get(`/lunch/supplier-report?${params}`)
      setSupplierReport(data)
    } catch { setError('获取供应商报表失败') } finally { setLoading(false) }
  }, [statsDateRange])

  const fetchPrediction = useCallback(async () => {
    setLoading(true)
    try { const { data } = await apiClient.get('/lunch/prediction?days=7'); setPrediction(data) }
    catch { setError('获取预测数据失败') } finally { setLoading(false) }
  }, [])

  const handleCreateOrder = async (values: OrderForm) => {
    try {
      await apiClient.post('/lunch', { ...values, createdBy: 'current-user' })
      setShowOrderModal(false)
      orderForm.reset()
      fetchOrders(1)
      setPage(1)
    } catch { setError('创建订单失败') }
  }

  const handleCreateChange = async (values: ChangeForm) => {
    try {
      await apiClient.post('/lunch/changes', { ...values, createdBy: 'current-user' })
      setShowChangeModal(false)
      changeForm.reset()
      fetchChanges(1)
      setChangePage(1)
      fetchCutoffStatus()
    } catch { setError('提交变更失败') }
  }

  const handleApproveChange = async (id: string) => {
    try { await apiClient.post(`/lunch/changes/${id}/approve`); fetchChanges(changePage); fetchOrders(1) }
    catch { setError('批准失败') }
  }

  const handleRejectChange = async (values: RejectForm) => {
    if (!selectedChange) return
    try {
      await apiClient.post(`/lunch/changes/${selectedChange.id}/reject`, values)
      setShowRejectModal(false)
      rejectForm.reset()
      setSelectedChange(null)
      fetchChanges(changePage)
    } catch { setError('拒绝失败') }
  }

  const openRejectModal = (change: LunchChange) => { setSelectedChange(change); setShowRejectModal(true) }

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
    if (activeTab === 'changes') { fetchChanges(); fetchCutoffStatus() }
    if (activeTab === 'menu') fetchMenus()
    if (activeTab === 'stats') { fetchSupplierReport(); fetchPrediction() }
  }, [activeTab])

  const tabs = [
    { key: 'orders', label: '订单管理', icon: Utensils },
    { key: 'changes', label: '变更申请', icon: History },
    { key: 'menu', label: '菜单管理', icon: FileText },
    { key: 'stats', label: '统计报表', icon: BarChart3 },
  ] as const

  const totalPages = Math.ceil(total / limit)
  const changeTotalPages = Math.ceil(changesTotal / limit)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">午膳订单管理</h1>
          <p className="text-sm text-gray-500 mt-1">F-LUNCH-001 · Issue #36</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowChangeModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
            <Plus size={16} /> 提交变更
          </button>
          <button onClick={() => setShowOrderModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Plus size={16} /> 新建订单
          </button>
        </div>
      </div>

      {activeTab === 'changes' && cutoffStatus && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${cutoffStatus.isAfterCutoff ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <AlertCircle size={20} className={cutoffStatus.isAfterCutoff ? 'text-red-500' : 'text-yellow-500'} />
          <div>
            <p className="font-medium text-sm">
              今日截止时间：<span className="font-mono">{cutoffStatus.cutoffTime}</span>
              {cutoffStatus.isAfterCutoff ? ' — 已过截止时间，变更申请将被自动拒绝' : ' — 请尽快提交变更申请'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">当前有 {cutoffStatus.pendingChangesCount} 条待审变更</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
        </div>
      )}

      {activeTab === 'orders' && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">状态</label>
              <select value={orderFilter.status} onChange={(e) => setOrderFilter((f) => ({ ...f, status: e.target.value }))} className="border rounded px-2 py-1.5 text-sm">
                <option value="">全部</option>
                {Object.entries(statusLabels).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">开始日期</label>
              <input type="date" value={orderFilter.startDate} onChange={(e) => setOrderFilter((f) => ({ ...f, startDate: e.target.value }))} className="border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">结束日期</label>
              <input type="date" value={orderFilter.endDate} onChange={(e) => setOrderFilter((f) => ({ ...f, endDate: e.target.value }))} className="border rounded px-2 py-1.5 text-sm" />
            </div>
            <button onClick={() => { fetchOrders(1); setPage(1) }} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"><Search size={14} /> 搜索</button>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">学生</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">日期</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">菜品</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">单价</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">数量</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">金额</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (<tr><td colSpan={7} className="text-center py-8 text-gray-400">加载中...</td></tr>) :
                 orders.length === 0 ? (<tr><td colSpan={7} className="text-center py-8 text-gray-400">暂无订单数据</td></tr>) :
                 orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{order.student?.name || order.studentId}</td>
                    <td className="px-4 py-3">{order.orderDate}</td>
                    <td className="px-4 py-3">{order.menuName}</td>
                    <td className="px-4 py-3 text-right">¥{order.menuPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{order.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium">¥{order.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[order.status]?.color || ''}`}>{statusLabels[order.status]?.label || order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">共 {total} 条</span>
              <div className="flex gap-1">
                <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchOrders(p) }} disabled={page === 1} className="p-1.5 border rounded disabled:opacity-40 hover:bg-gray-50"><ChevronLeft size={16} /></button>
                <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
                <button onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchOrders(p) }} disabled={page === totalPages} className="p-1.5 border rounded disabled:opacity-40 hover:bg-gray-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'changes' && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">变更类型</label>
              <select value={changeFilter.changeType} onChange={(e) => setChangeFilter((f) => ({ ...f, changeType: e.target.value }))} className="border rounded px-2 py-1.5 text-sm">
                <option value="">全部</option>
                {Object.entries(changeTypeLabels).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">状态</label>
              <select value={changeFilter.status} onChange={(e) => setChangeFilter((f) => ({ ...f, status: e.target.value }))} className="border rounded px-2 py-1.5 text-sm">
                <option value="">全部</option>
                {Object.entries(changeStatusLabels).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
              </select>
            </div>
            <button onClick={() => { fetchChanges(1); setChangePage(1) }} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"><Search size={14} /> 搜索</button>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">学生</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">类型</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">原菜品</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">新菜品</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">状态</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">申请时间</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (<tr><td colSpan={7} className="text-center py-8 text-gray-400">加载中...</td></tr>) :
                 changes.length === 0 ? (<tr><td colSpan={7} className="text-center py-8 text-gray-400">暂无变更记录</td></tr>) :
                 changes.map((change) => (
                  <tr key={change.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{change.student?.name || change.studentId}</td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${changeTypeLabels[change.changeType]?.color || ''}`}>{changeTypeLabels[change.changeType]?.label || change.changeType}</span></td>
                    <td className="px-4 py-3 text-gray-500">{change.originalItem || '-'}</td>
                    <td className="px-4 py-3">{change.newItem || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${changeStatusLabels[change.status]?.color || ''}`}>{changeStatusLabels[change.status]?.label || change.status}</span>
                      {change.rejectReason && <p className="text-xs text-red-500 mt-0.5">{change.rejectReason}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(change.createdAt).toLocaleString('zh-CN')}</td>
                    <td className="px-4 py-3 text-center">
                      {change.status === 'pending' && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleApproveChange(change.id)} className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"><CheckCircle size={12} /> 批准</button>
                          <button onClick={() => openRejectModal(change)} className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"><XCircle size={12} /> 拒绝</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {changeTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">共 {changesTotal} 条</span>
              <div className="flex gap-1">
                <button onClick={() => { const p = Math.max(1, changePage - 1); setChangePage(p); fetchChanges(p) }} disabled={changePage === 1} className="p-1.5 border rounded disabled:opacity-40 hover:bg-gray-50"><ChevronLeft size={16} /></button>
                <span className="px-3 py-1 text-sm">{changePage} / {changeTotalPages}</span>
                <button onClick={() => { const p = Math.min(changeTotalPages, changePage + 1); setChangePage(p); fetchChanges(p) }} disabled={changePage === changeTotalPages} className="p-1.5 border rounded disabled:opacity-40 hover:bg-gray-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'menu' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => alert('创建菜单功能开发中')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={16} /> 新增菜单</button>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">菜品名称</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">描述</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">价格</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">供应商</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {menus.length === 0 ? (<tr><td colSpan={5} className="text-center py-8 text-gray-400">暂无菜单数据</td></tr>) :
                 menus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{menu.name}</td>
                    <td className="px-4 py-3 text-gray-500">{menu.description || '-'}</td>
                    <td className="px-4 py-3 text-right">¥{menu.price.toFixed(2)}</td>
                    <td className="px-4 py-3">{menu.supplier || '-'}</td>
                    <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded-full text-xs ${menu.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{menu.status === 'active' ? '启用' : '停用'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'stats' && (
        <>
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">开始日期</label>
              <input type="date" value={statsDateRange.startDate} onChange={(e) => setStatsDateRange((d) => ({ ...d, startDate: e.target.value }))} className="border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">结束日期</label>
              <input type="date" value={statsDateRange.endDate} onChange={(e) => setStatsDateRange((d) => ({ ...d, endDate: e.target.value }))} className="border rounded px-2 py-1.5 text-sm" />
            </div>
            <button onClick={() => { fetchSupplierReport(); fetchPrediction() }} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"><RefreshCw size={14} /> 刷新</button>
            <button onClick={() => alert('导出CSV功能开发中')} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">📥 导出报表</button>
          </div>

          {loading ? (<div className="text-center py-12 text-gray-400">加载中...</div>) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border p-5">
                <h3 className="font-semibold mb-4">📊 供应商统计</h3>
                {supplierReport ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">总订单数</p>
                        <p className="text-2xl font-bold text-blue-700">{supplierReport.grandTotal.orders}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">总金额</p>
                        <p className="text-2xl font-bold text-green-700">¥{supplierReport.grandTotal.amount.toFixed(2)}</p>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b"><th className="pb-2">供应商</th><th className="pb-2 text-right">订单数</th><th className="pb-2 text-right">金额</th></tr>
                      </thead>
                      <tbody>
                        {supplierReport.suppliers.map((s, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-2">{s.supplier}</td>
                            <td className="py-2 text-right">{s.totalOrders}</td>
                            <td className="py-2 text-right">¥{s.totalAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : <p className="text-gray-400 text-sm">暂无数据</p>}
              </div>

              <div className="bg-white rounded-lg border p-5">
                <h3 className="font-semibold mb-4">🔮 预订预测</h3>
                {prediction ? (
                  <>
                    <p className="text-xs text-gray-500 mb-3">基于最近 {prediction.basedOnDays} 天历史数据</p>
                    <div className="space-y-2">
                      {prediction.predictions.map((p) => (
                        <div key={p.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">{p.date}</span>
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${p.confidence === 'high' ? 'bg-green-100 text-green-700' : p.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{p.confidence === 'high' ? '高置信' : p.confidence === 'medium' ? '中置信' : '低置信'}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">约 {p.predictedOrders} 单</p>
                            <p className="text-xs text-gray-500">¥{p.predictedAmount.toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-gray-400 text-sm">暂无预测数据（需要至少7天历史订单）</p>}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">新建午膳订单</h2>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={orderForm.handleSubmit(handleCreateOrder)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">学生ID</label>
                <input {...orderForm.register('studentId')} className="w-full border rounded px-3 py-2 text-sm" />
                {orderForm.formState.errors.studentId && <p className="text-red-500 text-xs mt-1">{orderForm.formState.errors.studentId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">订单日期</label>
                <input type="date" {...orderForm.register('orderDate')} className="w-full border rounded px-3 py-2 text-sm" />
                {orderForm.formState.errors.orderDate && <p className="text-red-500 text-xs mt-1">{orderForm.formState.errors.orderDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">菜品名称</label>
                <input {...orderForm.register('menuName')} className="w-full border rounded px-3 py-2 text-sm" />
                {orderForm.formState.errors.menuName && <p className="text-red-500 text-xs mt-1">{orderForm.formState.errors.menuName.message}</p>}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">单价</label>
                  <input type="number" step="0.01" {...orderForm.register('menuPrice', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 text-sm" />
                  {orderForm.formState.errors.menuPrice && <p className="text-red-500 text-xs mt-1">{orderForm.formState.errors.menuPrice.message}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">数量</label>
                  <input type="number" {...orderForm.register('quantity', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">备注</label>
                <textarea {...orderForm.register('notes')} className="w-full border rounded px-3 py-2 text-sm" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChangeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">提交午膳变更</h2>
              <button onClick={() => setShowChangeModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={changeForm.handleSubmit(handleCreateChange)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">学生ID</label>
                <input {...changeForm.register('studentId')} className="w-full border rounded px-3 py-2 text-sm" />
                {changeForm.formState.errors.studentId && <p className="text-red-500 text-xs mt-1">{changeForm.formState.errors.studentId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">变更类型</label>
                <select {...changeForm.register('changeType')} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="add">加单</option>
                  <option value="cancel">取消</option>
                  <option value="modify">更改款式</option>
                </select>
              </div>
              {changeForm.watch('changeType') !== 'add' && (
                <div>
                  <label className="block text-sm font-medium mb-1">关联订单ID（可选）</label>
                  <input {...changeForm.register('orderId')} className="w-full border rounded px-3 py-2 text-sm" placeholder="取消/修改时填写" />
                </div>
              )}
              {(changeForm.watch('changeType') === 'cancel' || changeForm.watch('changeType') === 'modify') && (
                <div>
                  <label className="block text-sm font-medium mb-1">原菜品</label>
                  <input {...changeForm.register('originalItem')} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              )}
              {(changeForm.watch('changeType') === 'add' || changeForm.watch('changeType') === 'modify') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">新菜品</label>
                    <input {...changeForm.register('newItem')} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">新数量</label>
                      <input type="number" {...changeForm.register('newQuantity', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">新价格</label>
                      <input type="number" step="0.01" {...changeForm.register('newPrice', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">备注</label>
                <textarea {...changeForm.register('notes')} className="w-full border rounded px-3 py-2 text-sm" rows={2} />
              </div>
              {cutoffStatus?.isAfterCutoff && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} /> 已过截止时间，您的变更将被自动拒绝
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowChangeModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">提交变更</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRejectModal && selectedChange && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">拒绝变更申请</h2>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
              <p><strong>学生:</strong> {selectedChange.student?.name || selectedChange.studentId}</p>
              <p><strong>类型:</strong> {changeTypeLabels[selectedChange.changeType]?.label}</p>
              <p><strong>申请时间:</strong> {new Date(selectedChange.createdAt).toLocaleString('zh-CN')}</p>
            </div>
            <form onSubmit={rejectForm.handleSubmit(handleRejectChange)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">拒绝原因 *</label>
                <textarea {...rejectForm.register('rejectReason')} className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="请输入拒绝原因..." />
                {rejectForm.formState.errors.rejectReason && <p className="text-red-500 text-xs mt-1">{rejectForm.formState.errors.rejectReason.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">确认拒绝</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
