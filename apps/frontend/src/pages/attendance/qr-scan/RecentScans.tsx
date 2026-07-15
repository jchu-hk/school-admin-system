import React from 'react';
import type { RecentScan } from './useCameraScan';

/**
 * RecentScans — 最近签到列表
 *
 * 显示最近5条签到记录，每条记录包含：
 * - 状态图标（🟢 成功 / 🔵 重复 / 🔴 无效）
 * - 学生姓名 + 班级
 * - 签到时间
 *
 * 当列表为空时显示占位提示。
 */

interface RecentScansProps {
  /** 最近签到记录列表 */
  scans: RecentScan[];
  /** 是否加载中 */
  loading?: boolean;
}

/** 根据 result 类型返回状态图标和颜色 */
function getStatusBadge(result: string): { icon: string; bg: string; text: string } {
  switch (result) {
    case 'success':
      return { icon: '🟢', bg: 'bg-green-50', text: 'text-green-700' };
    case 'duplicate':
      return { icon: '🔵', bg: 'bg-blue-50', text: 'text-blue-700' };
    case 'invalid':
      return { icon: '🔴', bg: 'bg-red-50', text: 'text-red-700' };
    default:
      return { icon: '⚪', bg: 'bg-gray-50', text: 'text-gray-500' };
  }
}

/** 结果文本映射 */
function resultLabel(result: string): string {
  switch (result) {
    case 'success':
      return '签到成功';
    case 'duplicate':
      return '已签到(重复)';
    case 'invalid':
      return 'QR无效';
    default:
      return result;
  }
}

const RecentScans: React.FC<RecentScansProps> = ({ scans, loading = false }) => {
  return (
    <div className="mt-4">
      {/* 分隔标题 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400 tracking-wider">
          最近签到
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 列表内容 */}
      {scans.length === 0 && !loading && (
        <div className="text-center py-6">
          <svg
            className="w-10 h-10 mx-auto text-gray-300 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-400">暂无签到记录</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
        </div>
      )}

      {scans.length > 0 && (
        <ul className="space-y-1.5">
          {scans.map((scan, index) => {
            const badge = getStatusBadge(scan.result);
            return (
              <li
                key={scan.id || index}
                className={`
                  flex items-center justify-between px-3 py-2.5 rounded-lg
                  ${badge.bg} transition-colors duration-150
                `}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex-shrink-0 text-lg leading-none">
                    {badge.icon}
                  </span>
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
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.text} bg-white/60`}
                  >
                    {resultLabel(scan.result)}
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
