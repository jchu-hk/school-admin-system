import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, BookOpen, TrendingUp, Activity } from 'lucide-react'
import dashboardApi, { DashboardStats, AttendanceTrend } from '../api/dashboard'
import { useI18n } from '../i18n'

type Period = 'week' | 'month'

export default function Dashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<DashboardStats>({ students: 0, teachers: 0, courses: 0, attendance: 0 })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('week')
  const [trendData, setTrendData] = useState<AttendanceTrend[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { window.location.href = '/login'; return }
    
    dashboardApi.getStats()
      .then(data => { 
        // 防御性编程：确保数据有效
        if (data && typeof data === 'object') {
          setStats(data)
        } else {
          console.warn('Dashboard stats returned invalid data:', data)
        }
        setLoading(false) 
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err)
        setLoading(false)
      })
  }, [])

  // 加载出勤趋势数据，支持 period 切换
  useEffect(() => {
    dashboardApi.getAttendanceTrend(period)
      .then(data => {
        // 防御性编程：确保数据是数组
        if (Array.isArray(data)) {
          setTrendData(data)
        } else {
          console.warn('Attendance trend returned invalid data:', data)
          setTrendData([])
        }
      })
      .catch((err) => {
        console.error('Failed to load attendance trend:', err)
        setTrendData([])
      })
  }, [period])

  // 防御性编程：确保attendance有有效值
  const attendanceValue = stats?.attendance ?? 0
  const pieData = [
    { name: t.dashboard.attendance, value: attendanceValue },
    { name: t.dashboard.absence, value: 100 - attendanceValue },
  ]
  const COLORS = ['#22c55e', '#ef4444']

  const statCards = [
    { label: t.dashboard.totalStudents, value: stats?.students ?? 0, icon: Users, lightColor: 'bg-blue-500' },
    { label: t.dashboard.totalTeachers, value: stats?.teachers ?? 0, icon: BookOpen, lightColor: 'bg-green-500' },
    { label: t.dashboard.totalCourses, value: stats?.courses ?? 0, icon: TrendingUp, lightColor: 'bg-purple-500' },
    { label: t.dashboard.todayAttendance, value: `${attendanceValue}%`, icon: Activity, lightColor: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800">{t.dashboard.title}</h2>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map(({ label, value, icon: Icon, lightColor }) => (
          <div 
            key={label} 
            className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-4 md:p-5 flex items-center gap-3 md:gap-4 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className={`${lightColor} text-white p-2.5 md:p-3 rounded-lg`}>
              <Icon size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
              <p className="text-gray-500 text-xs md:text-sm">{label}</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800">{loading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="font-semibold text-gray-700 text-sm md:text-base">{t.dashboard.weeklyTrend}</h3>
            {/* 7天/30天切换 */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${period === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.dashboard.sevenDays}
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${period === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.dashboard.thirtyDays}
              </button>
            </div>
          </div>
          <div className="h-[180px] md:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(trendData || []).map(d => ({ name: d?.name || '', v: d?.value || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} tick={{ fontSize: 10 }} />
                <YAxis fontSize={10} domain={[80, 100]} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="v" fill="#1E40AF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-4 md:p-5">
          <h3 className="font-semibold mb-3 md:mb-4 text-gray-700 text-sm md:text-base">{t.dashboard.todayOverview}</h3>
          <div className="h-[180px] md:h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData || []} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40} 
                  outerRadius={60}
                  dataKey="value" 
                  label={({ name, percent }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(pieData || []).map((_, i) => <Cell key={i} fill={COLORS[i % (COLORS?.length || 1)]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    fontSize: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* 移动端快捷操作 */}
      <div className="lg:hidden mt-4">
        <h3 className="font-semibold mb-3 text-gray-700 text-sm">{t.dashboard.quickActions}</h3>
        <div className="grid grid-cols-1 gap-2">
          <button className="w-full bg-primary-800 hover:bg-primary-900 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 active:scale-[0.98]">
            <Users size={18} />
            <span>{t.dashboard.addStudent}</span>
          </button>
          <button className="w-full bg-primary-800 hover:bg-primary-900 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 active:scale-[0.98]">
            <BookOpen size={18} />
            <span>{t.dashboard.addCourse}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
