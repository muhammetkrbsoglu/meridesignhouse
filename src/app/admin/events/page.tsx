import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EventTypesTable } from '@/components/admin/EventTypesTable'
import { EventTypesTableSkeleton } from '@/components/admin/EventTypesTableSkeleton'

export const metadata = {
  title: 'Etkinlik Türleri | Admin Panel',
  description: 'Etkinlik türleri yönetimi sayfası',
}

export default function EventTypesPage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Etkinlik Türleri</h1>
              <p className="text-muted-foreground">
                Event Concept Designer için etkinlik türlerini yönetin
              </p>
            </div>
            <Link href="/admin/events/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Etkinlik Türü
              </Button>
            </Link>
          </div>

          <Suspense fallback={<EventTypesTableSkeleton />}>
            <EventTypesTable />
          </Suspense>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}