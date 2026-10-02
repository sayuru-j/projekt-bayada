import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronUp,
  LogIn,
  MoreVertical,
  Plus,
  ScrollText,
  Shield,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { sounds } from '@/lib/sounds'
import { cn } from '@/lib/utils'
import { Avatar, BrandMark, BrandTitle } from '@/components/layout/brand'
import { PlaceList } from './place-list'

export function MobileTopBar({
  onReport,
  onGoToMyLocation,
}: {
  onReport: () => void
  onGoToMyLocation?: () => void
}) {
  const { user, loginWithGoogle } = useAuth()
  const { locale, setLocale, tr } = useLocale()
  const isMod = user?.role === 'contributor' || user?.role === 'admin'
  const [menuOpen, setMenuOpen] = useState(false)
  const [soundOn, setSoundOn] = useState(() => sounds.isEnabled())
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => sounds.subscribe(setSoundOn), [])

  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  return (
    <div className="panel-raised absolute inset-x-2 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex h-12 items-center justify-between gap-2 rounded-2xl px-2 sm:inset-x-3 sm:h-14 sm:px-2.5 lg:hidden">
      <div className="flex min-w-0 items-center gap-2 pl-0.5">
        <BrandMark size={28} />
        <BrandTitle size="sm" className="truncate">
          {tr('brand')}
        </BrandTitle>
      </div>

      <div className="relative flex shrink-0 items-center gap-1" ref={menuRef}>
        <button
          type="button"
          aria-label={tr('menu')}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full transition',
            menuOpen ? 'bg-white/[0.08] text-ink' : 'text-muted hover:text-ink',
          )}
        >
          <MoreVertical size={18} />
        </button>

        {user ? (
          <button
            type="button"
            onClick={onGoToMyLocation}
            title={tr('locate')}
            className="rounded-full transition hover:opacity-90 active:scale-95"
          >
            <Avatar src={user.avatarUrl} name={user.username} size={28} />
          </button>
        ) : (
          <button
            type="button"
            onClick={loginWithGoogle}
            className="flex h-8 items-center gap-1 rounded-full bg-ink px-2.5 text-[11px] font-semibold text-[#111] sm:h-9 sm:px-3 sm:text-[12px]"
          >
            <LogIn size={13} />
            <span className="max-[360px]:hidden">Sign in</span>
          </button>
        )}

        {menuOpen && (
          <div className="anim-pop-in absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-2xl border border-border-strong bg-surface-2 py-1.5 shadow-[var(--shadow-raised)]">
            <MenuRow
              icon={soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              label={soundOn ? tr('soundOn') : tr('soundOff')}
              active={soundOn}
              onClick={() => {
                sounds.unlock()
                sounds.toggle()
              }}
            />
            <MenuRow
              icon={<span className="text-[11px] font-semibold">{locale === 'en' ? 'සිං' : 'EN'}</span>}
              label={tr('language')}
              onClick={() => setLocale(locale === 'en' ? 'si' : 'en')}
            />
            <div className="my-1.5 border-t border-border" />
            <MenuLink to="/leaderboard" icon={<Trophy size={16} />} label={tr('leaderboard')} onNavigate={close} />
            {user && (
              <MenuLink
                to="/my-submissions"
                icon={<ScrollText size={16} />}
                label={tr('mySubmissions')}
                onNavigate={close}
              />
            )}
            {isMod && (
              <MenuLink to="/admin" icon={<Shield size={16} />} label={tr('admin')} onNavigate={close} />
            )}
            {user && (
              <>
                <div className="my-1.5 border-t border-border" />
                <MenuRow
                  icon={<Plus size={16} />}
                  label={tr('report')}
                  onClick={() => {
                    close()
                    onReport()
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MenuRow({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[13px] transition hover:bg-white/[0.06]',
        active ? 'text-accent' : 'text-ink-soft hover:text-ink',
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </button>
  )
}

function MenuLink({
  to,
  icon,
  label,
  onNavigate,
}: {
  to: string
  icon: React.ReactNode
  label: string
  onNavigate: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-[13px] text-ink-soft transition hover:bg-white/[0.06] hover:text-ink"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </Link>
  )
}

type SheetProps = Omit<ComponentProps<typeof PlaceList>, 'className' | 'compact'> & {
  hidden?: boolean
}

export function MobileSheet({ hidden, ...listProps }: SheetProps) {
  const [expanded, setExpanded] = useState(false)
  const { tr } = useLocale()

  if (hidden) return null

  return (
    <div
      className={cn(
        'panel-raised absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-[26px] border-b-0 transition-[height] duration-300 ease-out lg:hidden',
        'pb-[env(safe-area-inset-bottom)]',
        expanded ? 'h-[min(78dvh,78vh)]' : 'h-[min(168px,28dvh)]',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex shrink-0 flex-col items-center pt-2.5"
      >
        <span className="h-1 w-10 rounded-full bg-white/20" />
        <span className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
          <ChevronUp size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
          {listProps.places.length} {tr('places')}
        </span>
      </button>
      <PlaceList {...listProps} compact className="mt-2 min-h-0 flex-1" />
    </div>
  )
}
