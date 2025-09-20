'use server'

import { logger } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase'

export interface SearchSuggestion {
  id: string
  name: string
  type: 'product' | 'category' | 'bundle'
  slug?: string
  image?: string
  price?: number
}

export interface SearchSuggestionsResult {
  suggestions: SearchSuggestion[]
  hadError: boolean
}

type ProductSuggestionRow = {
  id: string
  name: string
  slug: string
  price: unknown
  product_images?: Array<{ url: string | null; sortOrder: number | null }> | null
}

type CategorySuggestionRow = {
  id: string
  name: string
  slug: string
}

type BundleSuggestionRow = {
  id: string
  name: string
  slug: string
  image: string | null
  bundleprice: unknown
}

function escapeForIlike(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

function normalizeNumeric(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const parsed = Number(trimmed)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  if (typeof value === 'object' && value !== null) {
    const maybeToString = (value as { toString?: () => string }).toString
    if (typeof maybeToString === 'function') {
      const stringValue = maybeToString.call(value)
      if (!stringValue) return undefined
      const parsed = Number(stringValue)
      return Number.isNaN(parsed) ? undefined : parsed
    }
  }

  return undefined
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestionsResult> {
  const trimmedQuery = query?.trim() ?? ''

  if (trimmedQuery.length < 2) {
    return { suggestions: [], hadError: false }
  }

  const searchPattern = `%${escapeForIlike(trimmedQuery)}%`
  const orFilter = [`name.ilike.${searchPattern}`, `description.ilike.${searchPattern}`, `slug.ilike.${searchPattern}`].join(",")

  try {
    const supabase = getSupabaseAdmin()

    const [productResponse, categoryResponse, bundleResponse] = await Promise.all([
      supabase
        .from('products')
        .select(`id, name, slug, price, isActive, product_images(url, sortOrder)`)
        .eq('isActive', true)
        .or(orFilter)
        .order('createdAt', { ascending: false })
        .limit(5),
      supabase
        .from('categories')
        .select('id, name, slug, description, isActive')
        .eq('isActive', true)
        .or(orFilter)
        .order('name', { ascending: true })
        .limit(3),
      supabase
        .from('bundles')
        .select('id, name, slug, description, image, bundleprice, isactive, sortorder')
        .eq('isactive', true)
        .or(orFilter)
        .order('sortorder', { ascending: true })
        .limit(3)
    ])

    const productError = Boolean(productResponse.error)
    const categoryError = Boolean(categoryResponse.error)
    const bundleError = Boolean(bundleResponse.error)

    if (productResponse.error) {
      logger.error('Error fetching product suggestions:', productResponse.error)
    }

    if (categoryResponse.error) {
      logger.error('Error fetching category suggestions:', categoryResponse.error)
    }

    if (bundleResponse.error) {
      logger.error('Error fetching bundle suggestions:', bundleResponse.error)
    }

    const suggestions: SearchSuggestion[] = []

    if (!productError && Array.isArray(productResponse.data)) {
      const rows = productResponse.data as ProductSuggestionRow[]
      suggestions.push(
        ...rows.map((product) => {
          const images = Array.isArray(product.product_images)
            ? [...product.product_images].sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
            : []

          return {
            id: product.id,
            name: product.name,
            type: 'product' as const,
            slug: product.slug,
            image: images[0]?.url ?? undefined,
            price: normalizeNumeric(product.price)
          }
        })
      )
    }

    if (!categoryError && Array.isArray(categoryResponse.data)) {
      const rows = categoryResponse.data as CategorySuggestionRow[]
      suggestions.push(
        ...rows.map((category) => ({
          id: category.id,
          name: category.name,
          type: 'category' as const,
          slug: category.slug
        }))
      )
    }

    if (!bundleError && Array.isArray(bundleResponse.data)) {
      const rows = bundleResponse.data as BundleSuggestionRow[]
      suggestions.push(
        ...rows.map((bundle) => ({
          id: bundle.id,
          name: bundle.name,
          type: 'bundle' as const,
          slug: bundle.slug,
          image: bundle.image ?? undefined,
          price: normalizeNumeric(bundle.bundleprice)
        }))
      )
    }

    const hadError = productError || categoryError || bundleError

    return { suggestions, hadError }
  } catch (_error) {
    logger.error('Error fetching search suggestions:', _error)
    return { suggestions: [], hadError: true }
  }
}

export async function getPopularSearches(): Promise<string[]> {
  return [
    'dugun susleri',
    'dogum gunu',
    'cicek aranjmani'
  ]
}

export async function logSearch(query: string, userId?: string) {
  try {
    logger.info(`Search logged: ${query} by user: ${userId || 'anonymous'}`)
  } catch (error) {
    logger.error('Error logging search:', error)
  }
}




