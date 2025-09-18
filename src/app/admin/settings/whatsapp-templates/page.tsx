import { AdminLayout } from '@/components/admin/AdminLayout'
import { WhatsAppTemplatesTable } from '@/components/admin/WhatsAppTemplatesTable'
import { WhatsAppTemplateForm } from '@/components/admin/WhatsAppTemplateForm'
import { listWhatsAppTemplates } from '@/lib/actions/whatsapp-templates'

export default async function WhatsAppTemplatesAdminPage() {
  const templates = await listWhatsAppTemplates()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Mesaj Åablonları</h1>
          <p className="mt-1 text-sm text-gray-600">
            WhatsApp mesajları için hazır şablonları yönetin
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Yeni Åablon Ekle</h2>
          </div>
          <div className="p-6">
            <WhatsAppTemplateForm />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Mevcut Åablonlar</h2>
          </div>
          <div className="overflow-hidden">
            <WhatsAppTemplatesTable templates={templates} />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

