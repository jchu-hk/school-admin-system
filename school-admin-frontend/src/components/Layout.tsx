import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, GraduationCap, Calendar, MessageCircle, Bell, UserCog } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import { useI18n } from '../i18n'
import { getToken, removeToken } from '../utils/tokenService'

export default function Layout() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const token = getToken()

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  if (!token) { navigate('/login', { replace: true }); return null }

  const navItems = [
    { label: t.nav.dashboard, icon: LayoutDashboard, path: '/dashboard' },
    { label: t.nav.studentManagement, icon: Users, path: '/students' },
    { label: t.nav.userManagement, icon: UserCog, path: '/users' },
    { label: t.nav.leaveManagement, icon: Calendar, path: '/leaves' },
    { label: t.nav.parentInquiry, icon: MessageCircle, path: '/inquiries' },
    { label: t.nav.notificationManagement, icon: Bell, path: '/notifications' },
    { label: t.nav.courseManagement, icon: BookOpen, path: '/courses' },
    { label: t.nav.systemSettings, icon: Settings, path: '/settings' },
  ]

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
        <div className="p-4 border-t flex items-center justify-between">
          <LanguageSelector />
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition">
            <LogOut size={20} />
            {t.nav.logout}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
