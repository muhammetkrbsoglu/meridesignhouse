import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EventThemeAssignmentsTable } from '@/components/admin/EventThemeAssignmentsTable'
import { EventThemeAssignmentsTableSkeleton } from '@/components/admin/EventThemeAssignmentsTableSkeleton'

export const metadata = {
  title: 'Event-Theme Atamaları | Admin Panel',
  description: 'Ürün event-theme atama yönetimi sayfası',
}

export default function EventThemeAssignmentsPage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Event-Theme Atamaları</h1>
              <p className="text-muted-foreground">
                Ürünleri etkinlik türü ve tema kombinasyonlarına atayın
              </p>
            </div>
            <Link href="/admin/event-themes/assign">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Atama
              </Button>
            </Link>
          </div>

          <Suspense fallback={<EventThemeAssignmentsTableSkeleton />}>
            <EventThemeAssignmentsTable />
          </Suspense>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}