"use client"

import React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface ColorFilterProps {
  colorSuggestions: string[]
  selectedColors: string[]
  hexToName: Record<string, string>
  initialVisible?: number
}

export function ColorFilter({
  colorSuggestions,
  selectedColors,
  hexToName,
  initialVisible = 6,
}: ColorFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [expanded, setExpanded] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const normalized = React.useMemo(() => {
    return colorSuggestions.map((hex) => ({
      hex,
      key: `all-${hex}`,
      value: hex.toLowerCase(),
      name: (hexToName[hex.toLowerCase()] || hex.toLowerCase()).toLowerCase(),
    }))
  }, [colorSuggestions, hexToName])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return normalized
    return normalized.filter((c) => c.name.includes(q) || c.value.includes(q))
  }, [normalized, search])

  const visible = React.useMemo(() => {
    if (expanded || search.trim().length > 0) return filtered
    return filtered.slice(0, initialVisible)
  }, [expanded, filtered, search, initialVisible])

  const hasMore = filtered.length > initialVisible

  const toggleColor = (hexValue: string) => {
    const value = hexValue.toLowerCase()
    const current = new Set<string>(selectedColors)
    if (current.has(value)) current.delete(value)
    else current.add(value)
    const nextColors = Array.from(current)

    const params = new URLSearchParams(searchParams.toString())
    if (nextColors.length > 0) params.set('colors', nextColors.join(','))
    else params.delete('colors')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-gray-500">Tüm renkler</div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Renk ara..."
            className="border rounded-md px-2 py-1 text-xs w-36"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((c) => {
          const active = selectedColors.includes(c.value)
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => toggleColor(c.value)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${active ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-gray-200 text-gray-700'}`}
              title={c.value}
            >
              <span className="inline-block w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }} />
              {hexToName[c.value] || c.value}
            </button>
          )
        })}
        {!expanded && hasMore && search.trim().length === 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            Tüm renkleri gör
          </button>
        )}
        {expanded && search.trim().length === 0 && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            Renkleri gizle
          </button>
        )}
      </div>
    </div>
  )
}

