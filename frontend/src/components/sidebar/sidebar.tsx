import { NavLink } from 'react-router-dom'
import { LogOut, Plus, ScrollText, Shield, Trophy } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { cn } from '@/lib/utils'
import { Avatar, BrandMark, BrandTitle, GoogleGlyph } from '@/components/layout/brand'
import { AmbientAudioController } from '@/components/audio/ambient-audio'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlaceList } from './place-list'
import type { ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof PlaceList>, 'className' | 'compact'> & {
  onReport: () => void
  onGoToMyLocation?: () => void
  className?: string
}

export function Sidebar({ onReport, onGoToMyLocation, className, ...listProps }: Props) {
  const { user, loading, loginWithGoogle, logout } = useAuth()
  const { locale, setLocale, tr } = useLocale()
  const isMod = user?.role === 'contributor' || user?.role === 'admin'

  return (
    <aside className={cn('flex h-full w-[312px] shrink-0 flex-col bg-surface', className)}>
      <div className="flex items-center justify-between px-5 pb-5 pt-5">
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <BrandTitle size="md">{tr('brand')}</BrandTitle>
        </div>

        <div className="flex items-center gap-0.5">
          <AmbientAudioController variant="inline" />
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'si' : 'en')}
            title={tr('language')}
            className="flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-[12px] font-semibold text-muted transition hover:bg-white/[0.06] hover:text-ink"
          >
            {locale === 'en' ? 'සිං' : 'EN'}
          </button>
          {user ? (
            <button
              type="button"
              onClick={onReport}
              title={tr('report')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-accent transition hover:bg-accent/10 hover:shadow-[0_0_14px_rgba(57,255,20,0.35)]"
            >
              <Plus size={18} />
            </button>
          ) : null}
        </div>
      </div>

      <PlaceList {...listProps} className="min-h-0 flex-1" />

      <div className="shrink-0 border-t border-border px-4 py-4">
        {loading ? (
          <div className="skeleton h-10 rounded-xl" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onGoToMyLocation}
              title={tr('locate')}
              className="shrink-0 rounded-full transition hover:opacity-90 active:scale-95"
            >
              <Avatar src={user.avatarUrl} name={user.username} size={36} />
            </button>
            <button
              type="button"
              onClick={onGoToMyLocation}
              title={tr('locate')}
              className="min-w-0 flex-1 text-left transition hover:opacity-90"
            >
              <p className="truncate text-[13px] font-medium text-ink">@{user.username}</p>
              <Badge tone={isMod ? 'accent' : 'neutral'} className="mt-1 px-2 py-0.5 text-[10px]">
                {user.role}
              </Badge>
            </button>
            <nav className="flex items-center gap-0.5">
              <NavIcon to="/leaderboard" title={tr('leaderboard')}>
                <Trophy size={15} />
              </NavIcon>
              <NavIcon to="/my-submissions" title={tr('mySubmissions')}>
                <ScrollText size={15} />
              </NavIcon>
              {isMod && (
                <NavIcon to="/admin" title={tr('admin')}>
                  <Shield size={15} />
                </NavIcon>
              )}
              <button
                type="button"
                onClick={logout}
                title={tr('signOut')}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-ink"
              >
                <LogOut size={15} />
              </button>
            </nav>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={loginWithGoogle} className="flex-1">
              <GoogleGlyph />
              {tr('signIn')}
            </Button>
            <NavIcon to="/leaderboard" title={tr('leaderboard')}>
              <Trophy size={15} />
            </NavIcon>
          </div>
        )}
      </div>
    </aside>
  )
}

function NavIcon({
  to,
  title,
  children,
}: {
  to: string
  title: string
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      title={title}
      className={({ isActive }) =>
        cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition',
          isActive ? 'bg-white/[0.08] text-ink' : 'text-muted hover:bg-white/[0.06] hover:text-ink',
        )
      }
    >
      {children}
    </NavLink>
  )
}
