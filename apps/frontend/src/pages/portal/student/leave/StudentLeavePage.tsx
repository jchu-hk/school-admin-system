import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchLeaveList,
  cancelLeave,
  createLeave,
} from './api';
import type { LeaveRecord, LeaveStatus, LeaveFormData, LeaveListData } from './api';
import LeaveCard from './LeaveCard';
import LeaveForm from './LeaveForm';

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

/**
 * StudentLeavePage — 学生门户电子请假主页面
 *
 * 页面结构 (Mobile-first):
 * ┌──────────────────────────────────┐
 * │  电子请假                         │
 * │  [ ➕ 提交请假 ]                   │
 * ├──────────────────────────────────┤
 * │  我的请假记录                     │
 * │  [全部▼][待审批][已批准]...        │
 * ├──────────────────────────────────┤
 * │  ┌──────────────────────────────┐│
 *  │  │ 🤒 病假  07/10-07/11   ✅已批准││
 *  │  │  班主任: 王老师              ││
 *  │  └──────────────────────────────┘│
 *  │  ┌──────────────────────────────┐│
 *  │  │ 🏠 事假  07/08         ⏳待审批││
 *  │  │  班主任: 王老师     [撤回]    ││
 *  │  └──────────────────────────────┘│
 * │  ...                             │
 * ├──────────────────────────────────┤
 * │  ◀ 1 2 3 ... 5 ▶                 │
 * └──────────────────────────────────┘
 */
const StudentLeavePage: React.FC = () => {
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
  const loadList = useCallback(async (pageNum: number, filter: LeaveStatus | '') => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data: LeaveListData = await fetchLeaveList(
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
  }, []);

  // ── 首次加载 ──
  useEffect(() => {
    loadList(1, statusFilter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 切换筛选 / 翻页 ──
  const handleFilterChange = (filter: LeaveStatus | '') => {
    setStatusFilter(filter);
    loadList(1, filter);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > state.totalPages || newPage === state.page) {
      return;
    }
    loadList(newPage, statusFilter);
  };

  // ── 提交请假 ──
  const handleSubmitLeave = async (data: LeaveFormData) => {
    setIsSubmitting(true);
    try {
      await createLeave(data);
      setShowForm(false);
      // 回到第一页刷新列表
      loadList(1, statusFilter);
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
      await cancelLeave(id);
      // 刷新当前页
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

  // ── 生成分页按钮 ──
  const renderPagination = () => {
    if (state.totalPages <= 1) return null;

    const pages: React.ReactNode[] = [];
    const current = state.page;
    const total = state.totalPages;

    // 上一页
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

    // 页码
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
        pages.push(<span key="dots-start" className="leave-pagination__dots">…</span>);
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
        pages.push(<span key="dots-end" className="leave-pagination__dots">…</span>);
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

    // 下一页
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

  return (
    <div className="leave-page">
      {/* ── 页面标题 + 提交按钮 ── */}
      <header className="leave-page__header">
        <h1 className="leave-page__title">电子请假</h1>
        <button
          className="leave-page__submit-btn"
          onClick={() => setShowForm(true)}
        >
          ➕ 提交请假
        </button>
      </header>

      {/* ── 状态筛选条 ── */}
      <div className="leave-page__filters">
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
      <section className="leave-page__list">
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
        <p className="leave-page__total">
          共 {state.total} 条记录
        </p>
      )}

      {/* ── 请假表单模态框 ── */}
      {showForm && (
        <LeaveForm
          onSubmit={handleSubmitLeave}
          onClose={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default StudentLeavePage;
