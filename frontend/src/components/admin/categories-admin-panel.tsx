import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { categoryLabel } from '@/lib/categories'
import type { PlaceCategory } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useCategories } from '@/hooks/use-categories'
import { useLocale } from '@/contexts/locale-context'
import { EmptyState } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import {
  CATEGORY_ICON_OPTIONS,
  CategoryAvatar,
  CategoryIcon,
} from '@/components/ui/category-icon'

type FormState = {
  nameEn: string
  nameSi: string
  slug: string
  color: string
  icon: string
}

const emptyForm: FormState = {
  nameEn: '',
  nameSi: '',
  slug: '',
  color: '#a3a3a3',
  icon: 'MapPin',
}

export function CategoriesAdminPanel() {
  const { user } = useAuth()
  const { locale, tr } = useLocale()
  const qc = useQueryClient()
  const { data: categories = [], isLoading } = useCategories()
  const [editing, setEditing] = useState<PlaceCategory | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const isAdmin = user?.role === 'admin'

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nameEn: form.nameEn.trim(),
        nameSi: form.nameSi.trim(),
        color: form.color,
        icon: form.icon,
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      }
      if (editing) {
        return api(`/admin/categories/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      }
      return api('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      toast.success(tr('categorySaved'))
      void qc.invalidateQueries({ queryKey: ['categories'] })
      setCreating(false)
      setEditing(null)
      setForm(emptyForm)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(tr('categoryDeleted'))
      void qc.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm(emptyForm)
  }

  const openEdit = (cat: PlaceCategory) => {
    setCreating(false)
    setEditing(cat)
    setForm({
      nameEn: cat.nameEn,
      nameSi: cat.nameSi,
      slug: cat.slug,
      color: cat.color,
      icon: cat.icon,
    })
  }

  if (!isAdmin) {
    return (
      <p className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
        Only admins can manage categories. Contributors can still moderate place submissions.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{tr('categories')}</p>
        <Button size="sm" variant="accent" onClick={openCreate}>
          <Plus size={14} />
          {tr('addCategory')}
        </Button>
      </div>

      {(creating || editing) && (
        <div className="anim-pop-in panel rounded-2xl p-4 space-y-3">
          <p className="text-[14px] font-medium text-ink">
            {editing ? tr('editCategory') : tr('addCategory')}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>{tr('nameEn')}</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              />
            </div>
            <div>
              <Label>{tr('nameSi')}</Label>
              <Input
                value={form.nameSi}
                onChange={(e) => setForm((f) => ({ ...f, nameSi: e.target.value }))}
              />
            </div>
            <div>
              <Label>{tr('slug')}</Label>
              <Input
                value={form.slug}
                placeholder="auto from English name"
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div>
              <Label>{tr('color')}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-field p-1"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div>
            <Label>{tr('icon')}</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {CATEGORY_ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                    form.icon === icon
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-strong text-muted hover:text-ink'
                  }`}
                  title={icon}
                >
                  <CategoryIcon icon={icon} size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <CategoryAvatar icon={form.icon} color={form.color} size={40} />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="accent"
                disabled={
                  form.nameEn.trim().length < 2 ||
                  form.nameSi.trim().length < 1 ||
                  save.isPending
                }
                onClick={() => save.mutate()}
              >
                {tr('saveCategory')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCreating(false)
                  setEditing(null)
                  setForm(emptyForm)
                }}
              >
                {tr('close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="skeleton h-20 rounded-2xl" />}

      {!isLoading && categories.length === 0 && (
        <EmptyState title={tr('noCategories')} />
      )}

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="panel flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <CategoryAvatar icon={cat.icon} color={cat.color} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-ink">
                {categoryLabel(cat, locale)}
              </p>
              <p className="text-[12px] text-muted">
                {cat.slug}
                {typeof cat._count?.places === 'number' && (
                  <>
                    {' · '}
                    {cat._count.places} {tr('placesUsing')}
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openEdit(cat)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-ink"
              title={tr('editCategory')}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete “${cat.nameEn}”?`)) remove.mutate(cat.id)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-[rgba(248,113,113,0.1)] hover:text-[#fca5a5]"
              title={tr('deleteCategory')}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
