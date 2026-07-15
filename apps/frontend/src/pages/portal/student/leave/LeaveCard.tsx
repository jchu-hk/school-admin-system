import React from 'react';
import type { LeaveRecord } from './api';
import LeaveStatusBadge from './LeaveStatusBadge';

// ── Leave Type Config ────────────────────────────────────

const leaveTypeMeta: Record<string, { icon: string; label: string }> = {
  sick: { icon: '🤒', label: '病假' },
  personal: { icon: '🏠', label: '事假' },
  family: { icon: '👨‍👩‍👧‍👦', label: '家庭假' },
  other: { icon: '📄', label: '其他' },
};

function getLeaveTypeMeta(type: string) {
  return leaveTypeMeta[type] ?? { icon: '📄', label: type };
}

// ── Props ────────────────────────────────────────────────

interface LeaveCardProps {
  /** 请假记录 */
  record: LeaveRecord;
  /** 点击撤回的回调 */
  onCancel?: (id: string) => void;
  /** 是否正在执行撤回操作 */
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

  const startStr = fmt(start);
  const endStr = fmt(end);

  if (startStr === endStr) {
    return startStr;
  }
  return `${startStr}-${endStr}`;
}

/**
 * LeaveCard — 请假记录卡片
 *
 * 以卡片形式展示一条请假信息，包含:
 *   - 请假类型图标 + 类型名称
 *   - 日期范围 + 总天数
 *   - 请假原因（截断显示）
 *   - 状态徽章
 *   - 审批人/意见
 *   - 撤回按钮（仅待审批状态可见）
 */
const LeaveCard: React.FC<LeaveCardProps> = ({
  record,
  onCancel,
  isCancelling = false,
}) => {
  const typeMeta = getLeaveTypeMeta(record.leaveType);
  const dateRange = formatDateRange(record.startDate, record.endDate);
  const canCancel = record.status === 'pending' || record.status === 'pending_director';

  // 判断意见展示
  const teacherComment = record.approvalComment ?? record.directorComment;

  return (
    <div className="leave-card">
      {/* ── 左侧：类型图标 ── */}
      <div className="leave-card__type-icon">
        {typeMeta.icon}
      </div>

      {/* ── 中间：信息区 ── */}
      <div className="leave-card__body">
        {/* 第一行：类型 + 日期 */}
        <div className="leave-card__header">
          <span className="leave-card__type-label">{typeMeta.label}</span>
          <span className="leave-card__date">{dateRange}</span>
          {record.totalDays > 1 && (
            <span className="leave-card__days">({record.totalDays}天)</span>
          )}
        </div>

        {/* 请假原因 */}
        {record.reason && (
          <p className="leave-card__reason">{record.reason}</p>
        )}

        {/* 审批意见（仅拒绝时显示） */}
        {teacherComment && record.status === 'rejected' && (
          <p className="leave-card__comment">
            <span className="leave-card__comment-label">拒绝理由: </span>
            {teacherComment}
          </p>
        )}

        {/* 班主任信息 */}
        {record.classTeacherName && (
          <p className="leave-card__teacher">
            班主任: {record.classTeacherName}
          </p>
        )}
      </div>

      {/* ── 右侧：状态 + 操作 ── */}
      <div className="leave-card__actions">
        <LeaveStatusBadge status={record.status} />

        {canCancel && onCancel && (
          <button
            className="leave-card__cancel-btn"
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
