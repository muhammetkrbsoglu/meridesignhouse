import { AdminLayout } from '@/components/admin/AdminLayout'
import { WhatsAppMessagesTable } from '@/components/admin/WhatsAppMessagesTable'
import { HappyCustomerForm } from '@/components/admin/HappyCustomerForm'
import { getAllWhatsAppMessages } from '@/lib/actions/whatsapp-messages'
import { fetchProducts } from '@/lib/actions/products'

export default async function WhatsAppMessagesAdminPage() {
  const [messages, products] = await Promise.all([
    getAllWhatsAppMessages(),
    fetchProducts()
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Memnun Müşteriler</h1>
          <p className="mt-1 text-sm text-gray-600">
            Müşteri geri bildirimlerini ve ürün tercihlerini yönetin
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Yeni Müşteri Mesajı Ekle</h2>
          </div>
          <div className="p-6">
            <HappyCustomerForm products={products.map(p => ({ id: p.id, name: p.name }))} />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Mevcut Müşteri Mesajları</h2>
          </div>
          <div className="overflow-hidden">
            <WhatsAppMessagesTable messages={messages} />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
