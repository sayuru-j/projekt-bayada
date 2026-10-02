import {
  Building2,
  Ghost,
  House,
  MapPin,
  Moon,
  Signpost,
  Skull,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  Ghost,
  House,
  Signpost,
  Skull,
  Moon,
  Building2,
  MapPin,
}

export const CATEGORY_ICON_OPTIONS = Object.keys(ICONS)

export function CategoryIcon({
  icon,
  ...props
}: LucideProps & { icon?: string | null }) {
  const Icon = (icon && ICONS[icon]) || MapPin
  return <Icon {...props} />
}

export function CategoryAvatar({
  icon,
  color,
  size = 44,
  className,
}: {
  icon?: string | null
  color: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn(className)}
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#111111',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 12px rgba(0,0,0,0.45)',
        flexShrink: 0,
      }}
    >
      <CategoryIcon icon={icon} size={Math.round(size * 0.42)} strokeWidth={2.2} />
    </span>
  )
}
