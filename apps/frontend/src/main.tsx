import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import QrDisplayPage from './pages/attendance/qr-display/QrDisplayPage';
import QrScanPage from './pages/attendance/qr-scan/QrScanPage';
import ParentPortalLayout from './pages/portal/parent/ParentPortalLayout';
import ChildProfilePage from './pages/portal/parent/ChildProfilePage';
import ParentLeavePage from './pages/portal/parent/ParentLeavePage';
import NotificationCenter from './pages/portal/parent/NotificationCenter';
import AccountSettings from './pages/portal/parent/AccountSettings';
import StudentPortalLayout from './pages/portal/student/StudentPortalLayout';
import StudentDashboard from './pages/portal/student/StudentDashboard';
import StudentProfilePage from './pages/portal/student/profile/StudentProfilePage';
import StudentLeavePage from './pages/portal/student/leave/StudentLeavePage';
import LoginPage from './pages/login/LoginPage';
import './pages/portal/student/leave/leave.css';
import './styles/qr-display.css';
import './pages/portal/parent/parent-portal.css';
import './pages/portal/parent/leave/leave.css';
import './styles/portal-student.css';
import './styles/login.css';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="portal-dashboard">
    <div className="portal-dashboard__header">
      <h1 className="portal-dashboard__greeting">{title}</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
        此页面正在建设中…
      </p>
    </div>
  </div>
);

/**
 * RequireAuth — 路由守卫组件
 * 如果 localStorage 中没有有效的 auth_token，重定向到登录页。
 * 登录完成后会跳转回来源 URL。
 */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('auth_token');

  if (!token) {
    // 保存当前路径作为登录后的跳转目标
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── 登录页（公开） ── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── QR考勤展示页（学生扫码展示，需要登录） ── */}
        <Route
          path="/attendance/qr"
          element={
            <RequireAuth>
              <QrDisplayPage />
            </RequireAuth>
          }
        />

        {/* ── QR考勤扫码页（教职工扫码签到，公开页面） ── */}
        <Route
          path="/attendance/scan"
          element={<QrScanPage />}
        />

        {/* ── 家长门户（需要登录） ── */}
        <Route
          path="/portal/parent"
          element={
            <RequireAuth>
              <ParentPortalLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="children" replace />} />
          <Route path="children" element={<ChildProfilePage />} />
          <Route path="leaves" element={<ParentLeavePage />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        {/* ── 学生门户（需要登录） ── */}
        <Route
          path="/portal/student"
          element={
            <RequireAuth>
              <StudentPortalLayout />
            </RequireAuth>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="leave" element={<StudentLeavePage />} />
          <Route path="attendance" element={<PlaceholderPage title="签到记录" />} />
          <Route path="notification" element={<PlaceholderPage title="通知中心" />} />
          <Route path="settings" element={<PlaceholderPage title="账户设置" />} />
        </Route>

        {/* 兼容旧路由 */}
        <Route path="/portal/profile" element={<Navigate to="/portal/student/profile" replace />} />

        {/* 默认重定向到登录页 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
