import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MenuItem } from './api';

// ── Icons map (lightweight emoji fallback) ───────────────

const ICON_MAP: Record<string, string> = {
  dashboard: '📊',
  profile: '👤',
  attendance: '📋',
  leave: '📝',
  notification: '🔔',
  settings: '⚙️',
};

function resolveIcon(icon: string): string {
  return ICON_MAP[icon] || icon || '📄';
}

// ── Props ────────────────────────────────────────────────

interface PortalSidebarProps {
  /** 菜单数据（已按角色过滤） */
  menus: MenuItem[];
  /** 是否收缩 */
  collapsed: boolean;
  /** 收缩切换回调 */
  onToggleCollapse: () => void;
  /** 导航后的回调（可用于移动端关闭侧边栏） */
  onNavigate?: () => void;
  /** 学生姓名（侧边栏顶部展示） */
  studentName?: string;
}

/**
 * PortalSidebar — 侧边菜单（按角色过滤）
 *
 * UI 原型 Section 20.2:
 * ┌──────────┐
 * │ 张三     │  ← 用户头像 + 姓名
 * │ 三年级一班 │
 * ├──────────┤
 * │ 👤 个人档案│  ← 当前激活高亮
 * │ 📝 请假管理│
 * │ …        │
 * └──────────┘
 *
 * 功能:
 * - 根据 menus 动态渲染菜单项
 * - 高亮当前路由对应的菜单项
 * - 支持收缩/展开（桌面端）
 * - Mobile 端默认隐藏（由外部控制）
 */
const PortalSidebar: React.FC<PortalSidebarProps> = ({
  menus,
  collapsed,
  onToggleCollapse,
  onNavigate,
  studentName,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // ── 当前激活的菜单 key ──
  const activeKey = menus.find(
    (m) =>
      location.pathname === m.path ||
      (m.children && m.children.some((c) => location.pathname === c.path)),
  )?.key;

  // ── 展开包含当前路由的父菜单 ──
  useEffect(() => {
    const parent = menus.find(
      (m) => m.children && m.children.some((c) => location.pathname === c.path),
    );
    if (parent) {
      setExpandedKeys((prev) => new Set(prev).add(parent.key));
    }
  }, [location.pathname, menus]);

  // ── 切换子菜单展开/收起 ──
  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // ── 处理菜单点击 ──
  const handleMenuClick = useCallback(
    (item: MenuItem) => {
      if (item.children && item.children.length > 0) {
        toggleExpand(item.key);
      } else {
        navigate(item.path);
        onNavigate?.();
      }
    },
    [navigate, onNavigate, toggleExpand],
  );

  // ── 空状态 ──
  if (!menus || menus.length === 0) {
    return (
      <aside
        className={`portal-sidebar ${collapsed ? 'portal-sidebar--collapsed' : ''}`}
      >
        {/* 用户信息 */}
        {!collapsed && (
          <div className="portal-sidebar__user">
            <div className="portal-sidebar__avatar">
              {studentName?.charAt(0) ?? '?'}
            </div>
            {!collapsed && (
              <div className="portal-sidebar__user-info">
                <div className="portal-sidebar__user-name">
                  {studentName ?? '学生'}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="portal-sidebar__empty">
          <span className="portal-sidebar__empty-icon">📭</span>
          <p className="portal-sidebar__empty-text">暂无可用菜单</p>
          <p className="portal-sidebar__empty-hint">
            请联系管理员开通门户访问权限
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`portal-sidebar ${collapsed ? 'portal-sidebar--collapsed' : ''}`}
    >
      {/* ── 用户信息 ── */}
      <div className="portal-sidebar__user">
        <div className="portal-sidebar__avatar">
          {studentName?.charAt(0) ?? '?'}
        </div>
        {!collapsed && (
          <div className="portal-sidebar__user-info">
            <div className="portal-sidebar__user-name">
              {studentName ?? '加载中…'}
            </div>
          </div>
        )}
      </div>

      {/* ── 收缩切换按钮 ── */}
      <button
        className="portal-sidebar__toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        title={collapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        {collapsed ? '▶' : '◀'}
      </button>

      {/* ── 导航菜单 ── */}
      <nav className="portal-sidebar__nav">
        <ul className="portal-sidebar__menu">
          {menus.map((item) => {
            const isActive = activeKey === item.key;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedKeys.has(item.key);

            return (
              <li
                key={item.key}
                className={`portal-sidebar__menu-item ${
                  isActive ? 'portal-sidebar__menu-item--active' : ''
                } ${hasChildren ? 'portal-sidebar__menu-item--parent' : ''}`}
              >
                {/* 菜单按钮 */}
                <button
                  className="portal-sidebar__menu-btn"
                  onClick={() => handleMenuClick(item)}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="portal-sidebar__menu-icon">
                    {resolveIcon(item.icon)}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="portal-sidebar__menu-label">
                        {item.label}
                      </span>
                      {hasChildren && (
                        <span
                          className={`portal-sidebar__menu-arrow ${
                            isExpanded
                              ? 'portal-sidebar__menu-arrow--open'
                              : ''
                          }`}
                        >
                          ▾
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* 子菜单 */}
                {hasChildren && isExpanded && !collapsed && (
                  <ul className="portal-sidebar__submenu">
                    {item.children!.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <li
                          key={child.key}
                          className={`portal-sidebar__submenu-item ${
                            isChildActive
                              ? 'portal-sidebar__submenu-item--active'
                              : ''
                          }`}
                        >
                          <button
                            className="portal-sidebar__submenu-btn"
                            onClick={() => {
                              navigate(child.path);
                              onNavigate?.();
                            }}
                          >
                            <span className="portal-sidebar__submenu-icon">
                              {resolveIcon(child.icon)}
                            </span>
                            <span className="portal-sidebar__submenu-label">
                              {child.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default PortalSidebar;
