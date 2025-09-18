'use server'

import { prisma } from '../prisma'
import { logger } from '@/lib/logger'
import { Decimal } from '@prisma/client/runtime/library'
interface Product {
  id: string
  name: string
  slug: string
  images: { url: string }[]
  price: Decimal
}

interface Category {
  id: string
  name: string
  slug: string
}

export interface SearchSuggestion {
  id: string
  name: string
  type: 'product' | 'category' | 'bundle'
  slug?: string
  image?: string
  price?: number
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (!query || query.length < 2) {
    return []
  }

  try {
    const [products, categories, bundles] = await Promise.all([
      // Search products
      prisma.product.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
              ]
            },
            { isActive: true }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      
      // Search categories
      prisma.category.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
              ]
            },
            { isActive: true }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true
        },
        take: 3,
        orderBy: {
          name: 'asc'
        }
      }),

      // Search bundles (sets)
      prisma.bundles.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
              ]
            },
            { isactive: true }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          bundleprice: true,
          image: true
        },
        take: 3,
        orderBy: {
          sortorder: 'asc'
        }
      })
    ])

    const suggestions: SearchSuggestion[] = [
      ...products.map((product: Product) => ({
        id: product.id,
        name: product.name,
        type: 'product' as const,
        slug: product.slug,
        image: product.images?.[0]?.url || undefined,
        price: product.price.toNumber()
      })),
      ...categories.map((category: Category) => ({
        id: category.id,
        name: category.name,
        type: 'category' as const,
        slug: category.slug
      })),
      ...bundles.map((bundle: any) => ({
        id: bundle.id,
        name: bundle.name,
        type: 'bundle' as const,
        slug: bundle.slug,
        image: bundle.image || undefined,
        price: bundle.bundleprice ? (typeof bundle.bundleprice.toNumber === 'function' ? bundle.bundleprice.toNumber() : Number(bundle.bundleprice)) : undefined
      }))
    ]

    return suggestions
  } catch (_error) {
    logger.error('Error fetching search suggestions:', _error)
    return []
  }
}

export async function getPopularSearches(): Promise<string[]> {
  // Bu özellik gelecekte analytics verilerine dayalı olarak geliştirilebilir
  // Åimdilik sabit popüler aramalar döndürüyoruz
  return [
    'düğün süsleri',
    'doğum günü',
    'balon',
    'parti malzemeleri',
    'masa süsü',
    'çiçek aranjmanı'
  ]
}

export async function logSearch(query: string, userId?: string) {
  // Gelecekte search analytics için kullanılabilir
  try {
    // Analytics tablosu oluşturulduğunda burada log kaydı yapılacak
    logger.info(`Search logged: ${query} by user: ${userId || 'anonymous'}`)
  } catch (error) {
    logger.error('Error logging search:', error)
  }
}







