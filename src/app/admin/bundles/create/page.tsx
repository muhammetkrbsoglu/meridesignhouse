"use client"
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
import { BundleForm } from '@/components/admin/BundleForm'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default function CreateBundlePage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yeni Set Oluştur</h1>
            <p className="text-muted-foreground">Etkinlik + Tema için 2-3 ürün seçin, isterseniz set fiyatı tanımlayın</p>
          </div>
          <BundleForm />
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}


