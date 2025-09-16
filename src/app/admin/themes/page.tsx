import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ThemeStylesTable } from '@/components/admin/ThemeStylesTable'
import { ThemeStylesTableSkeleton } from '@/components/admin/ThemeStylesTableSkeleton'

export const metadata = {
  title: 'Tema Stilleri | Admin Panel',
  description: 'Tema stilleri yönetimi sayfası',
}

export default function ThemeStylesPage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tema Stilleri</h1>
              <p className="text-muted-foreground">
                Event Concept Designer için tema stillerini yönetin
              </p>
            </div>
            <Link href="/admin/themes/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Tema Stili
              </Button>
            </Link>
          </div>

          <Suspense fallback={<ThemeStylesTableSkeleton />}>
            <ThemeStylesTable />
          </Suspense>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}