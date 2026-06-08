import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, GraduationCap, Calendar, MessageCircle, Bell } from 'lucide-react'

const navItems = [
  { label: '仪表盘', icon: LayoutDashboard, path: '/dashboard' },
  { label: '学生管理', icon: Users, path: '/students' },
  { label: '请假管理', icon: Calendar, path: '/leaves' },
  { label: '家长查询', icon: MessageCircle, path: '/inquiries' },
  { label: '通知管理', icon: Bell, path: '/notifications' },
  { label: '课程管理', icon: BookOpen, path: '/courses' },
  { label: '系统设置', icon: Settings, path: '/settings' },
]

export default function Layout() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (!token) { window.location.href = '/login'; return null }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-5 border-b flex items-center gap-3">
          <GraduationCap className="text-blue-600" size={28} />
          <span className="font-bold text-gray-800">智慧校园</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ label, icon: Icon, path }) => (
            <button key={path} onClick={() => navigate(path)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition">
            <LogOut size={20} />
            退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
