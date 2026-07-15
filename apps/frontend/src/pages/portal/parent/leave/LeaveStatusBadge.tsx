/**
 * LeaveStatusBadge — 请假状态徽章（家长版）
 *
 * 复用 T17 样式逻辑，集成家长门户设计系统。
 * 展示请假申请当前状态，包含状态图标和文字标签。
 */

import React from 'react';
import type { LeaveStatus } from './api';

// ── Props ────────────────────────────────────────────────

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
}

// ── Status Config ────────────────────────────────────────

interface StatusConfig {
  label: string;
  icon: string;
  className: string;
}

const STATUS_CONFIG: Record<LeaveStatus, StatusConfig> = {
  pending: {
    label: '待审批',
    icon: '⏳',
    className: 'badge--pending',
  },
  pending_director: {
    label: '待校务主任审批',
    icon: '⏳',
    className: 'badge--pending-director',
  },
  approved: {
    label: '已批准',
    icon: '✅',
    className: 'badge--approved',
  },
  rejected: {
    label: '已拒绝',
    icon: '❌',
    className: 'badge--rejected',
  },
  cancelled: {
    label: '已撤回',
    icon: '↩️',
    className: 'badge--cancelled',
  },
  checked_in: {
    label: '已销假',
    icon: '✔️',
    className: 'badge--checked-in',
  },
};

// ── Component ────────────────────────────────────────────

const LeaveStatusBadge: React.FC<LeaveStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return (
      <span className="pl-badge pl-badge--unknown">未知</span>
    );
  }

  return (
    <span className={`pl-badge ${config.className}`}>
      <span className="pl-badge__icon">{config.icon}</span>
      <span className="pl-badge__label">{config.label}</span>
    </span>
  );
};

export default LeaveStatusBadge;
