import React from 'react';
import type { LeaveStatus as LeaveStatusEnum } from './api';

// ── Props ────────────────────────────────────────────────

interface LeaveStatusBadgeProps {
  /** 请假状态 */
  status: LeaveStatusEnum;
}

// ── Status Config ────────────────────────────────────────

interface StatusConfig {
  label: string;
  icon: string;
  className: string;
}

const statusConfigMap: Record<LeaveStatusEnum, StatusConfig> = {
  pending: {
    label: '待审批',
    icon: '⏳',
    className: 'leave-status-badge--pending',
  },
  pending_director: {
    label: '待校务主任审批',
    icon: '⏳',
    className: 'leave-status-badge--pending-director',
  },
  approved: {
    label: '已批准',
    icon: '✅',
    className: 'leave-status-badge--approved',
  },
  rejected: {
    label: '已拒绝',
    icon: '❌',
    className: 'leave-status-badge--rejected',
  },
  cancelled: {
    label: '已撤回',
    icon: '↩️',
    className: 'leave-status-badge--cancelled',
  },
  checked_in: {
    label: '已销假',
    icon: '✔️',
    className: 'leave-status-badge--checked-in',
  },
};

// ── Component ────────────────────────────────────────────

/**
 * LeaveStatusBadge — 请假状态徽章
 *
 * 展示请假申请当前状态的徽章组件，包含状态图标和文字标签。
 * 支持 6 种状态样式:
 *   - pending: 待审批（黄色）
 *   - pending_director: 待校务主任审批（橙色）  
 *   - approved: 已批准（绿色）
 *   - rejected: 已拒绝（红色）
 *   - cancelled: 已撤回（灰色）
 *   - checked_in: 已销假（蓝色）
 */
const LeaveStatusBadge: React.FC<LeaveStatusBadgeProps> = ({ status }) => {
  const config = statusConfigMap[status];

  if (!config) {
    return (
      <span className="leave-status-badge leave-status-badge--unknown">
        未知
      </span>
    );
  }

  return (
    <span className={`leave-status-badge ${config.className}`}>
      <span className="leave-status-badge__icon">{config.icon}</span>
      <span className="leave-status-badge__label">{config.label}</span>
    </span>
  );
};

export default LeaveStatusBadge;
