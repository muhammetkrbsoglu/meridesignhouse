import { notFound } from 'next/navigation'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ProductForm } from '@/components/admin/ProductForm'
import { fetchProductById, fetchCategories } from '@/lib/actions/products'
import { listActiveColors } from '@/lib/actions/colors'

export const metadata = {
  title: 'Ürün Düzenle | Admin Panel',
  description: 'Ürün düzenleme sayfası',
}

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id
  const [product, categories, colors] = await Promise.all([
    fetchProductById(id),
    fetchCategories(),
    listActiveColors(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="w-full">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-2xl font-bold">Ürün Düzenle</h1>
          </div>
          <div className="mt-4 md:mt-8">
            <ProductForm categories={categories} colors={colors} product={product} />
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}