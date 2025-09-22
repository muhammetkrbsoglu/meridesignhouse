import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ProductForm } from '@/components/admin/ProductForm'
import { fetchCategories } from '@/lib/actions/products'
import { listActiveColors } from '@/lib/actions/colors'

export const metadata = {
  title: 'Ürün Ekle | Admin Panel',
  description: 'Yeni ürün ekleme sayfası',
}

export default async function CreateProductPage() {
  let categories, colors
  
  try {
    [categories, colors] = await Promise.all([
      fetchCategories(), 
      listActiveColors()
    ])
  } catch (error) {
    console.error('CRITICAL ERROR - Product Creation Page Data Loading Failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      page: 'admin/products/create',
      action: 'fetchCategories_and_listActiveColors'
    })
    
    // Fallback data to prevent page crash
    categories = []
    colors = []
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="w-full">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-2xl font-bold">Ürün Ekle</h1>
          </div>
          <div className="mt-4 md:mt-8">
            <ProductForm categories={categories} colors={colors} />
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
