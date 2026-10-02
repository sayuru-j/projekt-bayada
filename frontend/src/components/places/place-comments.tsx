import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowBigDown, ArrowBigUp, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { CommentVoteResult, HauntedPlace, PlaceComment } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/layout/brand'

export const COMMENT_MAX = 280

type VoteType = 'up' | 'down'

type Props = {
  placeId: string
  comments: PlaceComment[]
}

function applyOptimisticVote(comment: PlaceComment, next: VoteType): PlaceComment {
  const prev = comment.myVote
  let upvoteCount = comment.upvoteCount
  let downvoteCount = comment.downvoteCount
  let myVote: VoteType | null

  if (prev === next) {
    // toggle off
    myVote = null
    if (next === 'up') upvoteCount -= 1
    else downvoteCount -= 1
  } else if (prev == null) {
    myVote = next
    if (next === 'up') upvoteCount += 1
    else downvoteCount += 1
  } else {
    // switch
    myVote = next
    if (next === 'up') {
      upvoteCount += 1
      downvoteCount -= 1
    } else {
      downvoteCount += 1
      upvoteCount -= 1
    }
  }

  return {
    ...comment,
    myVote,
    upvoteCount: Math.max(0, upvoteCount),
    downvoteCount: Math.max(0, downvoteCount),
  }
}

