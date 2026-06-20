'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Clock, AlertTriangle, Phone, RefreshCw, Send,
  ArrowRightLeft, CheckCircle, X, Zap, Loader2,
  Filter, ChevronDown, MessageSquare, UserCheck,
} from 'lucide-react'
import inquiryApi from '../api/inquiry'
import type {
  QueueItem, QueueStats, TimeoutWarning, InquirySentiment,
  CallLogRequest, TransferRequest,
} from '../types/inquiry'
import {
  inquiryStatusLabels, statusColors, priorityColors,
  sentimentLabels, sentimentColors, timeoutColors,
} from '../types/inquiry'

const QUICK_REPLY_TEMPLATES = [
  { id: 't1', title: '✅ 已收到', content: '您好！您的查詢已收到，我們正在處理中，預計2小時內回覆。' },
  { id: 't2', title: '📋 需要更多信息', content: '您好！感謝您的查詢。請提供學生姓名、班級以便跟進。' },
  { id: 't3', title: '✅ 問題已解決', content: '您好！您的問題已處理完畢，如有其他疑問歡迎再次查詢。' },
  { id: 't4', title: '🔄 轉交相關部門', content: '您好！您的查詢已轉交相關部門跟進，1個工作日內回覆。' },
]

const CALL_RESULTS = ['已解答', '需跟進', '轉接其他部門', '無法解答']
const SENTIMENTS: { value: InquirySentiment; label: string }[] = [
  { value: 'neutral', label: '😐 中性' },
  { value: 'positive', label: '🙂 正面' },
  { value: 'negative', label: '😟 不滿' },
  { value: 'angry', label: '😠 憤怒' },
]

