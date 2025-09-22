import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ProductsGrid } from '@/components/admin/ProductsGrid'
import { ProductsTableSkeleton } from '@/components/admin/ProductsTableSkeleton'
import { Search } from '@/components/admin/Search'
import { Pagination } from '@/components/admin/Pagination'
import { fetchProductsPages } from '@/lib/actions/products'

export const metadata = {
  title: 'Ürünler | Admin Panel',
  description: 'Ürün yönetimi sayfası',
}

export const revalidate = 60 // 1 dakika cache
export const dynamic = 'auto' // Cache'i kullan

interface PageProps {
  searchParams?: {
    query?: string
    page?: string
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams?.query || ''
  const currentPage = Number(resolvedSearchParams?.page) || 1

  let totalPages = 1
  
  try {
    totalPages = await fetchProductsPages(query)
  } catch (error) {
    console.error('CRITICAL ERROR - Products Page Data Loading Failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      page: 'admin/products',
      action: 'fetchProductsPages',
      query: query,
      currentPage: currentPage
    })
    
    // Fallback to prevent page crash
    totalPages = 1
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="w-full">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-2xl font-bold">Ürünler</h1>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
            <Search placeholder="Ürün ara..." />
            <Link href="/admin/products/create">
              <Button className="flex h-10 items-center rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2">
                <span className="hidden md:block">Ürün Ekle</span>
                <Plus className="h-5 md:ml-4" />
              </Button>
            </Link>
          </div>
          {/* Grid görünümü (varsayılan) */}
          <Suspense key={`grid-${query}-${currentPage}`} fallback={<ProductsTableSkeleton />}>
            <ProductsGrid query={query} currentPage={currentPage} />
          </Suspense>
          <div className="mt-5 flex w-full justify-center">
            <Pagination totalPages={totalPages} />
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
