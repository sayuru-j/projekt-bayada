import { useEffect } from 'react'
import { playClick, sounds } from '@/lib/sounds'

/**
 * Plays a soft click for interactive UI when sound is enabled.
 * Skips map canvas / scroll areas to avoid noise while panning.
 */
export function UiSoundBridge() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      sounds.unlock()
      if (!sounds.isEnabled()) return
      const t = e.target
      if (!(t instanceof Element)) return
      if (t.closest('.maplibregl-canvas, .maplibregl-canvas-container, [data-no-sound]')) {
        return
      }
      const interactive = t.closest(
        'button, a, [role="button"], input[type="checkbox"], input[type="radio"], select, summary, [data-sound="click"]',
      )
      if (!interactive) return
      // Mute toggle handles its own chime
      if (interactive.closest('[data-sound="toggle"]')) return
      playClick()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  return null
}
