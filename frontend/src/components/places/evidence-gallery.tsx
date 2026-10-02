import { useEffect, useState } from 'react'
import { X, ZoomIn } from 'lucide-react'
import { mediaUrl } from '@/lib/utils'
import { useLocale } from '@/contexts/locale-context'
import type { EvidenceMedia } from '@/types'

/** Build a small, compressed JPEG preview for gallery display. */
function makeLowQualityPreview(src: string, maxWidth = 480, quality = 0.32): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.naturalWidth)
        const w = Math.max(1, Math.round(img.naturalWidth * scale))
        const h = Math.max(1, Math.round(img.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('no canvas'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('load failed'))
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

function EvidenceImage({ url }: { url: string }) {
  const { tr } = useLocale()
  const fullSrc = mediaUrl(url)
  const [preview, setPreview] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setPreview(null)
    void makeLowQualityPreview(fullSrc)
      .then((data) => {
        if (!cancelled) setPreview(data)
      })
      .catch(() => {
        // Fallback: still show original but keep gallery sizing compact
        if (!cancelled) setPreview(fullSrc)
      })
    return () => {
      cancelled = true
    }
  }, [fullSrc])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-border-strong bg-surface-3 text-left"
        aria-label={tr('viewFullImage')}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            loading="lazy"
            className="max-h-52 w-full object-cover transition duration-200 group-hover:brightness-110"
          />
        ) : (
          <div className="skeleton h-40 w-full" />
        )}
        <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-medium text-ink-soft backdrop-blur-sm">
          <ZoomIn size={11} />
          {tr('viewFullImage')}
        </span>
      </button>

      {open && (
        <div
          className="anim-fade-in fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={tr('viewFullImage')}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={tr('close')}
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-ink"
          >
            <X size={18} />
          </button>
          <img
            src={fullSrc}
            alt=""
            className="max-h-[min(92dvh,92vh)] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export function EvidenceGallery({ media }: { media: EvidenceMedia[] }) {
  const { tr } = useLocale()
  if (!media.length) return null

  return (
    <section>
      <h3 className="label-sm mb-2.5">{tr('evidence')}</h3>
      <div className="space-y-2.5">
        {media.map((m) =>
          m.mediaType === 'youtube' && m.youtubeId ? (
            <div
              key={m.id}
              className="overflow-hidden rounded-2xl border border-border-strong bg-black"
            >
              <iframe
                title="YouTube evidence"
                className="aspect-video w-full"
                src={`https://www.youtube-nocookie.com/embed/${m.youtubeId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <EvidenceImage key={m.id} url={m.url} />
          ),
        )}
      </div>
    </section>
  )
}
