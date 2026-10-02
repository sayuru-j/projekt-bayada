import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { sounds } from '@/lib/sounds'
import { cn } from '@/lib/utils'

export function AmbientAudioController({
  className,
  variant = 'floating',
}: {
  className?: string
  /** `inline` sits in the top chrome; `floating` overlays the map top-right */
  variant?: 'floating' | 'inline'
}) {
  const { tr } = useLocale()
  const [enabled, setEnabled] = useState(() => sounds.isEnabled())

  useEffect(() => {
    return sounds.subscribe(setEnabled)
  }, [])

  useEffect(() => {
    const unlock = () => sounds.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const inline = variant === 'inline'

  return (
    <button
      type="button"
      data-sound="toggle"
      aria-label={enabled ? tr('soundOn') : tr('soundOff')}
      onClick={() => sounds.toggle()}
      className={cn(
        'relative flex items-center justify-center transition-[border-color,box-shadow,transform,color] duration-200 active:scale-95',
        inline
          ? 'h-9 w-9 rounded-full'
          : 'panel-raised absolute z-30 h-10 w-10 rounded-xl',
        enabled
          ? inline
            ? 'text-accent'
            : 'border-accent/50 text-accent shadow-[var(--shadow-raised)]'
          : 'text-muted hover:text-ink',
        className,
      )}
    >
      {enabled && !inline && (
        <span className="absolute inset-0 rounded-xl border border-accent/50 [animation:pulse-ring_2.4s_cubic-bezier(0.2,0.8,0.2,1)_infinite]" />
      )}
      {enabled ? <Volume2 size={inline ? 17 : 18} /> : <VolumeX size={inline ? 17 : 18} />}
    </button>
  )
}
