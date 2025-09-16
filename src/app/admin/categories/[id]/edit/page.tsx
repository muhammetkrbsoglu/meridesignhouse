import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { CategoryForm } from '@/components/admin/CategoryForm'
import { fetchCategoryById, fetchAllCategoriesForParent } from '@/lib/actions/categories'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Kategori Düzenle | Admin Panel',
  description: 'Kategori düzenleme sayfası',
}

interface EditCategoryPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  
  const [category, parentCategories] = await Promise.all([
    fetchCategoryById(id),
    fetchAllCategoriesForParent()
  ])

  if (!category) {
    notFound()
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="w-full">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-2xl font-bold">Kategori Düzenle</h1>
          </div>
          <div className="mt-4 md:mt-8">
            <CategoryForm category={category} parentCategories={parentCategories} />
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}