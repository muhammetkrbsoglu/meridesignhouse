import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
export const revalidate = 120

import { fetchBundleBySlug, fetchBundlesByCategory } from '@/lib/actions/bundles'
import { addToCart } from '@/lib/actions/cart'
import { fetchFeaturedProducts, fetchNewArrivals } from '@/lib/actions/products'
import Link from 'next/link'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { ProductMiniCard } from '@/components/products/ProductMiniCard'
import { AddBundleButton } from '@/components/bundles/AddBundleButton'
import { BundleStructuredData } from '@/components/seo/BundleStructuredData'
import { generateAltText } from '@/lib/seo/alt'
import Image from 'next/image'

const BLUR_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

interface Props { params: Promise<{ slug: string }> }

export default async function BundleDetailPage({ params }: Props) {
  const { slug } = await params
  const bundle = await fetchBundleBySlug(slug)
  if (!bundle) return notFound()
  const [similarBundles, featured, newArrivals] = await Promise.all([
    bundle.categoryId ? fetchBundlesByCategory(bundle.categoryId) : Promise.resolve([]),
    fetchFeaturedProducts(6),
    fetchNewArrivals(6),
  ])

  return (
    <CustomerLayout>
    <BundleStructuredData bundle={bundle} />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-700">Set</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900">{bundle.name}</h1>
        {bundle.description && <p className="text-stone-600 mt-1 max-w-2xl">{bundle.description}</p>}
      </div>

      {/* Content grid (2'li ve 3'lü setler için farklılaşır) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="mb-4">
            {(() => {
              const imgs = (bundle.items || []).map(it => it.product?.images?.[0]?.url).filter(Boolean) as string[]
              if ((bundle.items || []).length === 2) {
                // İki ürün → iki kompakt kart (fiyat yok)
                const [i1, i2] = bundle.items
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProductMiniCard
                      slug={i1?.product?.slug}
                      name={i1?.product?.name}
                      imageUrl={i1?.product?.images?.[0]?.url}
                      quantity={i1?.quantity || 1}
                    />
                    <ProductMiniCard
                      slug={i2?.product?.slug}
                      name={i2?.product?.name}
                      imageUrl={i2?.product?.images?.[0]?.url}
                      quantity={i2?.quantity || 1}
                    />
                  </div>
                )
              }
              // 3+ ürün → 2+1 galeri
              const a = imgs[0]
              const b1 = imgs[1]
              const c = imgs[2]
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 aspect-[4/3] rounded-xl overflow-hidden shadow-lg bg-stone-100">
                    {a && (
                      <Image src={a} alt={generateAltText({ prefix: 'Set görseli', fallback: 'Set görseli' })} fill sizes="(min-width: 768px) 66vw, 100vw" className="object-contain md:object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} priority />
                    )}
                  </div>
                  <div className="grid grid-rows-2 gap-4">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-100">
                      {b1 && (
                        <Image src={b1} alt={generateAltText({ prefix: 'Set görseli', fallback: 'Set görseli' })} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-contain md:object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                      )}
                    </div>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-100">
                      {c && (
                        <Image src={c} alt={generateAltText({ prefix: 'Set görseli', fallback: 'Set görseli' })} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-contain md:object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
          {/* 3'lü setlerde: ürün listesi kartları */}
          {bundle.items.length !== 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {bundle.items.map(it => (
                <div key={it.id} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded bg-gray-100 overflow-hidden">
                      {it.product?.images?.[0]?.url && (
                        <Image src={it.product.images[0].url} alt={generateAltText({ name: it.product?.name, prefix: 'Ürün görseli' })} width={64} height={64} className="w-full h-full object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/products/${it.product?.slug || ''}`} className="font-medium hover:underline line-clamp-1">{it.product?.name}</Link>
                      <div className="text-sm text-muted-foreground">Adet: {it.quantity}</div>
                    </div>
                  </div>
                  {typeof it.product?.price === 'number' && (
                    <div className="text-sm whitespace-nowrap">₺{(it.product.price * (it.quantity || 1)).toLocaleString('tr-TR')}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ taraf: 2'li sette içerik listesi + fiyat tek kartta, 3'lü sette yapışkan özet */}
        <aside className="md:col-span-1">
          {bundle.items.length === 2 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Set İçeriği</h3>
              <div className="space-y-4">
                {bundle.items.map(it => (
                  <div key={it.id} className="flex items-center gap-4 p-4 rounded-lg border border-stone-200 bg-white hover:border-rose-200 transition-colors">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100">
                      {it.product?.images?.[0]?.url && (
                        <Image src={it.product.images[0].url} alt={generateAltText({ name: it.product?.name, prefix: 'Ürün görseli' })} width={64} height={64} className="w-full h-full object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-gray-900 font-semibold line-clamp-1 hover:text-rose-600 transition-colors">{it.product?.name}</div>
                      <div className="text-sm text-gray-600">Adet: {it.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
              {(() => {
                const sum = (bundle.items || []).reduce((acc: number, it: any) => {
                  const unit = typeof it.product?.price === 'number' ? it.product.price : 0
                  const qty = it.quantity || 1
                  return acc + unit * qty
                }, 0)
                const hasBundle = typeof bundle.bundlePrice === 'number'
                const save = hasBundle ? Math.max(0, sum - (bundle.bundlePrice as number)) : 0
                const savePct = hasBundle ? Math.max(0, Math.round(((sum - (bundle.bundlePrice as number)) / (sum || 1)) * 100)) : 0
                return (
                  <div className="mt-6 pt-6 border-t border-stone-200 space-y-3">
                    <div className="flex justify-between text-sm text-stone-600">
                      <span>Liste Fiyatı</span>
                      <span className="line-through">₺{sum.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-stone-900">
                      <span>Set Fiyatı</span>
                      {typeof bundle.bundlePrice === 'number' && (
                        <span className="text-rose-600">₺{bundle.bundlePrice.toLocaleString('tr-TR')}</span>
                      )}
                    </div>
                    {hasBundle && savePct > 0 && (
                      <div className="flex justify-between text-sm font-semibold text-rose-600">
                        <span>Kazancınız</span>
                        <span>₺{save.toLocaleString('tr-TR')} (%{savePct})</span>
                      </div>
                    )}
                  </div>
                )
              })()}
              <div className="mt-6">
                <AddBundleButton bundleId={bundle.id} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-6 shadow-sm md:sticky md:top-24">
              {(() => {
                const sum = (bundle.items || []).reduce((acc: number, it: any) => {
                  const unit = typeof it.product?.price === 'number' ? it.product.price : 0
                  const qty = it.quantity || 1
                  return acc + unit * qty
                }, 0)
                const hasBundle = typeof bundle.bundlePrice === 'number'
                const save = hasBundle ? Math.max(0, sum - (bundle.bundlePrice as number)) : 0
                const savePct = hasBundle ? Math.max(0, Math.round(((sum - (bundle.bundlePrice as number)) / (sum || 1)) * 100)) : 0
                return (
                  <div className="space-y-1 text-right">
                    {hasBundle && savePct > 0 && (
                      <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        %{savePct} avantaj • ₺{save.toLocaleString('tr-TR')}
                      </div>
                    )}
                    <div className="text-stone-500 line-through text-sm">₺{sum.toLocaleString('tr-TR')}</div>
                    {typeof bundle.bundlePrice === 'number' && (
                      <div className="text-rose-600 font-extrabold text-2xl">₺{bundle.bundlePrice.toLocaleString('tr-TR')}</div>
                    )}
                    <div className="text-xs text-stone-500">{(bundle.items || []).length} ürün içerir</div>
                  </div>
                )
              })()}
              <div className="mt-3">
                <AddBundleButton bundleId={bundle.id} />
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Benzer Setler & Tamamlayıcı Ürünler */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <h2 className="text-2xl font-bold text-stone-900 mb-6">Benzer Setler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(similarBundles || [])
              .filter((b) => b.id !== bundle.id)
              .slice(0,4)
              .map((b) => (
                <div key={b.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-stone-200">
                  <Link href={`/bundles/${b.slug}`} className="block p-4">
                    <div className="flex items_center justify-center gap-6">
                      {(() => {
                        const items = (b.items || []).slice(0, 3)
                        return items.map((it, idx: number) => (
                          <div key={it.id} className="flex items-center gap-6">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-28 h-28 rounded-lg overflow-hidden flex items-center justify-center bg-stone-100">
                                {it.product?.images?.[0]?.url ? (
                                  <Image src={it.product.images[0].url} alt={generateAltText({ name: it.product?.name, prefix: 'Ürün görseli' })} width={160} height={160} className="w-full h-full object_cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                                ) : (
                                  <div className="w-full h-full bg-gray-100" />
                                )}
                              </div>
                            </div>
                            {idx < items.length - 1 && (
                              <span className="text-rose-600 font-bold text-2xl">+</span>
                            )}
                          </div>
                        ))
                      })()}
                    </div>
                    <div className="mt-4 text-center text-base font-semibold text-gray-900 line-clamp-2">{b.name}</div>
                    <div className="mt-3">
                      <span className="inline-flex items-center justify-center rounded-md bg-rose-600 text-white px-3 py-2 text-sm font-semibold hover:bg-rose-700 w-full">İncele</span>
                    </div>
                  </Link>
                </div>
              ))}
            {((similarBundles || []).filter((b:any)=>b.id!==bundle.id).length===0) && (
              <div className="text-sm text-stone-600">Benzer set bulunamadı.</div>
            )}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-stone-900 mb-6">Tamamlayıcı Ürünler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(() => {
              // Kategoriden bağımsız: anasayfadaki öne çıkanlardan 2 + yeni gelenlerden 2
              const excludeIds = new Set<string>((bundle.items || []).map((it: { productId: string }) => it.productId))
              // Rastgele sırala, tekrarı engelle
              const shuffle = <T,>(arr: T[]) => arr.map(v => ({ v, r: Math.random() }))
                .sort((a,b) => a.r - b.r).map(({ v }) => v)
              const a = shuffle((featured || []).filter((p)=>!excludeIds.has(p.id))).slice(0,2)
              const seen = new Set<string>(a.map((p)=>p.id))
              const b = shuffle((newArrivals || []).filter((p)=>!excludeIds.has(p.id) && !seen.has(p.id))).slice(0,2)
              const items = [...a, ...b]
              return items.map((p) => {
                const hasImageUrl = (obj: unknown): obj is { imageUrl: string } =>
                  !!obj && typeof (obj as { imageUrl?: unknown }).imageUrl === 'string'
                const hasImagesArray = (obj: unknown): obj is { images: string[] } =>
                  !!obj && Array.isArray((obj as { images?: unknown }).images)
                const img = hasImageUrl(p)
                  ? p.imageUrl
                  : hasImagesArray(p)
                    ? p.images[0]
                    : undefined
                const priceNum = typeof p.price === 'number' ? p.price : Number(p.price)
                return (
                <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-stone-200">
                  <Link href={`/products/${p.slug}`} className="block">
                    <div className="relative h-40 bg-stone-100 overflow-hidden">
                      {img ? (
                        <Image src={img} alt={generateAltText({ name: p.name, prefix: 'Ürün görseli' })} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                      ) : null}
                    </div>
                  </Link>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/products/${p.slug}`} className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-rose-600">{p.name}</Link>
                      {Number.isFinite(priceNum) && (
                        <p className="text-rose-600 mt-1 font-semibold">₺{priceNum.toLocaleString('tr-TR')}</p>
                      )}
                    </div>
                    <form action={async () => { 'use server'; await addToCart(p.id, 1) }}>
                      <button className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50">Ekle</button>
                    </form>
                  </div>
                </div>
              )})
            })()}
            {((featured || []).length + (newArrivals || []).length === 0) && (
              <div className="text-sm text-stone-600">Öneri ürün bulunamadı.</div>
            )}
          </div>
        </section>
      </div>

    </div>
    </CustomerLayout>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  // Minimal başlık/description (gerekirse fetch ile zenginleştirilebilir)
  return {
    title: `Set | ${slug} | Meri Design House`,
    description: 'Set detaylarını keşfedin.',
    openGraph: {
      title: `Set | ${slug}`,
      description: 'Set detaylarını keşfedin.',
      type: 'website',
      images: [{ url: '/placeholder-product.jpg', width: 1200, height: 630, alt: 'Set görseli' }],
    },
  }
}


