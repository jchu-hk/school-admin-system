import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, BookOpen, TrendingUp, Activity, AlertCircle, RefreshCw } from 'lucide-react'
import dashboardApi, { DashboardStats, AttendanceTrend } from '../api/dashboard'
import { useI18n } from '../i18n'
import { getToken } from '../utils/tokenService'

type Period = 'week' | 'month'
type Tab = 'analytics' | 'agents'

export default function Dashboard() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) === 'agents' ? 'agents' : 'analytics'
  )
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('week')
  const [trendData, setTrendData] = useState<AttendanceTrend[]>([])

  // --- Agent Dashboard state ---
  const [agentHtml, setAgentHtml] = useState<string | null>(null)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [agentLastRefresh, setAgentLastRefresh] = useState<Date | null>(null)

  const fetchAgentDashboard = useCallback(async () => {
    setAgentLoading(true)
    setAgentError(null)
    try {
      const resp = await fetch('/school-admin/multi-agent-dashboard.html', {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const text = await resp.text()
      // Strip Coze page editor wrapper scripts if injected
      const cleaned = text
        .replace(/<script\s+src="https:\/\/lf-cdn\.coze\.cn\/obj\/unpkg\/coze-space\/[^"]*"><\/script>/g, '')
        .replace(/<script\s+src="https:\/\/lf-cdn\.coze\.cn\/obj\/unpkg\/coze-webapp\/[^"]*"><\/script>/g, '')
      setAgentHtml(cleaned)
      setAgentLastRefresh(new Date())
    } catch (e: any) {
      setAgentError(e.message || 'Failed to load agent dashboard')
    } finally {
      setAgentLoading(false)
    }
  }, [])

  // Auto-refresh agent dashboard every 30s when tab is active
  useEffect(() => {
    if (activeTab !== 'agents') return
    if (!agentHtml) {
      fetchAgentDashboard()
    }
    const interval = setInterval(fetchAgentDashboard, 30_000)
    return () => clearInterval(interval)
  }, [activeTab, fetchAgentDashboard, agentHtml])

  // Load analytics stats
  useEffect(() => {
    const token = getToken()
    if (!token) { window.location.href = '/login'; return }
    
    dashboardApi.getStats()
      .then(data => { 
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

  useEffect(() => {
    dashboardApi.getAttendanceTrend(period)
      .then(data => {
        if (Array.isArray(data)) {
          setTrendData(data)
        } else {
          setTrendData([])
        }
      })
      .catch(console.error)
  }, [period])

  // Stats
  const studentCount = stats?.studentCount ?? 0
  const attendanceRate = stats?.todayAttendance?.attendanceRate ?? 0
  const totalStudents = studentCount
  const presentCount = stats?.todayAttendance?.present ?? 0
  const absentCount = stats?.todayAttendance?.absent ?? 0
  const lateCount = stats?.todayAttendance?.late ?? 0
  const leaveCount = stats?.todayAttendance?.leave ?? 0
  const pendingInquiries = stats?.pendingInquiries ?? 0
  const pendingLeaves = stats?.monthlyLeave?.pending ?? 0

  const pieData = [
    { name: t.dashboard.attendance || '出勤', value: attendanceRate },
    { name: t.dashboard.absence || '缺勤', value: 100 - attendanceRate },
  ]
  const COLORS = ['#22c55e', '#ef4444']

  const statCards = [
    { label: t.dashboard.totalStudents || '学生总数', value: totalStudents, icon: Users, lightColor: 'bg-blue-500' },
    { label: t.dashboard.todayAttendance || '今日出勤', value: `${attendanceRate}%`, icon: Activity, lightColor: 'bg-green-500' },
    { label: t.dashboard.pendingInquiries || '待处理查询', value: pendingInquiries, icon: AlertCircle, lightColor: 'bg-orange-500' },
    { label: t.dashboard.pendingLeaves || '待审批请假', value: pendingLeaves, icon: BookOpen, lightColor: 'bg-purple-500' },
  ]

  const attendanceDetails = [
    { label: t.dashboard.presentCount, value: presentCount, color: 'text-green-600' },
    { label: t.dashboard.lateCount, value: lateCount, color: 'text-yellow-600' },
    { label: t.dashboard.earlyLeaveCount, value: leaveCount, color: 'text-blue-600' },
    { label: t.dashboard.absentCount, value: absentCount, color: 'text-red-600' },
  ]

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">{t.dashboard.title || '仪表盘'}</h2>
        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${activeTab === 'analytics' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📊 {t.dashboard.title || 'Analytics'}
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${activeTab === 'agents' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🤖 Agents
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <>
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

          {/* 出勤详情卡片 */}
          <div className="bg-white rounded-xl shadow-card p-4 md:p-5">
            <h3 className="font-semibold mb-3 text-gray-700 text-sm md:text-base">{t.dashboard.dailyDetail}</h3>
            <div className="grid grid-cols-4 gap-4">
              {attendanceDetails.map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-2xl md:text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-gray-500 text-xs md:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow-card p-4 md:p-5">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="font-semibold text-gray-700 text-sm md:text-base">{t.dashboard.weeklyTrend || '出勤趋势'}</h3>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setPeriod('week')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${period === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t.dashboard.sevenDays || '7天'}
                  </button>
                  <button
                    onClick={() => setPeriod('month')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${period === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t.dashboard.thirtyDays || '30天'}
                  </button>
                </div>
              </div>
              <div className="h-[180px] md:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData.map(d => ({ name: d?.date?.slice(5) || '', present: d?.present || 0, late: d?.late || 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} tick={{ fontSize: 10 }} />
                    <YAxis fontSize={10} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ fontSize: '12px', padding: '8px 12px', borderRadius: '8px' }}
                      formatter={(value, name) => [value, name === 'present' ? t.dashboard.presentCount : t.dashboard.lateCount]}
                    />
                    <Bar dataKey="present" name="present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" name="late" fill="#eab308" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-card p-4 md:p-5">
              <h3 className="font-semibold mb-3 md:mb-4 text-gray-700 text-sm md:text-base">{t.dashboard.todayOverview || '今日概览'}</h3>
              <div className="h-[180px] md:h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                      dataKey="value" 
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px', padding: '8px 12px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-500">{t.dashboard.attendance || '出勤'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-500">{t.dashboard.absence || '缺勤'}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Agent Dashboard tab */
        <div className="agent-dashboard-page">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700">🤖 Multi-Agent Status</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {agentLastRefresh && (
                <span>Updated: {agentLastRefresh.toLocaleTimeString('zh-CN', { hour12: false })}</span>
              )}
              <button
                onClick={fetchAgentDashboard}
                disabled={agentLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition text-sm"
              >
                <RefreshCw size={14} className={agentLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {agentLoading && !agentHtml && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}

          {agentError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              ⚠️ {agentError}
              <button onClick={fetchAgentDashboard} className="ml-4 underline">Retry</button>
            </div>
          )}

          {agentHtml && (
            <div className="dashboard-embed" dangerouslySetInnerHTML={{ __html: agentHtml }} />
          )}
        </div>
      )}
    </div>
  )
}
