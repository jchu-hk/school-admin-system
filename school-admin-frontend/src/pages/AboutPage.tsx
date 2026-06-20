import React from 'react'
import { useI18n } from '../i18n'
import { 
  Info, 
  GitBranch, 
  Calendar, 
  CheckCircle, 
  Zap,
  Shield,
  Users
} from 'lucide-react'

// 版本信息 - 每次发布时更新
const VERSION = 'v1.4.0'
const BUILD_DATE = '2026-06-20'
const GITHUB_URL = 'https://github.com/jchu-hk/school-admin-system'

// 更新日志
const CHANGELOG = [
  {
    version: 'v1.4.0',
    date: '2026-06-19',
    changes: [
      '午膳订单管理功能 (Issue #36)',
      '教师请假管理 (Issue #31)',
      '学生出勤管理 (Issue #30)',
      '病假AI核验 (Issue #102)',
      '完整i18n国际化支持'
    ]
  },
  {
    version: 'v1.3.0',
    date: '2026-06-19',
    changes: [
      'AI边界Bug修复 (Issue #104)',
      '分期付款UUID校验 (Issue #103)'
    ]
  },
  {
    version: 'v1.2.0',
    date: '2026-06-18',
    changes: [
      '学生资助资格 (Issue #101)',
      '家长密码设置 (Issue #100)',
      '出勤二维码扫码 (Issue #99)'
    ]
  }
]

// 技术栈
const TECHNOLOGIES = [
  { name: 'Frontend', detail: 'React + TypeScript + TailwindCSS + Vite' },
  { name: 'Backend', detail: 'NestJS + TypeORM + PostgreSQL' },
  { name: 'Cache', detail: 'Redis' },
  { name: 'Message Queue', detail: 'Kafka' },
  { name: 'Deployment', detail: 'Docker + Cloudflare Tunnel' }
]

export default function AboutPage() {
  const { t } = useI18n()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Info size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">智慧校园管理系统</h1>
            <p className="text-blue-100 mt-1">Smart School Administration System</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
            <GitBranch size={18} />
            <span className="font-mono font-bold">{VERSION}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
            <Calendar size={18} />
            <span>{BUILD_DATE}</span>
          </div>
        </div>
      </div>

      {/* 技术栈 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="text-yellow-500" size={24} />
          技术架构
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TECHNOLOGIES.map((tech) => (
            <div key={tech.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <span className="font-medium text-gray-700">{tech.name}</span>
                <span className="text-gray-400 mx-2">-</span>
                <span className="text-gray-600">{tech.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 功能模块 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="text-green-500" size={24} />
          已完成模块
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            '用户管理', '认证授权', '出勤管理', '学费管理',
            '请假管理', '课程管理', '午膳管理', 'i18n国际化',
            '病假AI核验', '家长密码', '学生资助', '分期付款'
          ].map((module) => (
            <div key={module} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
              <CheckCircle size={16} />
              {module}
            </div>
          ))}
        </div>
      </div>

      {/* 更新日志 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-purple-500" size={24} />
          更新日志
        </h2>
        <div className="space-y-6">
          {CHANGELOG.map((release) => (
            <div key={release.version} className="border-l-2 border-purple-200 pl-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono font-bold text-purple-600">{release.version}</span>
                <span className="text-gray-400 text-sm">{release.date}</span>
              </div>
              <ul className="space-y-1">
                {release.changes.map((change, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-purple-400 mt-1">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub链接 */}
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <GitBranch size={20} />
          在 GitHub 上查看源码
        </a>
      </div>

      {/* 版权 */}
      <div className="text-center text-gray-400 text-sm">
        <p>© 2024-2026 Smart School Administration System</p>
        <p className="mt-1">智慧校园管理系统 - 让校园管理更简单</p>
      </div>
    </div>
  )
}
