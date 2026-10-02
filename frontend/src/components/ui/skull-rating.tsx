import { Skull } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: number
  max?: number
  size?: number
  onChange?: (value: number) => void
  className?: string
}

export function SkullRating({
  value,
  max = 5,
  size = 16,
  onChange,
  className,
}: Props) {
  const interactive = typeof onChange === 'function'
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1
        const active = n <= value
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            aria-label={`${n} / ${max}`}
            className={cn(
              'rounded-md p-0.5 transition-transform',
              interactive && 'hover:scale-110 active:scale-95',
              !interactive && 'cursor-default',
            )}
          >
            <Skull
              size={size}
              strokeWidth={2}
              className={cn(
                'transition-colors',
                active ? 'text-ink' : 'text-faint',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
