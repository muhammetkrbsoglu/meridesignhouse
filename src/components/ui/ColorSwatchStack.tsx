import { cn } from '@/lib/utils'
import { mergeColorValues } from '@/lib/products/color-utils'

interface ColorSwatchStackProps {
  colors?: Array<string | null | undefined>
  maxVisible?: number
  size?: 'sm' | 'md'
  showCount?: boolean
  className?: string
  label?: string
}

const SIZE_MAP: Record<'sm' | 'md', number> = {
  sm: 16,
  md: 20,
}

export function ColorSwatchStack({
  colors,
  maxVisible = 3,
  size = 'md',
  showCount = true,
  className,
  label,
}: ColorSwatchStackProps) {
  const palette = mergeColorValues(colors ?? [])
  if (palette.length === 0) {
    return null
  }

  const visible = palette.slice(0, Math.max(1, maxVisible))
  const dimension = SIZE_MAP[size]
  const overlap = Math.round(dimension / 2)
  const ariaLabel = label || `Renk seçenekleri ${palette.length} adet`

  return (
    <div
      className={cn('flex items-center gap-2 text-xs text-gray-600', className)}
      aria-label={ariaLabel}
      title={palette.join(', ')}
    >
      <div className="flex items-center" role="presentation">
        {visible.map((color, index) => (
          <span
            key={`${color}-${index}`}
            className="inline-flex items-center justify-center rounded-full border border-white shadow-sm"
            style={{
              width: dimension,
              height: dimension,
              marginLeft: index === 0 ? 0 : -overlap,
              background: color,
            }}
          >
            <span className="sr-only">{color}</span>
          </span>
        ))}
      </div>
      {showCount && (
        <span className="px-1.5 py-0.5 rounded-full bg-white/80 text-gray-600 border border-gray-200 leading-none font-medium">
          {palette.length}
        </span>
      )}
    </div>
  )
}
