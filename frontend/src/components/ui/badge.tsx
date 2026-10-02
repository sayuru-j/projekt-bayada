import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'accent' | 'danger' | 'warn'

const tones: Record<Tone, string> = {
  neutral: 'border-border-strong bg-surface-3 text-ink-soft',
  accent: 'border-[rgba(57,255,20,0.4)] bg-[rgba(57,255,20,0.1)] text-accent',
  danger: 'border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.1)] text-[#fca5a5]',
  warn: 'border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.1)] text-[#fcd34d]',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  dot,
}: {
  tone?: Tone
  className?: string
  children: React.ReactNode
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function StatChip({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface-3 px-2.5 py-1.5 text-xs text-ink-soft',
        className,
      )}
    >
      <span className="text-muted">{icon}</span>
      {children}
    </span>
  )
}
