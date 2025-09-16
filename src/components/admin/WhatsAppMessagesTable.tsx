'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WhatsAppMessage } from '@/lib/actions/whatsapp-messages'
import { deleteWhatsAppMessage, toggleWhatsAppMessageStatus } from '@/lib/actions/whatsapp-messages'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

interface WhatsAppMessagesTableProps {
  messages: WhatsAppMessage[]
}

export function WhatsAppMessagesTable({ messages }: WhatsAppMessagesTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return

    setIsLoading(id)
    try {
      const result = await deleteWhatsAppMessage(id)
      
      if (result.success) {
        toast({
          title: 'Başarılı',
          description: 'Müşteri mesajı silindi',
          intent: 'success'
        })
        router.refresh()
      } else {
        toast({
          title: 'Hata',
          description: result.error || 'Beklenmeyen bir hata oluştu',
          intent: 'error'
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Hata',
        description: 'Beklenmeyen bir hata oluştu',
        intent: 'error'
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsLoading(id)
    try {
      const result = await toggleWhatsAppMessageStatus(id, !currentStatus)
      
      if (result.success) {
        toast({
          title: 'Başarılı',
          description: `Müşteri mesajı ${!currentStatus ? 'aktif' : 'pasif'} edildi`,
          intent: 'success'
        })
        router.refresh()
      } else {
        toast({
          title: 'Hata',
          description: result.error || 'Beklenmeyen bir hata oluştu',
          intent: 'error'
        })
      }
    } catch (error) {
      console.error('Toggle status error:', error)
      toast({
        title: 'Hata',
        description: 'Beklenmeyen bir hata oluştu',
        intent: 'error'
      })
    } finally {
      setIsLoading(null)
    }
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">Henüz müşteri mesajı eklenmemiş</div>
        <div className="text-gray-400 text-sm">Yukarıdaki formu kullanarak ilk müşteri mesajınızı ekleyin</div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Müşteri
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ürün
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Görsel
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sıra
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {messages.map((message) => (
            <tr key={message.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {message.customer_name}
                </div>
                <div className="text-sm text-gray-500">
                  {message.alt_text}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {message.product_id}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Image 
                  src={message.screenshot_url} 
                  alt={message.alt_text}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg border"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {message.display_order}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={message.is_active}
                    onCheckedChange={() => handleToggleStatus(message.id, message.is_active)}
                    disabled={isLoading === message.id}
                  />
                  <Badge variant={message.is_active ? 'default' : 'secondary'}>
                    {message.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(message.id, message.is_active)}
                      disabled={isLoading === message.id}
                    >
                      {message.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Pasif Et
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Aktif Et
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(message.id)}
                      disabled={isLoading === message.id}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
