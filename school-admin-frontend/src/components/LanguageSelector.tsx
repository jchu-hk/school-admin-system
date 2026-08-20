import { useState, useRef, useEffect } from 'react'
import { useI18n, LOCALES, Locale } from '../i18n'
import { Globe, ChevronDown } from 'lucide-react'

export default function LanguageSelector() {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = LOCALES.find(l => l.value === locale)!

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-200"
        title={t.common.language}
      >
        <Globe size={18} />
        <span className="font-medium">{current.label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute left-0 bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-[9999] min-w-[180px] animate-in fade-in">
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
            选择语言 / Select Language
          </div>
          {LOCALES.map(l => (
            <button
              key={l.value}
              onClick={() => { setLocale(l.value as Locale); setOpen(false) }}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${l.value === locale 
                ? 'bg-blue-50 text-blue-700 font-semibold' 
                : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="text-2xl">{l.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm">{l.label}</span>
                <span className="text-xs text-gray-400">{l.name}</span>
              </div>
              {l.value === locale && (
                <span className="ml-auto text-blue-500">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
