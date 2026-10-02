import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { BrandMark, BrandTitle } from './brand'
import { cn } from '@/lib/utils'

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  width?: 'sm' | 'md' | 'lg'
  toolbar?: ReactNode
}

const widths = {
  sm: 'max-w-xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
}

export function PageShell({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  width = 'md',
  toolbar,
}: Props) {
  const { tr } = useLocale()

  return (
    <div className="h-full w-full overflow-hidden bg-canvas pt-[env(safe-area-inset-top)] lg:p-4 lg:pt-4">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface lg:rounded-[28px] lg:border lg:border-border">
        <div
          className={cn(
            'mx-auto flex min-h-0 w-full flex-1 flex-col px-3 pt-4 sm:px-6 sm:pt-8',
            widths[width],
          )}
        >
          <div className="mb-4 flex shrink-0 items-center justify-between sm:mb-8">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border-strong bg-surface-2 pl-2.5 pr-3.5 text-[13px] font-medium text-ink-soft transition hover:border-[#4a4a4a] hover:text-ink"
            >
              <ArrowLeft size={14} />
              <span className="max-sm:hidden">{tr('mapName')}</span>
              <span className="sm:hidden">Map</span>
            </Link>
            <div className="flex items-center gap-2">
              <BrandMark size={28} />
              <BrandTitle size="sm">{tr('brand')}</BrandTitle>
            </div>
          </div>

          <div className="mb-3 flex shrink-0 flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {eyebrow && <p className="label-sm mb-1 text-accent">{eyebrow}</p>}
              <h1 className="text-[22px] font-semibold tracking-tight text-ink sm:text-[30px]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 max-w-prose text-[12px] text-muted sm:mt-1.5 sm:text-[13px]">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="no-scrollbar -mx-1 flex max-w-full shrink-0 items-center gap-2 overflow-x-auto px-1 pb-0.5">
                {actions}
              </div>
            )}
          </div>

          {toolbar && (
            <div className="no-scrollbar mb-3 shrink-0 overflow-x-auto sm:mb-4">{toolbar}</div>
          )}

          <div
            data-scroll-root
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="panel flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-muted">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {hint && <p className="mt-1.5 max-w-sm text-[13px] text-muted">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
