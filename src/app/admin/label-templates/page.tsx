import { LabelTemplateManager } from '@/components/admin/LabelTemplateManager'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminGuard } from '@/components/auth/AuthGuard'

export default function LabelTemplatesPage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="container mx-auto py-6">
          <LabelTemplateManager />
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
