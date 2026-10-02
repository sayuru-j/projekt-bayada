import { cn } from '@/lib/utils'

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent text-[#041a08]',
        'shadow-[0_0_16px_rgba(57,255,20,0.45),0_1px_0_rgba(255,255,255,0.25)_inset]',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" style={{ width: size * 0.56, height: size * 0.56 }}>
        <path
          fill="currentColor"
          d="M32 10c-8 0-14 6-14 14v6c0 2-1 3-3 4l-2 1v4h8v10c0 2 2 4 4 4h14c2 0 4-2 4-4V39h8v-4l-2-1c-2-1-3-2-3-4v-6c0-8-6-14-14-14zm-6 16a3 3 0 110 6 3 3 0 010-6zm12 0a3 3 0 110 6 3 3 0 010-6z"
        />
        <ellipse cx="32" cy="42" rx="4" ry="3" fill="#041a08" />
      </svg>
    </span>
  )
}

export function BrandTitle({
  children,
  className,
  size = 'md',
}: {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'hero'
}) {
  const text = typeof children === 'string' ? children : ''
  const isSinhala = /[\u0D80-\u0DFF]/.test(text)

  return (
    <span
      className={cn(
        'inline-block',
        isSinhala ? 'font-semibold tracking-tight text-ink' : 'text-brand',
        size === 'sm' && 'text-[14px] sm:text-[15px]',
        size === 'md' && 'text-[16px] sm:text-[18px]',
        size === 'lg' && 'text-[22px] sm:text-[26px]',
        size === 'hero' && 'text-[44px] leading-none sm:text-[56px]',
        isSinhala && size === 'hero' && 'text-[40px] font-bold sm:text-[52px]',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Avatar({
  src,
  name,
  size = 32,
  className,
}: {
  src: string | null | undefined
  name: string
  size?: number
  className?: string
}) {
  return src ? (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className={cn('shrink-0 rounded-full border border-border-strong object-cover', className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-3 text-[11px] font-semibold uppercase text-ink',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {name.slice(0, 1)}
    </span>
  )
}

export function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-4 w-4', className)} aria-hidden>
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.8 19.8 8.1 22 12 22z" />
      <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1C2.4 8.8 2 10.4 2 12s.4 3.2 1.1 4.6L6.4 14z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8.1 2 4.8 4.2 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" />
    </svg>
  )
}
