import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EventThemeAssignmentForm } from '@/components/admin/EventThemeAssignmentForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Yeni Event-Theme Ataması | Admin Panel',
  description: 'Yeni ürün event-theme ataması oluşturma sayfası',
}

export default function AssignEventThemePage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/event-themes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Yeni Event-Theme Ataması</h1>
              <p className="text-muted-foreground">
                Ürünü etkinlik türü ve tema kombinasyonuna atayın
              </p>
            </div>
          </div>

          <EventThemeAssignmentForm />
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}