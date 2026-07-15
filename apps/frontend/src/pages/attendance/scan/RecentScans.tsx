import React from 'react';
import type { RecentScan } from './useQrScanner';

/**
 * RecentScans — 最近签到记录列表
 *
 * 显示最近5条记录，支持三种状态:
 * - success  🟢: 签到成功
 * - duplicate 🔵: 重复签到
 * - invalid   🔴: 无效QR
 */

interface RecentScansProps {
  scans: RecentScan[];
  loading?: boolean;
}

// ── 状态视觉映射 ──

interface StatusBadge {
  icon: string;
  bgClass: string;
  label: string;
}

const STATUS_MAP: Record<string, StatusBadge> = {
  success: {
    icon: '🟢',
    bgClass: 'bg-green-50',
    label: '签到成功',
  },
  duplicate: {
    icon: '🔵',
    bgClass: 'bg-blue-50',
    label: '已签到(重复)',
  },
  invalid: {
    icon: '🔴',
    bgClass: 'bg-red-50',
    label: 'QR无效',
  },
};

const DEFAULT_BADGE: StatusBadge = {
  icon: '⚪',
  bgClass: 'bg-gray-50',
  label: '未知',
};

const RecentScans: React.FC<RecentScansProps> = ({ scans, loading = false }) => {
  return (
    <div className="mt-4">
      {/* 分隔线 + 标题 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400 tracking-wider">
          最近签到
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 空态 */}
      {scans.length === 0 && !loading && (
        <div className="text-center py-6">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-400">暂无签到记录</p>
        </div>
      )}

      {/* 加载态 */}
      {loading && (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* 列表 */}
      {scans.length > 0 && (
        <ul className="space-y-1.5">
          {scans.map((scan, idx) => {
            const badge = STATUS_MAP[scan.result] || DEFAULT_BADGE;
            return (
              <li
                key={scan.id || idx}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${badge.bgClass}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex-shrink-0 text-lg leading-none">{badge.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {scan.student_name}
                    </p>
                    {scan.class_name && (
                      <p className="text-xs text-gray-400 truncate">
                        {scan.class_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-gray-400">{scan.time}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/60 text-gray-600">
                    {badge.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecentScans;
