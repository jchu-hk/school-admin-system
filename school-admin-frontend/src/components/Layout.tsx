import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, Info, GraduationCap, Calendar, MessageCircle, Bell, UserCog, DollarSign, ChevronDown, ClipboardCheck, Link2, Clock, FileText, Package } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import { useI18n } from '../i18n'
import { getToken, removeToken } from '../utils/tokenService'
import { getUserRole, removeUser } from '../utils/userService'
import { useState, useMemo } from 'react'

// Role hierarchy constants
const ROLE_SYSTEM_ADMIN = 'system_admin'
const ROLE_SCHOOL_DIRECTOR = 'school_director'
const ROLE_SCHOOL_STAFF = 'school_staff'
const ROLE_TEACHER = 'teacher'
const ROLE_PARENT = 'parent'
const ROLE_STUDENT = 'student'

export default function Layout() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const token = getToken()
  const [financeExpanded, setFinanceExpanded] = useState(false)
  const userRole = getUserRole()

  const handleLogout = () => {
    removeToken()
    removeUser()
    navigate('/login')
  }

  if (!token) { navigate('/login', { replace: true }); return null }

  // ============ Role-based menu filtering ============
  // Each menu item maps to the roles that can see it
  const allNavItems = [
    { label: t.nav.dashboard, icon: LayoutDashboard, path: '/dashboard', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF, ROLE_TEACHER, ROLE_PARENT, ROLE_STUDENT] },
    { label: t.nav.studentManagement, icon: Users, path: '/students', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
    { label: t.nav.attendance, icon: ClipboardCheck, path: '/attendance', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF, ROLE_TEACHER] },
    { label: t.nav.assetManagement, icon: Package, path: '/assets', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
    { label: t.nav.assetRentalManagement, icon: Package, path: '/asset-rentals', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
    { label: t.nav.userManagement, icon: UserCog, path: '/users', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR] },
    { label: t.nav.leaveManagement, icon: Calendar, path: '/leaves', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF, ROLE_TEACHER] },
    { label: t.nav.parentInquiry, icon: MessageCircle, path: '/inquiries', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF, ROLE_PARENT] },
    { label: t.nav.inquiryQueue, icon: Clock, path: '/inquiries/queue', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
    { label: t.nav.notificationManagement, icon: Bell, path: '/notifications', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF, ROLE_TEACHER] },
    { label: t.nav.courseManagement, icon: BookOpen, path: '/courses', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
    { label: t.nav.examManagement, icon: FileText, path: '/exams', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
    { label: t.nav.linkStudent, icon: Link2, path: '/link-student', roles: [ROLE_PARENT] },
  ]

  const allFinanceItems = [
    { label: t.nav.financeTuition, path: '/finance/tuition', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
    { label: t.nav.financeFee, path: '/finance/fee', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
    { label: t.nav.financeScholarship, path: '/finance/scholarship', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
    { label: t.nav.financeInstallment, path: '/finance/installment', roles: [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR, ROLE_SCHOOL_STAFF] },
  ]

  // Filter items based on user role
  const navItems = useMemo(
    () => allNavItems.filter(item => item.roles.includes(userRole || '')),
    [userRole]
  )

  const financeItems = useMemo(
    () => allFinanceItems.filter(item => item.roles.includes(userRole || '')),
    [userRole]
  )

  const canSeeFinance = financeItems.length > 0
  const canSeeSettings = [ROLE_SYSTEM_ADMIN, ROLE_SCHOOL_DIRECTOR].includes(userRole || '')
  const canSeeAbout = true // About is informational, show to everyone

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-5 border-b flex items-center gap-3">
          <GraduationCap className="text-blue-600" size={28} />
          <span className="font-bold text-gray-800">{t.nav.systemTitle}</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, icon: Icon, path }) => (
            <button key={path} onClick={() => navigate(path)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
              <Icon size={20} />
              {label}
            </button>
          ))}

          {/* 财政管理子菜单 (role-filtered) */}
          {canSeeFinance && (
            <div>
              <button
                onClick={() => setFinanceExpanded(!financeExpanded)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <DollarSign size={20} />
                <span className="flex-1 text-left">{t.nav.financeManagement}</span>
                <ChevronDown size={16} className={`transition-transform ${financeExpanded ? 'rotate-180' : ''}`} />
              </button>
              {financeExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {financeItems.map(({ label, path }) => (
                    <button
                      key={path}
                      onClick={() => navigate(path)}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
                    >
                      <span>•</span>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {canSeeSettings && (
            <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
              <Settings size={20} />
              {t.nav.systemSettings}
            </button>
          )}
          {canSeeAbout && (
            <button onClick={() => navigate('/about')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
              <Info size={20} />
              {t.nav.about}
            </button>
          )}
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
