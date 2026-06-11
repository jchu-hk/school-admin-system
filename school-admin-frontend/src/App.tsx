import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentPage from './pages/StudentPage'
import LeavePage from './pages/LeavePage'
import InquiryPage from './pages/InquiryPage'
import NotificationPage from './pages/NotificationPage'
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
            <Route path="leaves" element={<LeavePage />} />
            <Route path="inquiries" element={<InquiryPage />} />
            <Route path="notifications" element={<NotificationPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
