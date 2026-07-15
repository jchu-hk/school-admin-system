/**
 * ParentPortalLayout — 家长门户主框架
 *
 * UI 原型 Section 21: 家长门户框架
 * - 顶部: 孩子切换器下拉菜单
 * - 侧边菜单: 我的孩子 / 请假管理 / 通知中心 / 账户设置
 * - 内容区: 通过 react-router Outlet 渲染子页面
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ChildSwitcher from './ChildSwitcher';
import type { PortalMenu, ChildInfo } from './api';
import { fetchPortalMenus } from './api';

// ── 图标映射 ────────────────────────────────────────────

const ICON_MAP: Record<string, string> = {
  '我的孩子': '📊',
  '请假管理': '📋',
  '通知中心': '🔔',
  '账户设置': '⚙️',
};

// 默认菜单（当 API 返回空或失败时使用）
const DEFAULT_MENUS: PortalMenu[] = [
  { id: '1', label: '我的孩子', icon: '📊', path: '/portal/parent/children' },
  { id: '2', label: '请假管理', icon: '📋', path: '/portal/parent/leaves' },
  { id: '3', label: '通知中心', icon: '🔔', path: '/portal/parent/notifications' },
  { id: '4', label: '账户设置', icon: '⚙️', path: '/portal/parent/settings' },
];

// 模拟孩子数据（后端未集成时使用）
const MOCK_CHILDREN: ChildInfo[] = [
  { id: 'stu-001', name: '张小玲', class_name: '三年级一班', student_id: '2024010101' },
  { id: 'stu-002', name: '张小强', class_name: '五年级二班', student_id: '2019010101' },
  { id: 'stu-003', name: '张小明', class_name: '三年级一班', student_id: '2024010123' },
];

const ParentPortalLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [menus, setMenus] = useState<PortalMenu[]>(DEFAULT_MENUS);
  const [childrenList, setChildrenList] = useState<ChildInfo[]>(MOCK_CHILDREN);
  const [currentChildId, setCurrentChildId] = useState<string>(
    MOCK_CHILDREN[0]?.id ?? '',
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── 加载菜单数据 ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetched = await fetchPortalMenus();
        if (!cancelled && fetched.length > 0) {
          setMenus(fetched);
        }
      } catch {
        // 使用默认菜单
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── 孩子切换 ────────────────────────────────────────────
  const handleChildChange = useCallback(
    (child: ChildInfo) => {
      setCurrentChildId(child.id);
    },
    [],
  );

  // ── 菜单点击导航 ──────────────────────────────────────
  const handleMenuClick = useCallback(
    (menu: PortalMenu) => {
      navigate(menu.path);
      // 移动端自动折叠侧边栏
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    },
    [navigate],
  );

  // ── 判断当前菜单是否激活 ──────────────────────────────
  const isMenuActive = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  const currentChild = childrenList.find((c) => c.id === currentChildId);

  return (
    <div className="parent-portal">
      {/* ── 顶部导航栏 ────────────────────────────── */}
      <header className="parent-portal__header">
        <div className="parent-portal__header-left">
          <button
            className="parent-portal__hamburger"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="切换菜单"
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
          <h1 className="parent-portal__title">家长门户</h1>
        </div>

        <div className="parent-portal__header-center">
          <ChildSwitcher
            childrenList={childrenList}
            currentChildId={currentChildId}
            onChange={handleChildChange}
          />
        </div>

        <div className="parent-portal__header-right">
          <span className="parent-portal__user-info">
            {currentChild ? `家长 - ${currentChild.name}` : '家长'}
          </span>
          <button
            className="parent-portal__logout"
            onClick={() => {
              localStorage.removeItem('auth_token');
              navigate('/login');
            }}
          >
            退出
          </button>
        </div>
      </header>

      <div className="parent-portal__body">
        {/* ── 侧边菜单 ────────────────────────────── */}
        <aside
          className={`parent-portal__sidebar ${sidebarCollapsed ? 'parent-portal__sidebar--collapsed' : ''}`}
        >
          <nav className="parent-portal__nav">
            {menus.map((menu) => (
              <button
                key={menu.id}
                className={`parent-portal__nav-item ${isMenuActive(menu.path) ? 'parent-portal__nav-item--active' : ''}`}
                onClick={() => handleMenuClick(menu)}
              >
                <span className="parent-portal__nav-icon">
                  {menu.icon || ICON_MAP[menu.label] || '📄'}
                </span>
                <span className="parent-portal__nav-label">{menu.label}</span>
                {menu.children && menu.children.length > 0 && (
                  <span className="parent-portal__nav-arrow">▸</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── 内容区域 ────────────────────────────── */}
        <main className="parent-portal__content">
          {loading ? (
            <div className="parent-portal__loading">
              <div className="parent-portal__spinner" />
              <p>加载中...</p>
            </div>
          ) : (
            <Outlet context={{ currentChildId, childrenList }} />
          )}
        </main>
      </div>
    </div>
  );
};

export default ParentPortalLayout;
