import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const VERSION = 'v1.4.0'
const BUILD_DATE = '2026-06-20'

const CHANGELOG = [
  { version: 'v1.4.0', date: '2026-06-19', changes: ['午膳订单管理', '教师请假管理', '学生出勤管理', '病假AI核验', 'i18n国际化'] },
  { version: 'v1.3.0', date: '2026-06-19', changes: ['AI边界Bug修复', '分期付款UUID校验'] },
  { version: 'v1.2.0', date: '2026-06-18', changes: ['学生资助资格', '家长密码设置', '出勤二维码扫码'] },
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft size={20} /> 返回
      </button>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-6">
        <h1 className="text-3xl font-bold mb-2">智慧校园管理系统</h1>
        <p className="text-blue-100">Smart School Administration System</p>
        <div className="flex gap-4 mt-4">
          <span className="bg-white/10 px-4 py-2 rounded-lg font-mono">{VERSION}</span>
          <span className="bg-white/10 px-4 py-2 rounded-lg">{BUILD_DATE}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">技术架构</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">Frontend:</span> React + TypeScript</div>
          <div><span className="font-medium">Backend:</span> NestJS + PostgreSQL</div>
          <div><span className="font-medium">Cache:</span> Redis</div>
          <div><span className="font-medium">部署:</span> Docker</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">已完成模块</h2>
        <div className="flex flex-wrap gap-2">
          {['用户管理', '认证授权', '出勤管理', '学费管理', '请假管理', '课程管理', '午膳管理', 'i18n', 'AI核验'].map((m) => (
            <span key={m} className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm">{m}</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">更新日志</h2>
        {CHANGELOG.map((r) => (
          <div key={r.version} className="mb-4 border-l-2 border-purple-200 pl-4">
            <div className="flex gap-3 mb-2">
              <span className="font-mono font-bold text-purple-600">{r.version}</span>
              <span className="text-gray-400 text-sm">{r.date}</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {r.changes.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-center text-gray-400 text-sm">
        © 2024-2026 Smart School Administration System
      </div>
    </div>
  )
}
