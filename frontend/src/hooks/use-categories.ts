import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PlaceCategory } from '@/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api<PlaceCategory[]>('/categories'),
    staleTime: 60_000,
  })
}

export function useCategoryMap() {
  const query = useCategories()
  const byId = new Map((query.data ?? []).map((c) => [c.id, c]))
  const bySlug = new Map((query.data ?? []).map((c) => [c.slug, c]))
  return { ...query, byId, bySlug, categories: query.data ?? [] }
}
