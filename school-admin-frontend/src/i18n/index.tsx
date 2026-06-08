import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { zhCN } from './locales/zh-CN'
import { zhTW } from './locales/zh-TW'
import { en } from './locales/en'

export type Locale = 'zh-CN' | 'zh-TW' | 'en'

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { value: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
]

type Translations = typeof zhCN

const translations: Record<Locale, Translations> = { 'zh-CN': zhCN, 'zh-TW': zhTW, en }

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const I18nContext = createContext<I18nContextType | null>(null)

const STORAGE_KEY = 'app_locale'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (saved === 'zh-CN' || saved === 'zh-TW' || saved === 'en')) return saved as Locale
    return 'zh-CN'
  })

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }, [])

  const t = translations[locale]

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
