import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentPage from './pages/StudentPage'
import LeavePage from './pages/LeavePage'
import InquiryPage from './pages/InquiryPage'
import NotificationPage from './pages/NotificationPage'
import Layout from './components/Layout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentPage />} />
          <Route path="leaves" element={<LeavePage />} />
          <Route path="inquiries" element={<InquiryPage />} />
          <Route path="notifications" element={<NotificationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