export function PlaceComments({ placeId, comments: serverComments }: Props) {
  const { user, loginWithGoogle } = useAuth()
  const { tr } = useLocale()
  const qc = useQueryClient()
  const [body, setBody] = useState('')
  const [comments, setComments] = useState(serverComments)
  const pendingVotes = useRef(new Set<string>())
  const [pendingIds, setPendingIds] = useState<string[]>([])

  useEffect(() => {
    setComments(serverComments)
  }, [serverComments])

  const myComment = comments.find((c) => c.isMine)

  const patchPlaceCache = (updater: (list: PlaceComment[]) => PlaceComment[]) => {
    qc.setQueryData<HauntedPlace>(['place', placeId], (prev) => {
      if (!prev) return prev
      return { ...prev, comments: updater(prev.comments ?? []) }
    })
  }

  const postMutation = useMutation({
    mutationFn: () =>
      api<PlaceComment>(`/places/${placeId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim() }),
      }),
    onSuccess: (created) => {
      setBody('')
      toast.success('Comment posted')
      setComments((prev) => [created, ...prev.filter((c) => c.id !== created.id)])
      patchPlaceCache((list) => [created, ...list.filter((c) => c.id !== created.id)])
      void qc.invalidateQueries({ queryKey: ['place', placeId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/comments/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      toast.success(tr('deleteComment'))
      setComments((prev) => prev.filter((c) => c.id !== id))
      patchPlaceCache((list) => list.filter((c) => c.id !== id))
      void qc.invalidateQueries({ queryKey: ['place', placeId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const castVote = async (commentId: string, type: VoteType) => {
    if (!user) {
      toast.message(tr('needAuth'))
      loginWithGoogle()
      return
    }
    if (pendingVotes.current.has(commentId)) return

    const snapshot = comments.find((c) => c.id === commentId)
    if (!snapshot) return

    const optimistic = applyOptimisticVote(snapshot, type)
    pendingVotes.current.add(commentId)
    setPendingIds([...pendingVotes.current])
    setComments((prev) => prev.map((c) => (c.id === commentId ? optimistic : c)))
    patchPlaceCache((list) => list.map((c) => (c.id === commentId ? optimistic : c)))

    try {
      const result = await api<CommentVoteResult>(`/comments/${commentId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      })
      const synced: PlaceComment = {
        ...optimistic,
        myVote: result.myVote,
        upvoteCount: result.upvoteCount,
        downvoteCount: result.downvoteCount,
      }
      setComments((prev) => prev.map((c) => (c.id === commentId ? synced : c)))
      patchPlaceCache((list) => list.map((c) => (c.id === commentId ? synced : c)))
    } catch (err) {
      setComments((prev) => prev.map((c) => (c.id === commentId ? snapshot : c)))
      patchPlaceCache((list) => list.map((c) => (c.id === commentId ? snapshot : c)))
      toast.error(err instanceof Error ? err.message : 'Vote failed')
    } finally {
      pendingVotes.current.delete(commentId)
      setPendingIds([...pendingVotes.current])
    }
  }

  const remaining = COMMENT_MAX - body.length
  const canPost =
    !myComment && body.trim().length >= 2 && body.trim().length <= COMMENT_MAX

  const onPost = () => {
    if (!user) {
      toast.message(tr('needAuth'))
      loginWithGoogle()
      return
    }
    if (!canPost) return
    postMutation.mutate()
  }

  return (
    <section className="rounded-2xl border border-border-strong bg-surface-3 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink-soft">{tr('comments')}</span>
        <span className="text-[12px] tabular-nums text-muted">{comments.length}</span>
      </div>

      {!myComment ? (
        <div className="mb-4 space-y-2">
          <Textarea
            rows={3}
            value={body}
            maxLength={COMMENT_MAX}
            placeholder={tr('writeComment')}
            className="min-h-[72px] rounded-xl px-3 py-2 text-[13px] leading-snug"
            onChange={(e) => setBody(e.target.value.slice(0, COMMENT_MAX))}
            onFocus={() => {
              if (!user) {
                toast.message(tr('needAuth'))
                loginWithGoogle()
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-faint">
              <span className={cn(remaining < 40 && 'text-warn')}>{remaining}</span>{' '}
              {tr('commentChars')}
            </p>
            <Button
              type="button"
              variant="accent"
              size="sm"
              disabled={!canPost || postMutation.isPending}
              onClick={onPost}
            >
              {postMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {tr('postComment')}
            </Button>
          </div>
          <p className="text-[10px] leading-snug text-faint">{tr('commentLimit')}</p>
        </div>
      ) : (
        <p className="mb-3 text-[11px] leading-snug text-muted">{tr('commentLimit')}</p>
      )}

      {comments.length === 0 ? (
        <p className="py-2 text-center text-[12px] text-muted">{tr('noComments')}</p>
      ) : (
        <ul className="max-h-64 divide-y divide-border overflow-y-auto">
          {comments.map((c) => {
            const voting = pendingIds.includes(c.id)
            return (
              <li key={c.id} className="flex gap-2.5 py-3 first:pt-0 last:pb-0">
                <Avatar src={c.user.avatarUrl} name={c.user.username} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[12px] font-medium text-ink">
                      @{c.user.username}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-faint">
                      {format(new Date(c.createdAt), 'MMM d')}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-snug text-ink-soft">
                    {c.body}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={tr('upvote')}
                      aria-pressed={c.myVote === 'up'}
                      disabled={voting}
                      onClick={() => void castVote(c.id, 'up')}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition',
                        c.myVote === 'up'
                          ? 'bg-accent/15 text-accent'
                          : 'text-muted hover:bg-white/[0.06] hover:text-ink',
                        voting && 'opacity-70',
                      )}
                    >
                      <ArrowBigUp size={14} strokeWidth={c.myVote === 'up' ? 2.6 : 2} />
                      <span className="tabular-nums">{c.upvoteCount}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={tr('downvote')}
                      aria-pressed={c.myVote === 'down'}
                      disabled={voting}
                      onClick={() => void castVote(c.id, 'down')}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition',
                        c.myVote === 'down'
                          ? 'bg-danger/15 text-danger'
                          : 'text-muted hover:bg-white/[0.06] hover:text-ink',
                        voting && 'opacity-70',
                      )}
                    >
                      <ArrowBigDown size={14} strokeWidth={c.myVote === 'down' ? 2.6 : 2} />
                      <span className="tabular-nums">{c.downvoteCount}</span>
                    </button>
                    {c.isMine && (
                      <button
                        type="button"
                        aria-label={tr('deleteComment')}
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(c.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted transition hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 size={12} />
                        {tr('deleteComment')}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
