import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { useI18n } from '../i18n'

export default function AgentDashboardPage() {
  const { t } = useI18n()
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [iframeKey, setIframeKey] = useState(0)
  const [loading, setLoading] = useState(true)

  const handleRefresh = useCallback(() => {
    setLoading(true)
    setIframeKey(k => k + 1)
    setLastRefresh(new Date())
  }, [])

  useEffect(() => {
    const interval = setInterval(handleRefresh, 30_000)
    return () => clearInterval(interval)
  }, [handleRefresh])

  return (
    <div
      className="agent-dashboard-page"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        minHeight: '100vh',
        color: '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-xl font-bold text-green-400">
          🤖 {t?.nav?.agentDashboard || 'Multi-Agent Dashboard'}
        </h1>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>Updated: {lastRefresh.toLocaleTimeString('zh-CN', { hour12: false })}</span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        )}
        <iframe
          key={iframeKey}
          src="/school-admin/multi-agent-dashboard.html"
          title="Agent Dashboard"
          onLoad={() => setLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 'calc(100vh - 60px)',
            border: 'none',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}
        />
      </div>
    </div>
  )
}
