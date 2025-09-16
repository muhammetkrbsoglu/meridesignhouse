import { notFound } from 'next/navigation'
import { BundleForm } from '@/components/admin/BundleForm'
import { fetchBundleById } from '@/lib/actions/bundles'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'

interface Props { params: { id: string } }

export default async function EditBundlePage({ params }: Props) {
  const { id } = await params
  const bundle = await fetchBundleById(id)
  if (!bundle) return notFound()

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Seti Düzenle</h1>
          <BundleForm
            bundleId={bundle.id}
            defaultValues={{
              name: bundle.name,
              description: bundle.description || '',
              image: bundle.image || '',
              eventTypeId: bundle.eventTypeId,
              themeStyleId: bundle.themeStyleId,
              bundlePrice: bundle.bundlePrice ?? undefined,
              isActive: bundle.isActive,
              sortOrder: bundle.sortOrder,
              items: bundle.items.map(it => ({ productId: it.productId, quantity: it.quantity, sortOrder: it.sortOrder }))
            }}
          />
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}


