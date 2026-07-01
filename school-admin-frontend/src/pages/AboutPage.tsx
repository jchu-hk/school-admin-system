import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { ArrowLeft } from 'lucide-react'

interface VersionInfo {
  version: string
  buildDate: string
  gitCommit: string
  gitBranch: string
  changelog: Array<{
    version: string
    date: string
    changes: string[]
  }>
}

export default function AboutPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 从 /version.json 读取版本信息 (构建时生成)
    fetch('/version.json')
      .then(res => {
        if (!res.ok) {
          throw new Error('Version info not found')
        }
        return res.json()
      })
      .then(data => {
        setVersionInfo(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
        // Fallback to default version info
        setVersionInfo({
          version: 'v1.5.4',
          buildDate: '2026-06-25',
          gitCommit: 'unknown',
          gitBranch: 'unknown',
          changelog: [
            { version: 'v1.5.4', date: '2026-06-25', changes: ['Bug修复: About页面空白问题'] }
          ]
        })
      })
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse bg-gray-200 h-32 rounded-2xl mb-6" />
        <div className="animate-pulse bg-gray-200 h-48 rounded-xl mb-6" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft size={20} /> {t.about.back}
      </button>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-6">
        <h1 className="text-3xl font-bold mb-2">{t.about.title}</h1>
        <p className="text-blue-100">{t.about.subtitle}</p>
        <div className="flex gap-4 mt-4">
          <span className="bg-white/10 px-4 py-2 rounded-lg font-mono">{versionInfo?.version}</span>
          <span className="bg-white/10 px-4 py-2 rounded-lg">{versionInfo?.buildDate}</span>
        </div>
        {versionInfo?.gitCommit !== 'unknown' && (
          <div className="flex gap-4 mt-2 text-sm text-blue-200">
            <span>Git: {versionInfo.gitCommit}</span>
            <span>Branch: {versionInfo.gitBranch}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t.about.techArchitecture}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">{t.about.frontend}:</span> React + TypeScript + Vite</div>
          <div><span className="font-medium">{t.about.backend}:</span> NestJS + PostgreSQL</div>
          <div><span className="font-medium">{t.about.cache}:</span> Redis</div>
          <div><span className="font-medium">{t.about.deployment}:</span> Docker + GitHub Actions</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t.about.completedModules}</h2>
        <div className="flex flex-wrap gap-2">
          {[
            t.about.moduleUserManagement,
            t.about.moduleAuth,
            t.about.moduleAttendance,
            t.about.moduleTuition,
            t.about.moduleLeave,
            t.about.moduleCourse,
            t.about.moduleLunch,
            t.about.moduleI18n,
            t.about.moduleAIVerify
          ].map((m, i) => (
            <span key={i} className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm">{m}</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t.about.changelog}</h2>
        {versionInfo?.changelog?.map((r) => (
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