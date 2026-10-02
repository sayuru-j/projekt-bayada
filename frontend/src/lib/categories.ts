export type PlaceCategory = {
  id: string
  slug: string
  nameEn: string
  nameSi: string
  color: string
  icon: string
  sortOrder: number
  _count?: { places: number }
}

export {
  MAP_CENTER,
  MAP_STYLE,
  SRI_LANKA_BOUNDS,
} from './map'

export function categoryLabel(cat: PlaceCategory | undefined, locale: 'en' | 'si') {
  if (!cat) return locale === 'si' ? 'වෙනත්' : 'Other'
  return locale === 'si' ? cat.nameSi : cat.nameEn
}
