import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ThemeStyleForm } from '@/components/admin/ThemeStyleForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Tema Stili Düzenle | Admin Panel',
  description: 'Tema stili düzenleme sayfası',
}

interface EditThemeStylePageProps {
  params: {
    id: string
  }
}

async function getThemeStyle(id: string) {
  try {
    const themeStyle = await prisma.themeStyle.findUnique({
      where: { id }
    })
    
    if (!themeStyle) {
      notFound()
    }
    
    return themeStyle
  } catch (error) {
    console.error('Error fetching theme style:', error)
    notFound()
  }
}

export default async function EditThemeStylePage({ params }: EditThemeStylePageProps) {
  const resolvedParams = await params;
  const themeStyle = await getThemeStyle(resolvedParams.id)

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
              <h1 className="text-3xl font-bold tracking-tight">Tema Stili Düzenle</h1>
              <p className="text-muted-foreground">
                {themeStyle.name} tema stilini düzenleyin
              </p>
            </div>
          </div>

          <ThemeStyleForm themeStyle={themeStyle} />
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}