import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentPage from './pages/StudentPage'
import UserPage from './pages/UserPage'
import LeavePage from './pages/LeavePage'
import InquiryPage from './pages/InquiryPage'
import NotificationPage from './pages/NotificationPage'
import CourseManagementPage from './pages/CourseManagementPage'
import SystemSettingsPage from './pages/SystemSettingsPage'
import FinanceTuitionPage from './pages/FinanceTuitionPage'
import FinanceFeePage from './pages/FinanceFeePage'
import FinanceScholarshipPage from './pages/FinanceScholarshipPage'
import AttendancePage from './pages/AttendancePage'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { getToken } from './utils/tokenService'
import { setGlobalNavigate } from './api/client'

// 路由守卫组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  useEffect(() => {
    // 设置全局 navigate 函数供 apiClient 使用
    setGlobalNavigate(navigate)
  }, [navigate])

  if (!getToken()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<StudentPage />} />
            <Route path="users" element={<UserPage />} />
            <Route path="leaves" element={<LeavePage />} />
            <Route path="inquiries" element={<InquiryPage />} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="courses" element={<CourseManagementPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
            <Route path="finance/tuition" element={<FinanceTuitionPage />} />
            <Route path="finance/fee" element={<FinanceFeePage />} />
            <Route path="finance/scholarship" element={<FinanceScholarshipPage />} />
            <Route path="attendance" element={<AttendancePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
