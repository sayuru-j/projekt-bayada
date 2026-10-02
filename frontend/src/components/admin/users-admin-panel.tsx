import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Loader2, Search, Shield, Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AppRole, User } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { EmptyState } from '@/components/layout/page-shell'
import { Avatar } from '@/components/layout/brand'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'

type AdminUser = User & {
  _count?: { places: number; visits: number }
}

type UsersPage = {
  items: AdminUser[]
  nextCursor: string | null
}

const ROLES: AppRole[] = ['user', 'contributor', 'admin']
const PAGE_SIZE = 20

function useDebouncedValue<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function UsersAdminPanel() {
  const { user: me } = useAuth()
  const { tr } = useLocale()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('take', String(PAGE_SIZE))
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (pageParam) params.set('cursor', pageParam)
      return api<UsersPage>(`/admin/users?${params.toString()}`)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const users = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  )

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const root = el.closest('[data-scroll-root]')
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { root, rootMargin: '160px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, users.length])

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AppRole }) =>
      api(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      toast.success(tr('roleUpdated'))
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <p className="text-[13px] text-muted">{tr('usersHint')}</p>

      <div className="relative shrink-0">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tr('searchUsers')}
          className="rounded-xl py-2 pl-9 text-[13px]"
          autoComplete="off"
        />
      </div>

      {isLoading && (
        <ul className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </ul>
      )}

      {isError && (
        <p className="text-sm text-[#fca5a5]">{tr('usersLoadError')}</p>
      )}

      {!isLoading && !users.length && (
        <EmptyState
          icon={<Users size={20} />}
          title={debouncedSearch ? tr('noUserResults') : tr('noUsers')}
        />
      )}

      {!!users.length && (
        <ul className="space-y-2">
          {users.map((u) => {
            const isSelf = me?.id === u.id
            return (
              <li
                key={u.id}
                className="panel flex flex-col gap-3 rounded-2xl p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar src={u.avatarUrl} name={u.username} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-ink">
                      @{u.username}
                      {isSelf && (
                        <span className="ml-1.5 text-[11px] font-normal text-faint">(you)</span>
                      )}
                    </p>
                    <p className="truncate text-[12px] text-muted">{u.email}</p>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {u._count?.places ?? 0} {tr('places')} · {u._count?.visits ?? 0}{' '}
                      {tr('survivedCount')} · {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  <Badge
                    tone={
                      u.role === 'admin' ? 'accent' : u.role === 'contributor' ? 'warn' : 'neutral'
                    }
                    className="hidden px-2 py-0.5 text-[10px] sm:inline-flex"
                  >
                    <Shield size={10} className="mr-1" />
                    {u.role}
                  </Badge>
                  <Select
                    className={cn('h-9 w-full rounded-lg py-1.5 text-[13px] sm:w-40')}
                    value={u.role}
                    disabled={setRole.isPending || (isSelf && u.role === 'admin')}
                    onChange={(e) => {
                      const role = e.target.value as AppRole
                      if (role === u.role) return
                      setRole.mutate({ id: u.id, role })
                    }}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div ref={sentinelRef} className="flex h-10 items-center justify-center">
        {isFetchingNextPage && (
          <Loader2 size={16} className="animate-spin text-muted" />
        )}
        {!hasNextPage && users.length > 0 && (
          <span className="text-[11px] text-faint">{tr('endOfList')}</span>
        )}
      </div>
    </div>
  )
}
