/**
 * ParentLeavePage — 家长版请假管理主页面
 *
 * UI 原型 Section 21.4: 家长门户 — 请假管理
 *
 * 功能:
 *   1. 展示当前切换孩子的请假记录列表（分页+状态筛选）
 *   2. 为孩子提交请假（选择孩子+类型+时间+原因）
 *   3. 撤回待审批的请假申请
 *   4. 孩子档案只读查看
 *
 * 页面结构:
 * ┌─────────────────────────────────────┐
 * │  请假管理                            │
 * │  [➕ 提交请假]                       │
 * ├─────────────────────────────────────┤
 * │  筛选: [全部][待审批][已批准]...      │
 * ├─────────────────────────────────────┤
 * │  ┌─────────────────────────────────┐│
 * │  │ 🤒 病假  07/10-07/11  ✅已批准   ││
 * │  │  🧒 张小玲  班主任: 王老师       ││
 * │  └─────────────────────────────────┘│
 * │  ...                               │
 * ├─────────────────────────────────────┤
 * │  ◀ 1 2 3 ▶                          │
 * └─────────────────────────────────────┘
 *
 * 档案只读: 点击"查看档案"按钮跳转到档案页
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { ChildInfo } from '../api';
import {
  fetchParentLeaveList,
  cancelParentLeave,
  createParentLeave,
} from './api';
import type {
  LeaveRecord,
  LeaveStatus,
  ParentLeaveFormData,
  LeaveListData,
} from './api';
import LeaveCard from './LeaveCard';
import LeaveFormModal from './LeaveFormModal';

// ── Outlet Context Type ──────────────────────────────────

interface OutletContext {
  currentChildId: string;
  childrenList: ChildInfo[];
}

// ── Constants ────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_FILTERS: Array<{ value: LeaveStatus | ''; label: string }> = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'cancelled', label: '已撤回' },
];

// ── Page State ───────────────────────────────────────────

interface PageState {
  records: LeaveRecord[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

// ── Component ────────────────────────────────────────────

const ParentLeavePage: React.FC = () => {
  const { currentChildId, childrenList } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const currentChild = childrenList.find((c) => c.id === currentChildId);
  const displayName = currentChild?.name ?? '当前孩子';
  const childClass = currentChild?.class_name ?? '';

  // ── State ──
  const [state, setState] = useState<PageState>({
    records: [],
    total: 0,
    page: 1,
    totalPages: 0,
    loading: true,
    error: null,
  });
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  // ── 加载列表 ──
  const loadList = useCallback(
    async (childId: string, pageNum: number, filter: LeaveStatus | '') => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data: LeaveListData = await fetchParentLeaveList(
          childId,
          pageNum,
          PAGE_SIZE,
          filter || undefined,
        );

        setState({
          records: data.items ?? [],
          total: data.total ?? 0,
          page: data.page ?? pageNum,
          totalPages: data.totalPages ?? 0,
          loading: false,
          error: null,
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : '加载失败',
        }));
      }
    },
    [],
  );

  // ── 当前孩子或筛选条件变化时重新加载 ──
  useEffect(() => {
    if (currentChildId) {
      loadList(currentChildId, 1, statusFilter);
    } else {
      setState({
        records: [],
        total: 0,
        page: 1,
        totalPages: 0,
        loading: false,
        error: null,
      });
    }
  }, [currentChildId, statusFilter, loadList]);

  // ── 切换筛选 / 翻页 ──
  const handleFilterChange = (filter: LeaveStatus | '') => {
    setStatusFilter(filter);
    // loadList 会由 useEffect 触发
  };

  const handlePageChange = (newPage: number) => {
    if (
      newPage < 1 ||
      newPage > state.totalPages ||
      newPage === state.page
    ) {
      return;
    }
    loadList(currentChildId, newPage, statusFilter);
  };

  // ── 提交请假 ──
  const handleSubmitLeave = async (data: ParentLeaveFormData) => {
    setIsSubmitting(true);
    try {
      await createParentLeave(data);
      setShowForm(false);
      loadList(currentChildId, 1, statusFilter);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 撤回 ──
  const handleCancel = async (id: string) => {
    if (cancellingIds.has(id)) return;

    setCancellingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await cancelParentLeave(id);
      loadList(currentChildId, state.page, statusFilter);
    } catch (err) {
      alert(err instanceof Error ? err.message : '撤回失败');
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ── 生成分页按钮 ──
  const renderPagination = () => {
    if (state.totalPages <= 1) return null;

    const pages: React.ReactNode[] = [];
    const current = state.page;
    const total = state.totalPages;

    pages.push(
      <button
        key="prev"
        className="pl-pagination__btn"
        disabled={current <= 1}
        onClick={() => handlePageChange(current - 1)}
        aria-label="上一页"
      >
        ◀
      </button>,
    );

    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <button
          key={1}
          className="pl-pagination__btn"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>,
      );
      if (start > 2) {
        pages.push(
          <span key="dots-start" className="pl-pagination__dots">
            …
          </span>,
        );
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          className={`pl-pagination__btn ${
            i === current ? 'pl-pagination__btn--active' : ''
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>,
      );
    }

    if (end < total) {
      if (end < total - 1) {
        pages.push(
          <span key="dots-end" className="pl-pagination__dots">
            …
          </span>,
        );
      }
      pages.push(
        <button
          key={total}
          className="pl-pagination__btn"
          onClick={() => handlePageChange(total)}
        >
          {total}
        </button>,
      );
    }

    pages.push(
      <button
        key="next"
        className="pl-pagination__btn"
        disabled={current >= total}
        onClick={() => handlePageChange(current + 1)}
        aria-label="下一页"
      >
        ▶
      </button>,
    );

    return <div className="pl-pagination">{pages}</div>;
  };

  // ── 没有选择孩子时的空状态 ──
  if (!currentChildId) {
    return (
      <div className="parent-dashboard">
        <div className="dashboard-card">
          <div className="dashboard-card__title">📋 请假管理</div>
          <div
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              请先选择一个孩子
            </p>
            <p style={{ fontSize: '13px' }}>
              在顶部孩子切换器中选择孩子后查看请假记录
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      {/* ── 页面头部：标题 + 当前孩子信息 + 操作按钮 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="dashboard-card__title" style={{ border: 'none', padding: 0, marginBottom: 4 }}>
            📋 请假管理
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            当前孩子: {displayName} {childClass}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="pl-view-btn"
            onClick={() => navigate('/portal/parent/children')}
          >
            📊 查看档案
          </button>
          <button
            className="pl-submit-btn"
            onClick={() => setShowForm(true)}
          >
            ➕ 提交请假
          </button>
        </div>
      </div>

      {/* ── 状态筛选条 ── */}
      <div className="pl-filters">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            className={`pl-filter-btn ${
              statusFilter === f.value ? 'pl-filter-btn--active' : ''
            }`}
            onClick={() => handleFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── 记录列表 ── */}
      <section className="pl-list">
        {state.loading ? (
          <div className="pl-loading">
            <div className="pl-spinner" />
            <p>加载中…</p>
          </div>
        ) : state.error ? (
          <div className="pl-error">
            <p>⚠️ {state.error}</p>
            <button
              className="pl-retry-btn"
              onClick={() => loadList(currentChildId, state.page, statusFilter)}
            >
              重试
            </button>
          </div>
        ) : state.records.length === 0 ? (
          <div className="pl-empty">
            <p>暂无请假记录</p>
            <button
              className="pl-link-btn"
              onClick={() => setShowForm(true)}
            >
              去提交请假 →
            </button>
          </div>
        ) : (
          <>
            {state.records.map((record) => (
              <LeaveCard
                key={record.id}
                record={record}
                onCancel={handleCancel}
                isCancelling={cancellingIds.has(record.id)}
              />
            ))}
          </>
        )}
      </section>

      {/* ── 分页 ── */}
      {!state.loading && state.totalPages > 1 && renderPagination()}

      {/* ── 总记录数 ── */}
      {!state.loading && state.total > 0 && (
        <p className="pl-total">共 {state.total} 条记录</p>
      )}

      {/* ── 请假表单模态框 ── */}
      {showForm && currentChild && (
        <LeaveFormModal
          currentChild={currentChild}
          childrenList={childrenList}
          onSubmit={handleSubmitLeave}
          onClose={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default ParentLeavePage;
