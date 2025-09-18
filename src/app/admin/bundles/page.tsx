import Link from 'next/link'
import { fetchBundles, deleteBundle } from '@/lib/actions/bundles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { revalidatePath } from 'next/cache'
import { fetchEventTypes, fetchThemeStyles } from '@/lib/actions/events'

export default async function BundlesListPage() {
  const [bundles, eventTypes, themeStyles] = await Promise.all([
    fetchBundles(),
    fetchEventTypes(),
    fetchThemeStyles(),
  ])
  const eventNameById = Object.fromEntries(eventTypes.map((e: any) => [e.id, e.name]))
  const themeNameById = Object.fromEntries(themeStyles.map((t: any) => [t.id, t.name]))
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Set Atayıcı</h1>
              <p className="text-muted-foreground">Etkinlik + Tema kombinasyonlarına setler tanımlayın</p>
            </div>
            <Button asChild>
              <Link href="/admin/bundles/create">Yeni Set</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((b: any) => (
              <Card key={b.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{b.name}</span>
                    <span className="text-sm text-muted-foreground">{b.isActive ? 'Aktif' : 'Pasif'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">Etkinlik: {eventNameById[b.eventTypeId] || b.eventTypeId}</div>
                  <div className="text-sm">Tema: {themeNameById[b.themeStyleId] || b.themeStyleId}</div>
                  <div className="text-sm">Ürün sayısı: {b.items?.length || 0}</div>
                  <div className="text-sm">Sıra: {b.sortOrder}</div>
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="secondary" size="sm"><Link href={`/admin/bundles/${b.id}/edit`}>Düzenle</Link></Button>
                    <form action={async () => {
                      'use server'
                      await deleteBundle(b.id)
                      revalidatePath('/admin/bundles')
                    }}>
                      <Button type="submit" variant="destructive" size="sm">Sil</Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}



