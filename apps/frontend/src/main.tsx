import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import QrDisplayPage from './pages/attendance/qr-display/QrDisplayPage';
import ParentPortalLayout from './pages/portal/parent/ParentPortalLayout';
import ChildProfilePage from './pages/portal/parent/ChildProfilePage';
import ParentLeavePage from './pages/portal/parent/ParentLeavePage';
import NotificationCenter from './pages/portal/parent/NotificationCenter';
import AccountSettings from './pages/portal/parent/AccountSettings';
import StudentPortalLayout from './pages/portal/student/StudentPortalLayout';
import StudentDashboard from './pages/portal/student/StudentDashboard';
import StudentProfilePage from './pages/portal/student/profile/StudentProfilePage';
import StudentLeavePage from './pages/portal/student/leave/StudentLeavePage';
import './pages/portal/student/leave/leave.css';
import './styles/qr-display.css';
import './pages/portal/parent/parent-portal.css';
import './pages/portal/parent/leave/leave.css';
import './styles/portal-student.css';

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* QR考勤展示页 — 学生入口 */}
        <Route path="/attendance/qr" element={<QrDisplayPage />} />

        {/* 家长门户 */}
        <Route path="/portal/parent" element={<ParentPortalLayout />}>
          <Route index element={<Navigate to="children" replace />} />
          <Route path="children" element={<ChildProfilePage />} />
          <Route path="leaves" element={<ParentLeavePage />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        {/* 学生门户 — 带侧边栏的布局路由 */}
        <Route path="/portal/student" element={<StudentPortalLayout />}>
          {/* 默认首页 — 概览卡片 */}
          <Route index element={<StudentDashboard />} />
          {/* 个人档案 */}
          <Route path="profile" element={<StudentProfilePage />} />
          {/* 请假管理 */}
          <Route path="leave" element={<StudentLeavePage />} />
          {/* 占位页面（由后续任务 T16/T17 实现完整页面） */}
          <Route path="attendance" element={<PlaceholderPage title="签到记录" />} />
          <Route path="notification" element={<PlaceholderPage title="通知中心" />} />
          <Route path="settings" element={<PlaceholderPage title="账户设置" />} />
        </Route>

        {/* 兼容旧路由 */}
        <Route path="/portal/profile" element={<Navigate to="/portal/student/profile" replace />} />

        {/* 默认重定向到 QR 考勤页 */}
        <Route path="*" element={<Navigate to="/attendance/qr" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
