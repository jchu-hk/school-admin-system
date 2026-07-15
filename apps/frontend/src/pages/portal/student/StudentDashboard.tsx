import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardCard {
  key: string;
  icon: string;
  title: string;
  description: string;
  path: string;
  color: string;
}

const DEFAULT_CARDS: DashboardCard[] = [
  {
    key: 'profile',
    icon: '👤',
    title: '我的档案',
    description: '查看和编辑个人信息',
    path: '/portal/student/profile',
    color: '#3b82f6',
  },
  {
    key: 'attendance',
    icon: '📋',
    title: '签到记录',
    description: '查看每日签到情况',
    path: '/portal/student/attendance',
    color: '#10b981',
  },
  {
    key: 'leave',
    icon: '📝',
    title: '请假管理',
    description: '提交请假申请和查看审批状态',
    path: '/portal/student/leave',
    color: '#f59e0b',
  },
  {
    key: 'notification',
    icon: '🔔',
    title: '通知中心',
    description: '查看学校通知和消息',
    path: '/portal/student/notification',
    color: '#8b5cf6',
  },
  {
    key: 'settings',
    icon: '⚙️',
    title: '账户设置',
    description: '管理账户密码和安全设置',
    path: '/portal/student/settings',
    color: '#64748b',
  },
];

/**
 * StudentDashboard — 学生门户默认首页
 *
 * 展示概览卡片，点击可导航到对应的功能模块
 */
const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  // ── 根据时间生成问候语 ──
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('夜深了');
    else if (hour < 12) setGreeting('早上好');
    else if (hour < 14) setGreeting('中午好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');
  }, []);

  const todayStr = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Shanghai',
  }).format(new Date());

  return (
    <div className="portal-dashboard">
      {/* ── 顶部问候 ── */}
      <header className="portal-dashboard__header">
        <h1 className="portal-dashboard__greeting">{greeting}！</h1>
        <p className="portal-dashboard__date">{todayStr}</p>
      </header>

      {/* ── 功能卡片 ── */}
      <div className="portal-dashboard__cards">
        {DEFAULT_CARDS.map((card) => (
          <button
            key={card.key}
            className="portal-dashboard__card"
            style={{
              '--card-accent': card.color,
            } as React.CSSProperties}
            onClick={() => navigate(card.path)}
          >
            <div
              className="portal-dashboard__card-icon"
              style={{ backgroundColor: `${card.color}1a` }}
            >
              {card.icon}
            </div>
            <div className="portal-dashboard__card-body">
              <h3 className="portal-dashboard__card-title">{card.title}</h3>
              <p className="portal-dashboard__card-desc">
                {card.description}
              </p>
            </div>
            <span className="portal-dashboard__card-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
