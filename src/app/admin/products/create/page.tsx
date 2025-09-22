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
  const [categories, colors] = await Promise.all([fetchCategories(), listActiveColors()])

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
