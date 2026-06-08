import { useState, useRef, useEffect } from 'react'
import { useI18n, LOCALES, Locale } from '../i18n'
import { Globe } from 'lucide-react'

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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
        title={t.common.language}
      >
        <Globe size={16} />
        <span>{current.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
          {LOCALES.map(l => (
            <button
              key={l.value}
              onClick={() => { setLocale(l.value as Locale); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition ${l.value === locale ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {l.value === locale && <span className="ml-auto text-blue-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
