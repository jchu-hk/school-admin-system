import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import { fetchPortalMenus, fetchStudentProfile } from './api';
import type { MenuItem } from './api';

// ── Responsive breakpoint ─────────────────────────────────
const DESKTOP_BREAKPOINT = 768;

/**
 * StudentPortalLayout — 学生门户主框架
 *
 * 布局结构:
 * ┌──────────────┬──────────────────────────────────┐
 * │              │                                  │
 * │   Sidebar    │         Content Area             │
 * │  (导航菜单)   │       (Outlet: 子页面)           │
 * │              │                                  │
 * ├──────────────┴──────────────────────────────────┤
 * │          Mobile Tab Bar (仅 < 768px)             │
 * └──────────────────────────────────────────────────┘
 *
 * 桌面 (≥768px): 左侧收缩式侧边栏 + 右侧内容区
 * 移动 (<768px): 底部 Tab Bar + 全屏内容区
 */
const StudentPortalLayout: React.FC = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [studentName, setStudentName] = useState<string | undefined>();
  const [studentClassName, setStudentClassName] = useState<
    string | undefined
  >();
  const [activeMobileTab, setActiveMobileTab] = useState<string>('');

  // ── 检查屏幕宽度 ──
  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < DESKTOP_BREAKPOINT);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // ── 加载菜单 + 用户信息 ──
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 并行请求菜单和用户信息
        const [menuData, profile] = await Promise.all([
          fetchPortalMenus(),
          fetchStudentProfile(),
        ]);

        if (cancelled) return;

        setMenus(menuData);
        if (profile) {
          setStudentName(profile.name);
          setStudentClassName(profile.class_name);
        }

        // 默认激活第一个菜单
        if (menuData.length > 0) {
          const firstItem = menuData[0];
          const targetPath =
            firstItem.children && firstItem.children.length > 0
              ? firstItem.children[0].path
              : firstItem.path;
          navigate(targetPath, { replace: true });
          setActiveMobileTab(firstItem.key);
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : '加载门户菜单失败';
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 收缩切换 ──
  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  // ── Mobile Tab Bar 点击 ──
  const handleMobileTabClick = useCallback(
    (item: MenuItem) => {
      setActiveMobileTab(item.key);
      const targetPath =
        item.children && item.children.length > 0
          ? item.children[0].path
          : item.path;
      navigate(targetPath);
    },
    [navigate],
  );

  // ── 当前激活的菜单 key 用于 Mobile Tab ──
  const activeMenuKey = useMemo(() => {
    if (activeMobileTab) return activeMobileTab;
    return menus.length > 0 ? menus[0].key : '';
  }, [activeMobileTab, menus]);

  // ── Loading 状态 ──
  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-loading__spinner" />
        <p className="portal-loading__text">门户加载中…</p>
      </div>
    );
  }

  // ── 错误状态 ──
  if (error) {
    return (
      <div className="portal-error">
        <span className="portal-error__icon">⚠️</span>
        <p className="portal-error__text">{error}</p>
        <button
          className="portal-error__retry"
          onClick={() => window.location.reload()}
        >
          重新加载
        </button>
      </div>
    );
  }

  // ── 空菜单状态 ──
  if (menus.length === 0) {
    return (
      <div className="portal-layout portal-layout--empty">
        <StudentSidebar
          menus={[]}
          collapsed={false}
          onToggleCollapse={handleToggleCollapse}
          studentName={studentName}
          studentClassName={studentClassName}
        />
        <main className="portal-content">
          <div className="portal-content__empty">
            <span className="portal-content__empty-icon">📭</span>
            <p className="portal-content__empty-text">暂无可用菜单</p>
            <p className="portal-content__empty-hint">
              请联系管理员开通门户访问权限
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`portal-layout ${collapsed ? 'portal-layout--collapsed' : ''}`}
    >
      {/* ── 桌面侧边栏 ── */}
      {!isMobile && (
        <StudentSidebar
          menus={menus}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          studentName={studentName}
          studentClassName={studentClassName}
        />
      )}

      {/* ── 主内容区 ── */}
      <main className="portal-content">
        <Outlet />
      </main>

      {/* ── Mobile 底部 Tab Bar ── */}
      {isMobile && (
        <nav className="portal-tabbar">
          {menus.map((item) => {
            const isActive = activeMenuKey === item.key;
            return (
              <button
                key={item.key}
                className={`portal-tabbar__tab ${
                  isActive ? 'portal-tabbar__tab--active' : ''
                }`}
                onClick={() => handleMobileTabClick(item)}
              >
                <span className="portal-tabbar__tab-icon">
                  {item.icon || '📄'}
                </span>
                <span className="portal-tabbar__tab-label">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default StudentPortalLayout;
