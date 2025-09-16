import { fetchBundlesByEventTheme, fetchAllActiveBundles } from '@/lib/actions/bundles'
import { fetchProductsFiltered } from '@/lib/actions/products'
import { fetchThemeStyles, fetchProductsForEventTheme } from '@/lib/actions/events'
import { fetchCategories } from '@/lib/actions/products'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import type { Metadata } from 'next'
import Link from 'next/link'
import { addBundleToCart } from '@/lib/actions/cart'
import { AddBundleButton } from '@/components/bundles/AddBundleButton'
import { Badge } from '@/components/ui/badge'
import { listActiveColors } from '@/lib/actions/colors'
import { ColorFilter } from '@/components/products/ColorFilter'
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete'
import { AutoSubmitNumberInput } from '@/components/products/AutoSubmitField'
import { SortDropdown } from '@/components/products/SortDropdown'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

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
  const colorsExpanded = sp?.colorsExpanded === '1'

  const [baseProducts, bundles, themeStyles, categories, productsForCounts, activeColors] = await Promise.all([
    fetchProductsFiltered(selectedColors, { categoryId, query, minPrice, maxPrice, inStockOnly, sort }),
    showBundles ? (eventId && themeId ? fetchBundlesByEventTheme(eventId, themeId) : fetchAllActiveBundles()) : Promise.resolve([]),
    fetchThemeStyles(),
    fetchCategories(),
    // For category counts: same filters except category
    fetchProductsFiltered(selectedColors, { query, minPrice, maxPrice, inStockOnly, sort }),
    listActiveColors(),
  ])

  // Build category tree (up to 3 levels)
  const categoryTree = (() => {
    const byParent: Record<string, any[]> = {}
    for (const c of categories as any[]) {
      const pid = c.parentId || 'root'
      if (!byParent[pid]) byParent[pid] = []
      byParent[pid].push(c)
    }
    const sortByName = (arr: any[]) => arr.sort((a,b) => String(a.name).localeCompare(String(b.name),'tr'))
    const root = sortByName(byParent['root'] || [])
    const tree = root.map(r => ({
      ...r,
      children: sortByName(byParent[r.id] || []).map(l2 => ({
        ...l2,
        children: sortByName(byParent[l2.id] || [])
      }))
    }))
    if (!catq) return tree
    const q = catq.toLowerCase()
    const filterTree = (node: any): any | null => {
      const nameMatch = String(node.name).toLowerCase().includes(q)
      const kids = (node.children || []).map(filterTree).filter(Boolean)
      if (nameMatch || kids.length) return { ...node, children: kids }
      return null
    }
    return tree.map(filterTree).filter(Boolean)
  })()

  const buildParams = (extra: Record<string,string>) => {
    const params: Record<string,string> = {
      ...(eventId ? { event: eventId } : {}),
      ...(themeId ? { theme: themeId } : {}),
      ...(showBundles ? { showBundles: '1' } : {}),
      ...(selectedColors.length ? { colors: selectedColors.join(',') } : {}),
      ...(minPrice !== undefined ? { minPrice: String(minPrice) } : {}),
      ...(maxPrice !== undefined ? { maxPrice: String(maxPrice) } : {}),
      ...(inStockOnly ? { stock: '1' } : {}),
      ...(sort ? { sort } : {}),
      ...(catq ? { catq } : {}),
      ...(query ? { query } : {}),
      // colorsExpanded removed from URL persistence since we now expand client-side
      ...extra,
    }
    return `/products?${new URLSearchParams(params).toString()}`
  }

  // Build counts per category id from productsForCounts
  const countsMap = (() => {
    const map: Record<string, number> = {}
    for (const p of productsForCounts as any[]) {
      const cid = p.categoryId
      map[cid] = (map[cid] || 0) + 1
    }
    return map
  })()

  // If event+theme provided, restrict products to assignments
  let products = baseProducts as any[]
  if (eventId && themeId) {
    const assignments = await fetchProductsForEventTheme(eventId, themeId)
    const allowedIds = new Set(assignments.map(a => a.product.id))
    products = baseProducts.filter((p: any) => allowedIds.has(p.id))
  }

  const currentThemePalette = (() => {
    if (!themeId) return [] as string[]
    const t = (themeStyles || []).find((t: any) => t.id === themeId)
    return t?.colors || []
  })()

  const hexToName: Record<string,string> = {}
  ;(activeColors as any[]).forEach((c: any) => { hexToName[(c.hex || '').toLowerCase()] = c.name })

  return (
    <CustomerLayout>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">
        {query ? `"${query}" için arama sonuçları` : 'Tüm Ürünler'}
      </h1>
      {query && (
        <p className="text-gray-600 mb-6">
          {products.length} ürün bulundu
        </p>
      )}

      {/* Active Filters Chips */}
      {(() => {
        const chips: Array<{ key: string; label: string; href: string }> = []
        // Query
        if (query) chips.push({ key: `q`, label: `Arama: "${query}"`, href: buildParams({ query: '' }) })
        // Category
        const categoryName = (() => {
          const arr = categories as any[]
          const f = arr.find((c: any) => c.id === categoryId)
          return f?.name as string | undefined
        })()
        if (categoryId && categoryName) chips.push({ key: `cat`, label: `Kategori: ${categoryName}` , href: buildParams({ category: '' }) })
        // Colors
        selectedColors.forEach((c) => {
          const name = hexToName[c.toLowerCase()] || c
          const rest = selectedColors.filter(x => x !== c).join(',')
          chips.push({ key: `color-${c}`, label: name, href: buildParams({ colors: rest }) })
        })
        // Prices
        if (minPrice !== undefined) chips.push({ key: 'min', label: `Min ₺${minPrice.toLocaleString('tr-TR')}`, href: buildParams({ minPrice: '' }) })
        if (maxPrice !== undefined) chips.push({ key: 'max', label: `Max ₺${maxPrice.toLocaleString('tr-TR')}`, href: buildParams({ maxPrice: '' }) })
        // Sort (optional clear back to popularity)
        if (sort && sort !== 'popularity') {
          const sortLabel = sort === 'newest' ? 'En yeni' : sort === 'oldest' ? 'En eski' : sort === 'price-asc' ? 'Fiyat artan' : sort === 'price-desc' ? 'Fiyat azalan' : 'İsme göre'
          chips.push({ key: 'sort', label: `Sırala: ${sortLabel}`, href: buildParams({ sort: 'popularity' }) })
        }
        if (chips.length === 0) return null
        const clearAllHref = buildParams({ query: '', category: '', colors: '', minPrice: '', maxPrice: '', sort: 'popularity' })
        return (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap md:flex-wrap md:whitespace-normal">
              {chips.map(ch => (
                <a key={ch.key} href={ch.href} className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
                  <span>{ch.label}</span>
                  <span className="text-rose-500">×</span>
                </a>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Filters */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <div className="bg-white rounded-xl border p-4">
            {/* Arama Terimi */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-3">Arama</h3>
              <SearchAutocomplete placeholder="Ürün, kategori veya set ara..." />

              {/* Üst Filtreler: Min/Max fiyat ve Sıralama (server-side) */}
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {/* Min price */}
                  <AutoSubmitNumberInput
                    action="/products"
                    name="minPrice"
                    defaultValue={minPrice ?? ''}
                    step="0.01"
                    label="Min fiyat"
                    hidden={[
                      { name: 'colors', value: selectedColors.join(',') },
                      ...(eventId ? [{ name: 'event', value: eventId }] : []),
                      ...(themeId ? [{ name: 'theme', value: themeId }] : []),
                      ...(categoryId ? [{ name: 'category', value: categoryId }] : []),
                      ...(sort ? [{ name: 'sort', value: sort }] : []),
                      ...(maxPrice !== undefined ? [{ name: 'maxPrice', value: String(maxPrice) }] : []),
                      ...(query ? [{ name: 'query', value: query }] : []),
                    ]}
                  />
                  {/* Max price */}
                  <AutoSubmitNumberInput
                    action="/products"
                    name="maxPrice"
                    defaultValue={maxPrice ?? ''}
                    step="0.01"
                    label="Max fiyat"
                    hidden={[
                      { name: 'colors', value: selectedColors.join(',') },
                      ...(eventId ? [{ name: 'event', value: eventId }] : []),
                      ...(themeId ? [{ name: 'theme', value: themeId }] : []),
                      ...(categoryId ? [{ name: 'category', value: categoryId }] : []),
                      ...(sort ? [{ name: 'sort', value: sort }] : []),
                      ...(minPrice !== undefined ? [{ name: 'minPrice', value: String(minPrice) }] : []),
                      ...(query ? [{ name: 'query', value: query }] : []),
                    ]}
                  />
                </div>
                {/* Sort - custom dropdown */}
                <div className="flex justify-end">
                  <SortDropdown current={sort} />
                </div>
              </div>
            </div>

            {/* Kategori Filtresi */}
            <h3 className="text-sm font-semibold mb-3">Kategori</h3>
            <form action="/products" className="mb-4 space-y-2">
              <input type="hidden" name="bundleFilter" value={bundleFilter} />
              {eventId && <input type="hidden" name="event" value={eventId} />}
              {themeId && <input type="hidden" name="theme" value={themeId} />} 
              {selectedColors.length > 0 && (<input type="hidden" name="colors" value={selectedColors.join(',')} />)}
              {minPrice !== undefined && (<input type="hidden" name="minPrice" value={String(minPrice)} />)}
              {maxPrice !== undefined && (<input type="hidden" name="maxPrice" value={String(maxPrice)} />)}
              {sort && (<input type="hidden" name="sort" value={sort} />)}
              {query && (<input type="hidden" name="query" value={query} />)}
              <input className="w-full border rounded-md px-2 py-1 text-xs" name="catq" placeholder="Kategori ara" defaultValue={catq} />
              <div className="max-h-64 overflow-auto border rounded-md p-2 text-sm">
                <a className={`block px-2 py-1 rounded ${!categoryId ? 'bg-gray-100' : ''}`} href={buildParams({})}>Tüm kategoriler</a>
                {categoryTree.map((c: any) => (
                  <details key={c.id} open={[c.id, ...(c.children||[]).flatMap((x:any)=>[x.id, ...(c.children||[]).map((y:any)=>y.id)])].includes(categoryId || '')}>
                    <summary className="cursor-pointer px-2 py-1 hover:bg-gray-50 rounded flex items-center justify-between">
                      <span>{c.name}</span>
                      <span className="text-xs text-gray-500">{countsMap[c.id] || 0}</span>
                    </summary>
                    <div className="ml-3">
                      <a className={`px-2 py-1 rounded flex items-center justify-between ${categoryId===c.id ? 'bg-gray-100' : ''}`} href={buildParams({ category: c.id })}>
                        <span>{c.name}</span>
                        <span className="text-xs text-gray-500">{countsMap[c.id] || 0}</span>
                      </a>
                      {(c.children || []).map((s: any) => (
                        <details key={s.id} open={[s.id, ...(s.children||[]).map((g:any)=>g.id)].includes(categoryId || '')}>
                          <summary className="cursor-pointer px-2 py-1 hover:bg-gray-50 rounded flex items-center justify-between">
                            <span>— {s.name}</span>
                            <span className="text-xs text-gray-500">{countsMap[s.id] || 0}</span>
                          </summary>
                          <div className="ml-3">
                            <a className={`px-2 py-1 rounded flex items-center justify-between ${categoryId===s.id ? 'bg-gray-100' : ''}`} href={buildParams({ category: s.id })}>
                              <span>— {s.name}</span>
                              <span className="text-xs text-gray-500">{countsMap[s.id] || 0}</span>
                            </a>
                            {(s.children || []).map((g: any) => (
                              <a key={g.id} className={`px-2 py-1 rounded flex items-center justify-between ${categoryId===g.id ? 'bg-gray-100' : ''}`} href={buildParams({ category: g.id })}>
                                <span>—— {g.name}</span>
                                <span className="text-xs text-gray-500">{countsMap[g.id] || 0}</span>
                              </a>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <a href={`/products?${new URLSearchParams({ ...(eventId ? { event: eventId } : {}), ...(themeId ? { theme: themeId } : {}), ...(showBundles ? { showBundles: '1' } : {}) }).toString() }`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Temizle
                </a>
              </div>
            </form>

            <h3 className="text-sm font-semibold mb-3">Renkler</h3>
            {/* Selected chips */}
            {selectedColors.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Seçili {selectedColors.length} renk</span>
                  <a
                    href={buildParams({ colors: '' })}
                    className="text-xs text-rose-600 hover:underline"
                  >Hepsini temizle</a>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedColors.map(c => (
                    <a
                      key={c}
                      href={buildParams({ colors: selectedColors.filter(x => x !== c).join(',') })}
                      className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border bg-rose-50 border-rose-200 text-rose-700"
                    >
                      <span className="inline-block w-3 h-3 rounded-full border" style={{ backgroundColor: c }} />
                      {hexToName[c.toLowerCase()] || c}
                      <span className="ml-1">×</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {/* Colors auto-applied */}
            <ColorFilter 
              colorSuggestions={(activeColors as any[]).map((c: any) => c.hex)}
              selectedColors={selectedColors}
              hexToName={hexToName}
              initialVisible={6}
            />

            {/* Removed: Stock filter and lower price/sort section */}
          </div>
        </aside>

        {/* Right Column Content */}
        <div className="col-span-12 md:col-span-9 lg:col-span-9">

          {showBundles && Array.isArray(bundles) && bundles.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Setler</h2>
                <span className="text-sm text-gray-500">{bundles.length} set</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bundles.map((b) => (
                  <div key={b.id} className="group relative">
                    {/* Top title on white strip overlapping the card */}
                    <div className="flex items-center justify-center mb-0">
                      <div className="relative z-10 bg-white px-4 py-2 border-2 border-rose-500 rounded-md">
                        <Link href={`/bundles/${b.slug}`} className="text-rose-700 text-sm font-semibold group-hover:text-rose-600 transition-colors whitespace-nowrap">
                          {b.name}
                        </Link>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl border-2 border-rose-500 p-6 hover:shadow-lg transition-all relative -mt-2 h-80">

                    {/* Top right discount badge */}
                    {(() => {
                      const sum = (b.items || []).reduce((acc: number, it: any) => {
                        const unit = typeof it.product?.price === 'number' ? it.product.price : 0
                        const qty = it.quantity || 1
                        return acc + unit * qty
                      }, 0)
                      if (typeof b.bundlePrice === 'number') {
                        const adv = Math.max(0, Math.round(((sum - b.bundlePrice) / (sum || 1)) * 100))
                        return adv > 0 ? (
                          <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-rose-600 text-white text-[9px] leading-tight flex items-center justify-center shadow-lg z-10">
                            <div className="text-center">
                              <div className="font-bold">%{adv}</div>
                              <div>İNDİRİM</div>
                            </div>
                          </div>
                        ) : null
                      }
                      return null
                    })()}

                    <div className="flex flex-col gap-4 h-full">
                      {/* Center equal product images with plus signs */}
                      <Link href={`/bundles/${b.slug}`} className="flex-1">
                        <div className="flex items-center justify-center gap-6">
                          {(() => {
                            const items = (b.items || []).slice(0, 3)
                            return items.map((it, idx) => (
                              <div key={it.id} className="flex items-center gap-6">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-40 h-40 rounded-lg overflow-hidden flex items-center justify-center">
                                    {it.product?.images?.[0]?.url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={it.product.images[0].url} alt={it.product?.name || ''} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100" />
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 text-center max-w-[120px]">
                                    {it.product?.name || ''}
                                  </div>
                                </div>
                                {idx < items.length - 1 && (
                                  <div className="flex items-center justify-center h-40">
                                    <span className="text-rose-600 font-bold text-4xl">+</span>
                                  </div>
                                )}
                              </div>
                            ))
                          })()}
                        </div>
                      </Link>

                      {/* Bottom section - Price and CTA */}
                      <div className="flex items-center justify-center gap-6">
                        <div className="w-12"></div>
                        <div>
                          {/* Client button for toast and UI refresh */}
                          { }
                          <AddBundleButton bundleId={b.id} fullWidth={false} />
                        </div>
                        <div className="text-left">
                          {(() => {
                            const sum = (b.items || []).reduce((acc: number, it: any) => {
                              const unit = typeof it.product?.price === 'number' ? it.product.price : 0
                              const qty = it.quantity || 1
                              return acc + unit * qty
                            }, 0)
                            return (
                              <div className="space-y-1">
                                <div className="text-gray-400 line-through text-base">₺{sum.toLocaleString('tr-TR')}</div>
                                {typeof b.bundlePrice === 'number' && (
                                  <div className="text-rose-700 font-semibold text-xl">₺{b.bundlePrice.toLocaleString('tr-TR')}</div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showProducts && <ProductGrid products={products as any} />}
        </div>
      </div>
    </div>
    </CustomerLayout>
  )
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  const entries = Object.entries(sp || {})
  const hasOnlyPage = entries.length === 1 && entries[0][0] === 'page'
  const hasFilters = entries.some(([key, val]) => key !== 'page' && typeof val !== 'undefined' && String(val).length > 0)

  const robots = hasFilters ? { index: false, follow: true } : { index: true, follow: true }

  // Canonical logic: filters -> base canonical; only pagination -> self-canonical; none -> base
  const base = 'https://meridesignhouse.com/products'
  const canonical = hasFilters
    ? base
    : hasOnlyPage && sp?.page
      ? `${base}?page=${sp.page}`
      : base

  return {
    title: sp?.query ? `"${sp.query}" için arama sonuçları | Meri Design House` : 'Tüm Ürünler | Meri Design House',
    description: 'Tüm ürünleri keşfedin. Renk, fiyat ve sıralama filtreleriyle aramanızı daraltın.',
    robots,
    alternates: { canonical },
  }
}