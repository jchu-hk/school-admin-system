/**
 * ParentLeavePage — 家长代请假管理页面
 *
 * UI 原型 Section 21.4-21.5: 家长门户 — 请假管理
 *
 * 功能:
 *   - 查看为所有关联孩子提交的请假记录
 *   - 按状态筛选（全部/待审批/已批准/已拒绝/已撤回）
 *   - 撤回待审批的申请
 *   - 为当前选中的孩子提交新请假
 *
 * 与 StudentLeavePage 的区别:
 *   - 记录中显示学生姓名
 *   - 表单顶部显示 "为 {孩子姓名} 提交请假"
 *   - 数据通过 student_id 参数获取
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ChildInfo } from './api';
import type {
  LeaveRecord,
  LeaveStatus,
  ParentLeaveFormData,
  LeaveListData,
} from './leave/api';
import {
  fetchParentLeaveList,
  createParentLeave,
  cancelParentLeave,
} from './leave/api';
import LeaveCard from './leave/LeaveCard';
import ParentLeaveForm from './ParentLeaveForm';

// ── Constants ────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_FILTERS: Array<{ value: LeaveStatus | ''; label: string }> = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'cancelled', label: '已撤回' },
];

interface OutletContext {
  currentChildId: string;
  childrenList: ChildInfo[];
}

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

  const currentChild = childrenList.find((c) => c.id === currentChildId);

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

  // ── 当前选中的孩子 ID ──
  // 无孩子时仅展示空状态
  const activeStudentId = currentChildId;

  // ── 加载请假记录 ──
  const loadList = useCallback(
    async (pageNum: number, filter: LeaveStatus | '') => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data: LeaveListData = await fetchParentLeaveList(
          activeStudentId,
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
    [activeStudentId],
  );

  // ── 首次加载 & 切换孩子 ──
  useEffect(() => {
    loadList(1, statusFilter);
  }, [activeStudentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 切换筛选 ──
  const handleFilterChange = (filter: LeaveStatus | '') => {
    setStatusFilter(filter);
    loadList(1, filter);
  };

  // ── 翻页 ──
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > state.totalPages || newPage === state.page) {
      return;
    }
    loadList(newPage, statusFilter);
  };

  // ── 提交请假 ──
  const handleSubmitLeave = async (data: ParentLeaveFormData) => {
    setIsSubmitting(true);
    try {
      await createParentLeave(data);
      setShowForm(false);
      loadList(1, statusFilter);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 撤回请假 ──
  const handleCancel = async (id: string) => {
    if (cancellingIds.has(id)) return;

    setCancellingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await cancelParentLeave(id);
      loadList(state.page, statusFilter);
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

  // ── 分页渲染 ──
  const renderPagination = () => {
    if (state.totalPages <= 1) return null;

    const pages: React.ReactNode[] = [];
    const current = state.page;
    const total = state.totalPages;

    pages.push(
      <button
        key="prev"
        className="leave-pagination__btn"
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
          className="leave-pagination__btn"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>,
      );
      if (start > 2) {
        pages.push(
          <span key="dots-start" className="leave-pagination__dots">
            …
          </span>,
        );
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          className={`leave-pagination__btn ${
            i === current ? 'leave-pagination__btn--active' : ''
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
          <span key="dots-end" className="leave-pagination__dots">
            …
          </span>,
        );
      }
      pages.push(
        <button
          key={total}
          className="leave-pagination__btn"
          onClick={() => handlePageChange(total)}
        >
          {total}
        </button>,
      );
    }

    pages.push(
      <button
        key="next"
        className="leave-pagination__btn"
        disabled={current >= total}
        onClick={() => handlePageChange(current + 1)}
        aria-label="下一页"
      >
        ▶
      </button>,
    );

    return <div className="leave-pagination">{pages}</div>;
  };

  // ── 无关联孩子 ──
  if (childrenList.length === 0) {
    return (
      <div className="parent-dashboard">
        <div className="dashboard-card">
          <div className="dashboard-card__title">📋 请假管理</div>
          <div className="leave-page__empty">
            <p style={{ fontSize: 15, color: '#64748b' }}>
              暂无关联的孩子，无法提交请假
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      <div className="dashboard-card">
        {/* ── 页面标题 + 提交按钮 ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--portal-card-border)',
          }}
        >
          <h2 className="dashboard-card__title" style={{ border: 'none', padding: 0 }}>
            📋 请假管理
          </h2>
          <button
            className="leave-page__submit-btn"
            onClick={() => setShowForm(true)}
            disabled={!activeStudentId}
          >
            ➕ 提交请假
          </button>
        </div>

        {/* ── 当前孩子提示 ── */}
        <div style={{ padding: '12px 24px', fontSize: 13, color: 'var(--portal-text-secondary)', background: '#f8fafc', borderBottom: '1px solid var(--portal-card-border)' }}>
          🧒 当前查看:
          <strong style={{ marginLeft: 4 }}>{currentChild?.name}</strong>
          <span style={{ marginLeft: 8, color: 'var(--portal-muted)' }}>
            {currentChild?.class_name}
          </span>
        </div>

        {/* ── 状态筛选条 ── */}
        <div
          className="leave-page__filters"
          style={{ padding: '12px 24px', borderBottom: '1px solid var(--portal-card-border)' }}
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              className={`leave-page__filter-btn ${
                statusFilter === f.value ? 'leave-page__filter-btn--active' : ''
              }`}
              onClick={() => handleFilterChange(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── 记录列表 ── */}
        <div style={{ padding: '16px 24px' }}>
          {state.loading ? (
            <div className="leave-page__loading">
              <div className="leave-spinner" />
              <p>加载中…</p>
            </div>
          ) : state.error ? (
            <div className="leave-page__error">
              <p>⚠️ {state.error}</p>
              <button
                className="leave-page__retry-btn"
                onClick={() => loadList(state.page, statusFilter)}
              >
                重试
              </button>
            </div>
          ) : state.records.length === 0 ? (
            <div className="leave-page__empty">
              <p>暂无请假记录</p>
              <button
                className="leave-page__submit-link-btn"
                onClick={() => setShowForm(true)}
              >
                去提交请假 →
              </button>
            </div>
          ) : (
            <div className="pl-card-list">
              {state.records.map((record) => (
                <LeaveCard
                  key={record.id}
                  record={record}
                  onCancel={handleCancel}
                  isCancelling={cancellingIds.has(record.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 分页 ── */}
        {!state.loading && state.totalPages > 1 && (
          <div style={{ padding: '0 24px 16px' }}>
            {renderPagination()}
          </div>
        )}

        {/* ── 总数 ── */}
        {!state.loading && state.total > 0 && (
          <div className="dashboard-card__footer">
            共 {state.total} 条请假记录
          </div>
        )}
      </div>

      {/* ── 请假表单弹窗 ── */}
      {showForm && currentChild && (
        <ParentLeaveForm
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
