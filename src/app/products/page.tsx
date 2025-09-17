import { fetchBundlesByEventTheme, fetchAllActiveBundles } from '@/lib/actions/bundles'
import { fetchProductsFiltered } from '@/lib/actions/products'
import { fetchThemeStyles, fetchProductsForEventTheme } from '@/lib/actions/events'
import { fetchCategories } from '@/lib/actions/products'
import { ProductsPageClient } from '@/components/products/ProductsPageClient'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import type { Metadata } from 'next'
import { listActiveColors } from '@/lib/actions/colors'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const revalidate = 120

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams
  const event = typeof sp?.event === 'string' ? sp?.event : undefined
  const theme = typeof sp?.theme === 'string' ? sp?.theme : undefined

  // We need IDs to query bundles; for now assume event/theme are IDs if provided.
  // Later we can map slugs->IDs if needed.
  const eventId = event
  const themeId = theme

  const bundleFilter = typeof sp?.bundleFilter === 'string' ? sp?.bundleFilter : 'all'
  const showBundles = bundleFilter === 'all' || bundleFilter === 'bundles'
  const showProducts = bundleFilter === 'all' || bundleFilter === 'products'

  const selectedColors = typeof sp?.colors === 'string' ? (sp?.colors as string).split(',').filter(Boolean) : []
  const categoryId = typeof sp?.category === 'string' ? sp?.category : undefined
  const catq = typeof sp?.catq === 'string' ? sp?.catq : ''
  const minPrice = typeof sp?.minPrice === 'string' ? Number(sp?.minPrice) : undefined
  const maxPrice = typeof sp?.maxPrice === 'string' ? Number(sp?.maxPrice) : undefined
  const inStockOnly = sp?.stock === '1'
  const sort = (typeof sp?.sort === 'string' ? sp?.sort : 'popularity') as 'popularity' | 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name'
  const query = typeof sp?.query === 'string' ? sp?.query : ''

  const [baseProducts, bundles, themeStyles, categories, productsForCounts, activeColors] = await Promise.all([
    fetchProductsFiltered(selectedColors, { categoryId, query, minPrice, maxPrice, inStockOnly, sort }),
    showBundles ? (eventId && themeId ? fetchBundlesByEventTheme(eventId, themeId) : fetchAllActiveBundles()) : Promise.resolve([]),
    fetchThemeStyles(),
    fetchCategories(),
    // For category counts: same filters except category
    fetchProductsFiltered(selectedColors, { query, minPrice, maxPrice, inStockOnly, sort }),
    listActiveColors(),
  ])

  // If event+theme provided, restrict products to assignments
  let products = baseProducts as any[]
  if (eventId && themeId) {
    const assignments = await fetchProductsForEventTheme(eventId, themeId)
    const allowedIds = new Set(assignments.map(a => a.product.id))
    products = baseProducts.filter((p: any) => allowedIds.has(p.id))
  }

  const hexToName: Record<string,string> = {}
  ;(activeColors as any[]).forEach((c: any) => { hexToName[(c.hex || '').toLowerCase()] = c.name })

  const colorSuggestions = (activeColors as any[]).map((c: any) => String(c.hex)).filter(Boolean)

  return (
    <CustomerLayout>
      <ProductsPageClient
        products={products}
        bundles={bundles}
        categories={categories}
        activeColors={activeColors as any[]}
        colorSuggestions={colorSuggestions}
        hexToName={hexToName}
              selectedColors={selectedColors}
        categoryId={categoryId}
        minPrice={minPrice}
        maxPrice={maxPrice}
        sort={sort}
        query={query}
        inStockOnly={inStockOnly}
        totalResults={products.length}
        bundleFilter={bundleFilter}
        eventId={eventId}
        themeId={themeId}
      />
    </CustomerLayout>
  )
}

export const metadata: Metadata = {
  title: 'Ürünler | Meri Design House',
  description: 'El yapımı dekoratif ürünler, özel tasarım parçalar ve ev dekorasyonu için benzersiz koleksiyonlar.',
  keywords: 'el yapımı dekoratif ürünler, özel tasarım, ev dekorasyonu, benzersiz koleksiyonlar',
  openGraph: {
    title: 'Ürünler | Meri Design House',
    description: 'El yapımı dekoratif ürünler, özel tasarım parçalar ve ev dekorasyonu için benzersiz koleksiyonlar.',
    type: 'website',
  },
}