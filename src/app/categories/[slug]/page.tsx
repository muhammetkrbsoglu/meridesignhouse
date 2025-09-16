import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { ProductGrid } from '@/components/products/ProductGrid';
// import { ProductGridSkeleton } from '@/components/products/ProductGridSkeleton';
import { CategoryFilters } from '@/components/categories/CategoryFilters';
import { Search } from '@/components/ui/Search';
import { Pagination } from '@/components/ui/Pagination';
import { CategoryStructuredData } from '@/components/seo/CategoryStructuredData';
import { 
  fetchCategoryBySlug, 
  fetchProductsByCategory, 
  fetchProductsCategoryPages,
  fetchPriceRange
} from '@/lib/actions/products';
import { fetchBundlesByCategory } from '@/lib/actions/bundles';
import { addBundleToCart } from '@/lib/actions/cart';

interface CategoryChild {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    query?: string;
    page?: string;
    sort?: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name' | 'popularity';
    minPrice?: string;
    maxPrice?: string;
  };
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const category = await fetchCategoryBySlug(params.slug);
  
  if (!category) {
    return {
      title: 'Kategori Bulunamadı',
    };
  }

  const entries = Object.entries(searchParams || {})
  const hasOnlyPage = entries.length === 1 && entries[0][0] === 'page'
  const hasFilters = entries.some(([key, val]) => key !== 'page' && typeof val !== 'undefined' && String(val).length > 0)

  const base = `https://meridesignhouse.com/categories/${category.slug}`
  const canonical = hasFilters
    ? base
    : hasOnlyPage && (searchParams?.page as string | undefined)
      ? `${base}?page=${searchParams?.page}`
      : base

  return {
    title: hasFilters
      ? `${category.name} Ürünleri - Filtrelenmiş Sonuçlar`
      : `${category.name} - MeriDesign`,
    description: category.description || `${category.name} kategorisindeki ürünleri keşfedin.`,
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    alternates: {
      canonical,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const sortBy = searchParams?.sort || 'newest';
  const minPrice = searchParams?.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams?.maxPrice ? Number(searchParams.maxPrice) : undefined;

  const category = await fetchCategoryBySlug(params.slug);
  
  if (!category) {
    notFound();
  }

  const [totalPages, products, priceRange, bundles] = await Promise.all([
    fetchProductsCategoryPages(params.slug, query, minPrice, maxPrice),
    fetchProductsByCategory(params.slug, currentPage, query, sortBy, minPrice, maxPrice),
    fetchPriceRange(params.slug),
    fetchBundlesByCategory(category.id)
  ]);

  return (
    <CustomerLayout>
      <CategoryStructuredData 
        category={{ name: category.name, slug: category.slug, description: category.description }}
        products={(products as any[]).map(p => ({ name: p.name, slug: p.slug, images: p.images, price: p.price }))}
      />
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Ana Sayfa
              </Link>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              {category.parent && (
                <>
                  <Link 
                    href={`/categories/${category.parent.slug}`} 
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {category.parent.name}
                  </Link>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </>
              )}
              <span className="text-gray-900 font-medium">{category.name}</span>
            </nav>
          </div>
        </div>

        {/* Category Header */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {category.description}
                </p>
              )}
              <div className="mt-4 text-sm text-gray-500">
                {category._count.products} ürün bulundu
              </div>
            </div>
          </div>
        </div>

        {/* Sub Categories */}
        {category.children.length > 0 && (
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Alt Kategoriler</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {category.children.map((child: CategoryChild) => (
                  <Link
                    key={child.id}
                    href={`/categories/${child.slug}`}
                    className="group block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors">
                      {child.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {child._count.products} ürün
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters and Products */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtreler</h3>
                
                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Ara
                  </label>
                  <Search placeholder="Ürün ara..." className="max-w-full" />
                </div>

                {/* Filters */}
                <CategoryFilters 
                  currentSort={sortBy}
                  minPrice={priceRange.min}
                  maxPrice={priceRange.max}
                  priceRange={[minPrice || priceRange.min, maxPrice || priceRange.max]}
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Bundles Section */}
              {bundles.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm mb-6">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Setler ({bundles.length})
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {bundles.map((bundle) => (
                        <div key={bundle.id} className="group relative">
                          {/* Top title on white strip overlapping the card */}
                          <div className="flex items-center justify-center mb-0">
                            <div className="relative z-10 bg-white px-4 py-2 border-2 border-rose-500 rounded-md">
                              <Link href={`/bundles/${bundle.slug}`} className="text-rose-700 text-sm font-semibold group-hover:text-rose-600 transition-colors whitespace-nowrap">
                                {bundle.name}
                              </Link>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-2xl border-2 border-rose-500 p-6 hover:shadow-lg transition-all relative -mt-2 h-80">
                            {/* Top right discount badge */}
                            {(() => {
                              const sum = (bundle.items || []).reduce((acc: number, it: any) => {
                                const unit = typeof it.product?.price === 'number' ? it.product.price : 0
                                const qty = it.quantity || 1
                                return acc + unit * qty
                              }, 0)
                              if (typeof bundle.bundlePrice === 'number') {
                                const adv = Math.max(0, Math.round(((sum - bundle.bundlePrice) / (sum || 1)) * 100))
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
                              <Link href={`/bundles/${bundle.slug}`} className="flex-1">
                                <div className="flex items-center justify-center gap-6">
                                  {(() => {
                                    const items = (bundle.items || []).slice(0, 3)
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
                                <div className="w-12"></div> {/* Empty space to balance layout */}
                                <form action={async () => { 'use server'; await addBundleToCart(bundle.id) }}>
                                  <button type="submit" className="inline-flex items-center justify-center rounded-md bg-rose-600 text-white px-6 py-3 text-base font-medium hover:bg-rose-700 transition-colors">
                                    Sepete Ekle
                                  </button>
                                </form>
                                <div className="text-left">
                                  {(() => {
                                    const sum = (bundle.items || []).reduce((acc: number, it: any) => {
                                      const unit = typeof it.product?.price === 'number' ? it.product.price : 0
                                      const qty = it.quantity || 1
                                      return acc + unit * qty
                                    }, 0)
                                    return (
                                      <div className="space-y-1">
                                        <div className="text-gray-400 line-through text-base">₺{sum.toLocaleString('tr-TR')}</div>
                                        {typeof bundle.bundlePrice === 'number' && (
                                          <div className="text-rose-700 font-semibold text-xl">₺{bundle.bundlePrice.toLocaleString('tr-TR')}</div>
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
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Ürünler {query && `"${query}" için`}
                    </h2>
                    <div className="text-sm text-gray-500">
                      Sayfa {currentPage} / {totalPages}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <Suspense fallback={<div className="text-center py-8">Yükleniyor...</div>}>
                    <ProductGrid products={products} />
                  </Suspense>
                  
                  {products.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m16 0l-2-2m2 2l-2 2M4 13l2-2m-2 2l2 2" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {query ? 'Arama sonucu bulunamadı' : 'Henüz ürün yok'}
                      </h3>
                      <p className="text-gray-500">
                        {query 
                          ? 'Farklı anahtar kelimeler deneyebilirsiniz.' 
                          : 'Bu kategoride henüz ürün bulunmuyor.'
                        }
                      </p>
                    </div>
                  )}
                </div>
                
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t">
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={totalPages} 
                      baseUrl={`/categories/${params.slug}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}