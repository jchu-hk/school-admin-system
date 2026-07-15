import React from 'react';
import { useNavigate } from 'react-router-dom';

// ── Props ────────────────────────────────────────────────

interface PortalHeaderProps {
  /** 学生姓名 */
  studentName?: string;
  /** 班级名称 */
  studentClassName?: string;
  /** 学校 Logo URL（可选），默认使用文字占位 */
  schoolLogoUrl?: string;
}

/**
 * PortalHeader — 学生门户顶部导航
 *
 * UI 原型 Section 20.1:
 * ┌─────────────────────────────────────────────────────────┐
 * │  🏫 阳光小学    👤 张三 (三年级一班)    [student]   退出 │
 * └─────────────────────────────────────────────────────────┘
 *
 * - 左侧: 学校 logo + 名称
 * - 中间: 学生姓名 + 班级
 * - 右侧: 角色标签 + 登出按钮
 *
 * 设计:
 * - 固定高度 56px
 * - 浅色背景 + 底部阴影分割线
 * - 右侧紧凑排列
 */
const PortalHeader: React.FC<PortalHeaderProps> = ({
  studentName,
  studentClassName,
  schoolLogoUrl,
}) => {
  const navigate = useNavigate();

  // ── 登出 ──────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  return (
    <header className="portal-header">
      {/* ── 左侧: 学校标识 ── */}
      <div className="portal-header__left">
        {schoolLogoUrl ? (
          <img
            className="portal-header__logo"
            src={schoolLogoUrl}
            alt="学校 Logo"
          />
        ) : (
          <span className="portal-header__logo-fallback">🏫</span>
        )}
        <span className="portal-header__school-name">阳光小学</span>
      </div>

      {/* ── 中间分隔线（仅桌面） ── */}
      <div className="portal-header__divider" />

      {/* ── 右侧: 用户信息 + 角色标签 + 登出 ── */}
      <div className="portal-header__right">
        <div className="portal-header__user">
          <span className="portal-header__user-avatar">
            {studentName?.charAt(0) ?? '?'}
          </span>
          <div className="portal-header__user-info">
            <span className="portal-header__user-name">
              {studentName ?? '加载中…'}
            </span>
            {studentClassName && (
              <span className="portal-header__user-class">
                {studentClassName}
              </span>
            )}
          </div>
        </div>

        {/* ── 角色标签 ── */}
        <span className="portal-header__role-badge">student</span>

        {/* ── 登出按钮 ── */}
        <button
          className="portal-header__logout-btn"
          onClick={handleLogout}
          title="退出登录"
        >
          退出
        </button>
      </div>
    </header>
  );
};

export default PortalHeader;
