import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatCard } from '../components/ui/Card';
import { AttendanceTrendChart, ClassComparisonChart } from '../components/charts/AttendanceChart';
import { dashboardApi, DashboardStats, RecentActivity, AttendanceChartData, ClassAttendanceComparison } from '../api/dashboard';
import { CheckCircle, Clock, User, Bell, AlertCircle, TrendingUp, Activity, BarChart3 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceChartData[]>([]);
  const [classComparison, setClassComparison] = useState<ClassAttendanceComparison[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, activitiesRes, trendRes, comparisonRes] = await Promise.allSettled([
        dashboardApi.getStats(),
        dashboardApi.getRecentActivities(10),
        dashboardApi.getAttendanceTrend(7),
        dashboardApi.getClassComparison(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      if (activitiesRes.status === 'fulfilled') {
        setRecentActivities(activitiesRes.value.data);
      }

      if (trendRes.status === 'fulfilled') {
        setAttendanceTrend(trendRes.value.data);
      }

      if (comparisonRes.status === 'fulfilled') {
        setClassComparison(comparisonRes.value.data);
      }
    } catch (err: any) {
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'attendance':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'leave':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'inquiry':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'notification':
        return <Bell className="w-5 h-5 text-purple-600" />;
      case 'system':
        return <Activity className="w-5 h-5 text-slate-600" />;
      default:
        return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* 加载骨架屏 */}
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
              <div className="h-96 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">仪表盘</h1>
          <p className="text-slate-600">欢迎回来，这里是今日的校务概况</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={fetchData}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="今日出勤"
            value={stats?.todayAttendance?.rate ?? 0}
            subtitle={`实到 ${stats?.todayAttendance?.present ?? 0} / 总数 ${stats?.todayAttendance?.total ?? 0}`}
            icon={<CheckCircle className="w-6 h-6" />}
            color="blue"
            trend={{
              value: 2.5,
              direction: 'up',
            }}
            onClick={() => navigate('/attendance')}
          />
          <StatCard
            title="本月请假"
            value={stats?.monthLeave?.total ?? 0}
            subtitle={`病假 ${stats?.monthLeave?.sick ?? 0} / 事假 ${stats?.monthLeave?.personal ?? 0}`}
            icon={<Clock className="w-6 h-6" />}
            color="orange"
            onClick={() => navigate('/leave')}
          />
          <StatCard
            title="待处理查询"
            value={stats?.pendingInquiries ?? 0}
            icon={<User className="w-6 h-6" />}
            color="purple"
            onClick={() => navigate('/inquiries')}
          />
          <StatCard
            title="今日通知"
            value={stats?.todayNotifications ?? 0}
            icon={<Bell className="w-6 h-6" />}
            color="green"
            onClick={() => navigate('/notifications')}
          />
        </div>

        {/* 快捷操作 */}
        <Card className="mb-8" title="快捷操作">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/attendance/manual')}
              className="flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">手动出勤</span>
            </button>
            <button
              onClick={() => navigate('/leave/create')}
              className="flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">请假申请</span>
            </button>
            <button
              onClick={() => navigate('/inquiries')}
              className="flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="p-3 bg-purple-100 rounded-full">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">回复查询</span>
            </button>
            <button
              onClick={() => navigate('/notifications/create')}
              className="flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="p-3 bg-green-100 rounded-full">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">发送通知</span>
            </button>
          </div>
        </Card>

        {/* 图表和活动列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 出勤趋势图 */}
          <div className="lg:col-span-2">
            <Card
              title="出勤率趋势"
              icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
              action={
                <button
                  onClick={fetchData}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  刷新
                </button>
              }
            >
              <AttendanceTrendChart data={attendanceTrend} loading={loading} />
            </Card>
          </div>

          {/* 近期活动列表 */}
          <Card
            title="近期活动"
            icon={<Activity className="w-5 h-5 text-purple-600" />}
            action={
              <button
                onClick={() => navigate('/activities')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                查看全部
              </button>
            }
          >
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center text-slate-500 py-8">暂无近期活动</div>
              ) : (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-slate-900 truncate">
                          {activity.title}
                        </h4>
                        {activity.priority && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded border ${getPriorityColor(
                              activity.priority
                            )}`}
                          >
                            {activity.priority === 'high'
                              ? '高'
                              : activity.priority === 'medium'
                              ? '中'
                              : '低'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate mb-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(activity.timestamp).toLocaleString('zh-HK', {
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* 班级出勤对比 */}
        <div className="mt-6">
          <Card
            title="班级出勤对比"
            icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          >
            <ClassComparisonChart data={classComparison} loading={loading} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;