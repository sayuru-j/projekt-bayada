import { useState } from 'react'
import { useLocale } from '@/contexts/locale-context'
import { BrandTitle } from '@/components/layout/brand'
import { Button } from '@/components/ui/button'

const CONSENT_SKIP_KEY = 'bayada_consent_skip_v1'

export function hasSkippedConsent() {
  return localStorage.getItem(CONSENT_SKIP_KEY) === '1'
}

export function ConsentScreen({ onDismiss }: { onDismiss: () => void }) {
  const { locale, setLocale, tr } = useLocale()

  return (
    <div className="fixed inset-0 z-[100] flex h-full min-h-dvh flex-col bg-canvas px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setLocale(locale === 'en' ? 'si' : 'en')}
          className="flex h-9 min-w-9 items-center justify-center rounded-full border border-border-strong bg-surface-2 px-2.5 text-[12px] font-semibold text-muted transition hover:text-ink"
        >
          {locale === 'en' ? 'සිං' : 'EN'}
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <BrandTitle size="hero">{tr('brand')}</BrandTitle>

        <p className="mt-10 text-[15px] leading-relaxed text-ink-soft">{tr('consentBody')}</p>

        <Button variant="accent" size="lg" className="mt-10 w-full max-w-xs" onClick={onDismiss}>
          {tr('consentAccept')}
        </Button>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(CONSENT_SKIP_KEY, '1')
            onDismiss()
          }}
          className="text-[12px] text-muted underline-offset-2 transition hover:text-ink hover:underline"
        >
          {tr('consentDontShowAgain')}
        </button>
      </div>
    </div>
  )
}

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(hasSkippedConsent)
  if (!dismissed) {
    return <ConsentScreen onDismiss={() => setDismissed(true)} />
  }
  return children
}
