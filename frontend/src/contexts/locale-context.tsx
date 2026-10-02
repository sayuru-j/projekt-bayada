import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { t, type DictKey, type Locale } from '@/i18n'

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  tr: (key: DictKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)
const LOCALE_KEY = 'bayada_locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(LOCALE_KEY)
    return saved === 'si' ? 'si' : 'en'
  })

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale)
    document.documentElement.lang = locale === 'si' ? 'si' : 'en'
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale: setLocaleState,
      tr: (key: DictKey) => t(locale, key),
    }),
    [locale],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
