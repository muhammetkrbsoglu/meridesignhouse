import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ThemeStyleForm } from '@/components/admin/ThemeStyleForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Yeni Tema Stili | Admin Panel',
  description: 'Yeni tema stili oluşturma sayfası',
}

export default function CreateThemeStylePage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/themes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Yeni Tema Stili</h1>
              <p className="text-muted-foreground">
                Event Concept Designer için yeni tema stili oluşturun
              </p>
            </div>
          </div>

          <ThemeStyleForm />
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}