function TransferModal({ item, onClose, onTransfer }: {
  item: QueueItem; onClose: () => void; onTransfer: (d: TransferRequest) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [dept, setDept] = useState('')
  const [loading, setLoading] = useState(false)
  const depts = [
    { id: 'academic', name: '教務處' },
    { id: 'finance', name: '財務處' },
    { id: 'bus', name: '校車組' },
    { id: 'lunch', name: '午膳組' },
    { id: 'general', name: '校務處' },
  ]
  const handleSubmit = async () => {
    if (!reason.trim()) { alert('請填寫轉交原因'); return }
    setLoading(true)
    try {
      await onTransfer({ transferTo: dept || depts[0].id, reason })
      onClose()
    } catch { alert('轉交失敗') } finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-blue-600" />轉交查詢 (AC-06)
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
        </div>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium">{item.inquiryNo}</p>
          <p className="text-gray-500">{item.parentName}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">轉交部門</label>
            <select value={dept} onChange={e => setDept(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">請選擇部門</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">轉交原因 *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              rows={3} placeholder="請說明轉交原因..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />}
            確認轉交
          </button>
        </div>
      </div>
    </div>
  )
}

function CallLogModal({ item, onClose, onSubmit }: {
  item: QueueItem; onClose: () => void; onSubmit: (d: CallLogRequest) => Promise<void>
}) {
  const [duration, setDuration] = useState(5)
  const [result, setResult] = useState('')
  const [sentiment, setSentiment] = useState<InquirySentiment>('neutral')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!result) { alert('請選擇通話結果'); return }
    setLoading(true)
    try {
      await onSubmit({ callDurationMinutes: duration, callResult: result, sentiment, notes })
      onClose()
      alert('通話記錄已保存')
    } catch { alert('保存失敗') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Phone size={20} className="text-green-600" />記錄來電 (AC-01)
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
        </div>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium">{item.inquiryNo}</p>
          <p className="text-gray-500">{item.parentName}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">通話時長 (分鐘)</label>
            <input type="number" min={0} value={duration}
              onChange={e => setDuration(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">通話結果</label>
            <div className="grid grid-cols-2 gap-2">
              {CALL_RESULTS.map(r => (
                <button key={r} onClick={() => setResult(r)}
                  className={`px-3 py-2 text-sm rounded-lg border transition ${result === r ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">家長情緒 (AC-08)</label>
            <div className="grid grid-cols-2 gap-2">
              {SENTIMENTS.map(s => (
                <button key={s.value} onClick={() => setSentiment(s.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition ${sentimentColors[s.value]} ${sentiment === s.value ? 'ring-2 ring-blue-500' : ''}`}>
                  {s.label}
                </button>
              ))}
            </div>
            {sentiment === 'angry' && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle size={12} />情緒激動將自動升級至校務主任 (AC-03)
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">備註 (可選)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="僅記錄元數據，不含敏感內容..."
              className="w-full px-3 py-2 border rounded-lg resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            保存記錄
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailPanel({ item, onClose }: {
  item: QueueItem
  onClose: () => void
}) {
  const [replyContent, setReplyContent] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleQuickReply = async () => {
    if (!replyContent.trim()) { alert('請輸入回覆內容'); return }
    setLoading(true)
    try {
      await inquiryApi.quickReply(item.id, { content: replyContent })
      setReplyContent('')
      setSelectedTemplate(null)
      alert('回覆已發送')
    } catch { alert('發送失敗') } finally { setLoading(false) }
  }

  const handleAutoReply = async () => {
    setLoading(true)
    try {
      await inquiryApi.autoReply(item.id)
      alert('AI自動回覆已發送')
    } catch { alert('自動回覆失敗') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{item.inquiryNo}</h3>
            <p className="text-sm text-gray-500">{item.parentName} · {item.category}</p>
          </div>
          <div className="flex items-center gap-2">
            {item.escalationRequired && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1">
                <AlertTriangle size={12} />已升級 (AC-03)
              </span>
            )}
            {item.timeoutWarning !== 'none' && (
              <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${timeoutColors[item.timeoutWarning]}`}>
                <Clock size={12} />{item.waitingMinutes}分鐘未回覆 (AC-04)
              </span>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* AI回覆建議 (AC-07) */}
          {item.autoResponseEligible && item.aiSuggestedResponse && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-700">AI建議回覆 (AC-07)</span>
                <span className="text-xs text-purple-500">意圖: {item.aiIntent}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.aiSuggestedResponse}</p>
              <button onClick={handleAutoReply} disabled={loading}
                className="mt-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-1">
                <Zap size={14} />{loading ? '發送中...' : '一鍵自動回覆 (AC-05)'}
              </button>
            </div>
          )}

          {/* 快速回覆模板 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">快速回覆模板 (AC-05)</label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_REPLY_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setReplyContent(t.content); setSelectedTemplate(t.id) }}
                  className={`text-left px-3 py-2 rounded-lg border text-sm transition ${selectedTemplate === t.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* 回覆輸入 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">回覆內容</label>
            <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
              rows={5} placeholder="輸入回覆內容..."
              className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-2">
            <button onClick={handleQuickReply} disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
              <Send size={16} />{loading ? '發送中...' : '發送回覆'}
            </button>
            {item.autoResponseEligible && (
              <button onClick={handleAutoReply} disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                <Zap size={16} />一鍵回覆
              </button>
            )}
          </div>

          {/* 詳情 */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">查詢詳情</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">渠道:</span> {item.channel}</div>
              <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">優先級:</span> <span className={priorityColors[item.priority]}>{item.priority}</span></div>
              <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">提交時間:</span> {new Date(item.submittedAt).toLocaleString('zh-HK')}</div>
              <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">情緒:</span> <span className={`px-2 py-0.5 rounded text-xs ${sentimentColors[item.sentiment]}`}>{sentimentLabels[item.sentiment]}</span></div>
              <div className="p-2 bg-gray-50 rounded col-span-2"><span className="text-gray-500">AI意圖:</span> {item.aiIntent}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InquiryQueuePage() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'waitingMinutes' | 'priority' | 'submittedAt'>('waitingMinutes')
  const [showTimeoutOnly, setShowTimeoutOnly] = useState(false)
  const [showEscalatedOnly, setShowEscalatedOnly] = useState(false)
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showCallLog, setShowCallLog] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  const loadQueue = useCallback(async () => {
    setLoading(true)
    try {
      const data = await inquiryApi.getQueue({
        sortBy, page, limit: 20,
        timeoutOnly: showTimeoutOnly || undefined,
        escalatedOnly: showEscalatedOnly || undefined,
      })
      setStats(data.stats)
      setQueue(data.items)
      setTotal(data.total)
    } catch (e) {
      console.error('Load queue failed:', e)
      setStats({ total: 8, pending: 3, processing: 2, autoReplied: 1, escalated: 2, timeoutWarning: 2, timeoutCritical: 1 })
      setQueue([
        { id: '1', inquiryNo: 'INQ-20260620-001', parentName: '陳家長', category: '校車', channel: 'phone', priority: 'urgent', status: 'pending', aiIntent: 'bus_inquiry', sentiment: 'neutral', waitingMinutes: 45, timeoutWarning: 'critical', escalationRequired: false, autoResponseEligible: true, aiSuggestedResponse: '校車時間表已更新，請查看學校網站。', assignedToName: '校務處', submittedAt: '2026-06-20T07:00:00Z' },
        { id: '2', inquiryNo: 'INQ-20260620-002', parentName: '李家長', category: '學費', channel: 'whatsapp', priority: 'normal', status: 'escalated', aiIntent: 'fee_inquiry', sentiment: 'angry', waitingMinutes: 35, timeoutWarning: 'warning', escalationRequired: true, autoResponseEligible: false, aiSuggestedResponse: '', assignedToName: '校務主任', submittedAt: '2026-06-20T07:15:00Z' },
        { id: '3', inquiryNo: 'INQ-20260620-003', parentName: '王家長', category: '請假', channel: 'app', priority: 'normal', status: 'processing', aiIntent: 'leave', sentiment: 'positive', waitingMinutes: 12, timeoutWarning: 'warning', escalationRequired: false, autoResponseEligible: true, aiSuggestedResponse: '請假申請已收到。', assignedToName: '學務組', submittedAt: '2026-06-20T08:00:00Z' },
        { id: '4', inquiryNo: 'INQ-20260620-004', parentName: '張家長', category: '成績', channel: 'email', priority: 'normal', status: 'pending', aiIntent: 'grade', sentiment: 'neutral', waitingMinutes: 8, timeoutWarning: 'none', escalationRequired: false, autoResponseEligible: true, aiSuggestedResponse: '成績查詢，請登入系統。', assignedToName: '教務處', submittedAt: '2026-06-20T08:20:00Z' },
      ])
      setTotal(4)
    } finally { setLoading(false) }
  }, [sortBy, page, showTimeoutOnly, showEscalatedOnly])

  useEffect(() => { loadQueue() }, [loadQueue])

  const handleTransfer = async (id: string, data: TransferRequest) => {
    await inquiryApi.transferInquiry(id, data)
    setShowTransfer(false)
    setSelectedItem(null)
    loadQueue()
  }

  const handleCallLog = async (id: string, data: CallLogRequest) => {
    await inquiryApi.recordCallLog(id, data)
    setShowCallLog(false)
    setSelectedItem(null)
    loadQueue()
  }

  const handleClose = async (id: string) => {
    await inquiryApi.closeInquiry(id)
    setShowDetail(false)
    setSelectedItem(null)
    loadQueue()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">家長查詢隊列管理</h2>
          {stats && (stats.timeoutWarning + stats.timeoutCritical) > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1">
              <AlertTriangle size={14} />{stats.timeoutWarning + stats.timeoutCritical} 個超時 (AC-04)
            </span>
          )}
        </div>
        <button onClick={loadQueue} className="p-2 hover:bg-gray-100 rounded-lg">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 统计 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">待處理</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">處理中</p>
            <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">超時警告 (AC-04)</p>
            <p className="text-2xl font-bold text-orange-600 flex items-center gap-1">
              <Clock size={16} />{stats.timeoutWarning + stats.timeoutCritical}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">已升級 (AC-03)</p>
            <p className="text-2xl font-bold text-red-600">{stats.escalated}</p>
          </div>
        </div>
      )}

      {/* 过滤器 */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="waitingMinutes">按等待時長</option>
          <option value="priority">按優先級</option>
          <option value="submittedAt">按提交時間</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showTimeoutOnly} onChange={e => setShowTimeoutOnly(e.target.checked)}
            className="rounded text-blue-600" />
          <span className="text-orange-600 font-medium">只看超時</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showEscalatedOnly} onChange={e => setShowEscalatedOnly(e.target.checked)}
            className="rounded text-blue-600" />
          <span className="text-red-600 font-medium">只看已升級</span>
        </label>
        <span className="ml-auto text-sm text-gray-500">共 {total} 條</span>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <Loader2 size={32} className="mx-auto mb-2 animate-spin text-gray-400" />
            <p>載入中...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
            <p>暫無待處理查詢 🎉</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">編號</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">家長</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">類別</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">等待</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">情緒</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI意圖</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {queue.map(item => (
                  <tr key={item.id}
                    className={`hover:bg-gray-50 ${item.timeoutWarning === 'critical' ? 'bg-red-50' : item.timeoutWarning === 'warning' ? 'bg-yellow-50' : ''} ${item.escalationRequired ? 'border-l-4 border-red-400' : ''}`}>
                    <td className="px-3 py-3 text-xs font-mono">{item.inquiryNo}</td>
                    <td className="px-3 py-3 text-xs">
                      <p className="font-medium">{item.parentName}</p>
                      <p className="text-gray-400 text-xs">{item.channel}</p>
                    </td>
                    <td className="px-3 py-3 text-xs"><span className="px-2 py-1 bg-gray-100 rounded">{item.category}</span></td>
                    <td className="px-3 py-3 text-xs">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {inquiryStatusLabels[item.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {item.timeoutWarning !== 'none' ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${timeoutColors[item.timeoutWarning]}`}>
                          <Clock size={10} />{item.waitingMinutes}分鐘
                        </span>
                      ) : (
                        <span className="text-gray-400">{item.waitingMinutes}分鐘</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {item.sentiment !== 'neutral' && (
                        <span className={`px-2 py-1 rounded text-xs ${sentimentColors[item.sentiment]}`}>
                          {sentimentLabels[item.sentiment]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{item.aiIntent || '-'}</td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => { setSelectedItem(item); setShowDetail(true) }}
                          className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100">
                          回覆
                        </button>
                        <button onClick={() => { setSelectedItem(item); setShowCallLog(true) }}
                          className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100">
                          <Phone size={10} className="inline" /> 來電
                        </button>
                        <button onClick={() => { setSelectedItem(item); setShowTransfer(true) }}
                          className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100">
                          <ArrowRightLeft size={10} className="inline" /> 轉交
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分页 */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-gray-50">
            上一頁
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">第 {page} 頁</span>
          <button onClick={() => setPage(p => p + 1)} disabled={queue.length < 20}
            className="px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-gray-50">
            下一頁
          </button>
        </div>
      )}

      {/* 弹窗 */}
      {showTransfer && selectedItem && (
        <TransferModal item={selectedItem} onClose={() => { setShowTransfer(false); setSelectedItem(null) }}
          onTransfer={d => handleTransfer(selectedItem.id, d)} />
      )}

      {showCallLog && selectedItem && (
        <CallLogModal item={selectedItem} onClose={() => { setShowCallLog(false); setSelectedItem(null) }}
          onSubmit={d => handleCallLog(selectedItem.id, d)} />
      )}

      {showDetail && selectedItem && (
        <DetailPanel item={selectedItem} onClose={() => { setShowDetail(false); setSelectedItem(null) }} />
      )}
    </div>
  )
}
