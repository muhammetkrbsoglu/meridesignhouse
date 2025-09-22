export function normalizeColorValue(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const shortHexMatch = trimmed.match(/^#([0-9a-fA-F]{3,4})$/)
  if (shortHexMatch) {
    const hex = shortHexMatch[1]
    const expanded = hex
      .split('')
      .map((char) => char + char)
      .join('')
    const hasAlpha = expanded.length === 8
    const normalized = `#${expanded}`
    return hasAlpha ? normalized.toUpperCase() : normalized.slice(0, 7).toUpperCase()
  }

  const longHexMatch = trimmed.match(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  if (longHexMatch) {
    const hex = longHexMatch[0].toUpperCase()
    return hex.length === 9 ? hex : hex.slice(0, 7)
  }

  return trimmed
}

export function mergeColorValues(
  ...sources: Array<Array<string | null | undefined> | undefined>
): string[] {
  const palette: string[] = []
  const seen = new Set<string>()

  for (const source of sources) {
    if (!source) continue
    for (const raw of source) {
      const normalized = normalizeColorValue(raw ?? null)
      if (!normalized) continue
      const key = normalized.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      palette.push(normalized)
    }
  }

  return palette
}
