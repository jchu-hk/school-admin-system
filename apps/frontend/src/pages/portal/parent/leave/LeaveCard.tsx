/**
 * LeaveCard — 请假记录卡片（家长版）
 *
 * 展示一条请假信息，包含:
 *   - 孩子姓名 + 请假类型图标
 *   - 日期范围 + 总天数
 *   - 请假原因（截断）
 *   - 审批状态徽章
 *   - 撤回按钮（仅待审批状态可见）
 */

import React from 'react';
import type { LeaveRecord } from './api';
import LeaveStatusBadge from './LeaveStatusBadge';

// ── Leave Type Config ────────────────────────────────────

const LEAVE_TYPE_META: Record<string, { icon: string; label: string }> = {
  sick: { icon: '🤒', label: '病假' },
  personal: { icon: '🏠', label: '事假' },
  family: { icon: '👨‍👩‍👧‍👦', label: '家庭假' },
  other: { icon: '📄', label: '其他' },
};

function getLeaveTypeMeta(type: string) {
  return LEAVE_TYPE_META[type] ?? { icon: '📄', label: type };
}

// ── Props ────────────────────────────────────────────────

interface LeaveCardProps {
  record: LeaveRecord;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
}

// ── Helpers ──────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  const s = fmt(start);
  const e = fmt(end);

  if (s === e) return s;
  return `${s}-${e}`;
}

// ── Component ────────────────────────────────────────────

const LeaveCard: React.FC<LeaveCardProps> = ({
  record,
  onCancel,
  isCancelling = false,
}) => {
  const typeMeta = getLeaveTypeMeta(record.leaveType);
  const dateRange = formatDateRange(record.startDate, record.endDate);
  const canCancel =
    record.status === 'pending' || record.status === 'pending_director';

  const teacherComment = record.approvalComment ?? record.directorComment;

  return (
    <div className="pl-card">
      {/* ── 左侧：类型图标 ── */}
      <div className="pl-card__icon">{typeMeta.icon}</div>

      {/* ── 中间：信息区 ── */}
      <div className="pl-card__body">
        <div className="pl-card__header">
          <span className="pl-card__type-label">{typeMeta.label}</span>
          <span className="pl-card__date">{dateRange}</span>
          {record.totalDays > 1 && (
            <span className="pl-card__days">({record.totalDays}天)</span>
          )}
        </div>

        {record.studentName && (
          <p className="pl-card__student">
            🧒 {record.studentName}
          </p>
        )}

        {record.reason && (
          <p className="pl-card__reason">{record.reason}</p>
        )}

        {teacherComment && record.status === 'rejected' && (
          <p className="pl-card__comment">
            <span className="pl-card__comment-label">拒绝理由: </span>
            {teacherComment}
          </p>
        )}

        {record.classTeacherName && (
          <p className="pl-card__teacher">班主任: {record.classTeacherName}</p>
        )}
      </div>

      {/* ── 右侧：状态 + 操作 ── */}
      <div className="pl-card__actions">
        <LeaveStatusBadge status={record.status} />

        {canCancel && onCancel && (
          <button
            className="pl-card__cancel-btn"
            onClick={() => onCancel(record.id)}
            disabled={isCancelling}
            title="撤回请假申请"
          >
            {isCancelling ? '撤回中…' : '撤回'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LeaveCard;
