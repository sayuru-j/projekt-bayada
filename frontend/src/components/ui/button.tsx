import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'pill'
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'relative inline-flex select-none items-center justify-center gap-2 rounded-xl text-sm font-medium',
        'transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-out',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:ring-focus',
        size === 'sm' && 'h-9 px-3.5 text-[13px]',
        size === 'md' && 'h-10 px-4',
        size === 'lg' && 'h-12 px-5 text-[15px]',
        size === 'icon' && 'h-10 w-10 p-0',
        size === 'icon-sm' && 'h-8 w-8 p-0 rounded-lg',

        variant === 'primary' &&
          'bg-ink text-[#111] shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_8px_20px_-10px_rgba(255,255,255,0.35)] hover:bg-white',

        variant === 'accent' &&
          'bg-accent text-[#041a08] shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_8px_18px_-10px_rgba(0,0,0,0.65)] hover:brightness-110',

        variant === 'outline' &&
          'border border-border-strong bg-transparent text-ink hover:border-[#4a4a4a] hover:bg-white/[0.04]',

        variant === 'pill' &&
          'rounded-full border border-border-strong bg-surface-2 text-ink-soft hover:border-[#4a4a4a] hover:text-ink',

        variant === 'ghost' &&
          'bg-transparent text-ink-soft hover:bg-white/[0.06] hover:text-ink',

        variant === 'danger' &&
          'border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.1)] text-[#fca5a5] hover:bg-[rgba(248,113,113,0.18)]',
        className,
      )}
      {...props}
    />
  )
}
