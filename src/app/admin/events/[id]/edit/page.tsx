import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EventTypeForm } from '@/components/admin/EventTypeForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Etkinlik Türü Düzenle | Admin Panel',
  description: 'Etkinlik türü düzenleme sayfası',
}

interface EditEventTypePageProps {
  params: {
    id: string
  }
}

async function getEventType(id: string) {
  try {
    const eventType = await prisma.eventType.findUnique({
      where: { id }
    })
    
    if (!eventType) {
      notFound()
    }
    
    return eventType
  } catch (error) {
    console.error('Error fetching event type:', error)
    notFound()
  }
}

export default async function EditEventTypePage({ params }: EditEventTypePageProps) {
  const resolvedParams = await params;
  const eventType = await getEventType(resolvedParams.id)

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
              <h1 className="text-3xl font-bold tracking-tight">Etkinlik Türü Düzenle</h1>
              <p className="text-muted-foreground">
                {eventType.name} etkinlik türünü düzenleyin
              </p>
            </div>
          </div>

          <EventTypeForm eventType={eventType} />
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}