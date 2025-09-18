import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EventTypeForm } from '@/components/admin/EventTypeForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Yeni Etkinlik Türü | Admin Panel',
  description: 'Yeni etkinlik türü oluşturma sayfası',
}

export default function CreateEventTypePage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/events">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Yeni Etkinlik Türü</h1>
              <p className="text-muted-foreground">
                Event Concept Designer için yeni etkinlik türü oluşturun
              </p>
            </div>
          </div>

          <EventTypeForm />
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
