import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { CategoryForm } from '@/components/admin/CategoryForm'
import { fetchAllCategoriesForParent } from '@/lib/actions/categories'

export const metadata = {
  title: 'Kategori Ekle | Admin Panel',
  description: 'Yeni kategori ekleme sayfası',
}

export default async function CreateCategoryPage() {
  const parentCategories = await fetchAllCategoriesForParent()

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="w-full">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-2xl font-bold">Kategori Ekle</h1>
          </div>
          <div className="mt-4 md:mt-8">
            <CategoryForm parentCategories={parentCategories} />
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}