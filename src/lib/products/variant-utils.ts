import type { ProductVariant } from '@/types/product'

export type VariantSelectionMap = Record<string, string | null>

export const buildSelectionMap = (variant?: ProductVariant | null): VariantSelectionMap => {
  if (!variant?.optionValues || variant.optionValues.length === 0) {
    return {}
  }

  return variant.optionValues.reduce<VariantSelectionMap>((acc, value) => {
    acc[value.optionId] = value.valueId
    return acc
  }, {})
}

export const getVariantLabel = (variant?: ProductVariant | null): string | null => {
  if (!variant?.optionValues || variant.optionValues.length === 0) {
    return null
  }
  return variant.optionValues.map((value) => value.valueLabel || value.valueId).join(' / ')
}

export const findMatchingVariant = (
  variants: ProductVariant[],
  selections: VariantSelectionMap,
  optionId: string,
  valueId: string,
): ProductVariant | null => {
  if (variants.length === 0) return null

  const selectedEntries = Object.entries(selections).filter(([, id]) => Boolean(id)) as Array<[string, string]>
  const exactMatch = variants.find((variant) => {
    if (!variant.optionValues || variant.optionValues.length === 0) return false
    return selectedEntries.every(([selectedOptionId, selectedValueId]) =>
      variant.optionValues?.some((value) => value.optionId === selectedOptionId && value.valueId === selectedValueId),
    )
  })

  if (exactMatch) {
    return exactMatch
  }

  const pairMatch = variants.find((variant) =>
    variant.optionValues?.some((value) => value.optionId === optionId && value.valueId === valueId),
  )

  return pairMatch ?? variants[0] ?? null
}

export const getValueAvailability = (
  variants: ProductVariant[],
  selections: VariantSelectionMap,
  targetOptionId: string,
  targetValueId: string,
): boolean => {
  return variants.some((variant) => {
    if (!variant.isActive) return false

    const selectionMatches = Object.entries(selections).every(([optionId, valueId]) => {
      if (!valueId) return true
      if (optionId === targetOptionId) return true
      return variant.optionValues?.some((value) => value.optionId === optionId && value.valueId === valueId)
    })

    const includesTarget = variant.optionValues?.some(
      (value) => value.optionId === targetOptionId && value.valueId === targetValueId,
    )

    return selectionMatches && includesTarget
  })
}

export const toNumeric = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (value && typeof value === 'object') {
    if ('toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
      const result = (value as { toNumber: () => number }).toNumber()
      if (Number.isFinite(result)) {
        return result
      }
    }
    if ('toString' in value && typeof (value as { toString: () => string }).toString === 'function') {
      const parsed = Number((value as { toString: () => string }).toString())
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
