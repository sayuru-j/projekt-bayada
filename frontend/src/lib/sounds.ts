const SOUND_PREF_KEY = 'bayada_sound'

type SoundName = 'click' | 'select' | 'toggle-on' | 'toggle-off' | 'ambient'

const FILES: Record<SoundName, string> = {
  click: '/sounds/click.wav',
  select: '/sounds/select.wav',
  'toggle-on': '/sounds/toggle-on.wav',
  'toggle-off': '/sounds/toggle-off.wav',
  ambient: '/sounds/ambient.wav',
}

const VOLUME: Record<SoundName, number> = {
  click: 0.45,
  select: 0.4,
  'toggle-on': 0.4,
  'toggle-off': 0.35,
  ambient: 0.28,
}

type Listener = (enabled: boolean) => void

class SoundManager {
  private enabled = localStorage.getItem(SOUND_PREF_KEY) === 'on'
  private unlocked = false
  private pools = new Map<SoundName, HTMLAudioElement[]>()
  private ambient: HTMLAudioElement | null = null
  private listeners = new Set<Listener>()

  isEnabled() {
    return this.enabled
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private notify() {
    for (const fn of this.listeners) fn(this.enabled)
  }

  /** Call from any user gesture so browsers allow Audio playback. */
  unlock() {
    if (this.unlocked) return
    this.unlocked = true
    const probe = new Audio(FILES.click)
    probe.volume = 0
    void probe.play().then(
      () => {
        probe.pause()
      },
      () => {
        /* ignore */
      },
    )
    if (this.enabled) this.startAmbient()
  }

  setEnabled(next: boolean) {
    this.enabled = next
    localStorage.setItem(SOUND_PREF_KEY, next ? 'on' : 'off')
    this.notify()
    this.unlock()
    if (next) {
      this.startAmbient()
      this.play('toggle-on', true)
    } else {
      this.play('toggle-off', true)
      this.stopAmbient()
    }
  }

  toggle() {
    this.setEnabled(!this.enabled)
  }

  play(name: Exclude<SoundName, 'ambient'>, force = false) {
    if ((!this.enabled && !force) || (!this.unlocked && !force)) return
    const el = this.getPooled(name)
    if (!el) return
    try {
      el.currentTime = 0
      void el.play().catch(() => {
        /* autoplay may still be blocked until unlock */
      })
    } catch {
      /* ignore */
    }
  }

  private getPooled(name: Exclude<SoundName, 'ambient'>) {
    let pool = this.pools.get(name)
    if (!pool) {
      pool = Array.from({ length: 4 }, () => {
        const a = new Audio(FILES[name])
        a.preload = 'auto'
        a.volume = VOLUME[name]
        return a
      })
      this.pools.set(name, pool)
    }
    const free = pool.find((a) => a.paused || a.ended) ?? pool[0]
    free.volume = VOLUME[name]
    return free
  }

  private startAmbient() {
    if (!this.enabled) return
    if (!this.ambient) {
      this.ambient = new Audio(FILES.ambient)
      this.ambient.loop = true
      this.ambient.preload = 'auto'
      this.ambient.volume = VOLUME.ambient
    }
    void this.ambient.play().catch(() => {
      /* wait for unlock */
    })
  }

  private stopAmbient() {
    if (!this.ambient) return
    this.ambient.pause()
    this.ambient.currentTime = 0
  }
}

export const sounds = new SoundManager()

/** Soft UI click — buttons, nav, filters */
export function playClick() {
  sounds.play('click')
}

/** Place pin / list row select */
export function playSelect() {
  sounds.play('select')
}
