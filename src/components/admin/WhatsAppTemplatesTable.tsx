'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertWhatsAppTemplate } from '@/lib/actions/whatsapp-templates'
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
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, MessageSquare, Package, Users, Copy, Send } from 'lucide-react'

interface WhatsAppTemplate {
  id: string
  name: string
  context: 'ORDER' | 'MESSAGE' | 'BOTH'
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WhatsAppTemplatesTableProps {
  templates: WhatsAppTemplate[]
}

export function WhatsAppTemplatesTable({ templates }: WhatsAppTemplatesTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)

  const handleToggleStatus = async (template: WhatsAppTemplate) => {
    setIsLoading(template.id)
    try {
      const formData = new FormData()
      formData.append('id', template.id)
      formData.append('name', template.name)
      formData.append('context', template.context)
      formData.append('content', template.content)
      formData.append('is_active', (!template.is_active).toString())

      const result = await upsertWhatsAppTemplate(formData)
      
      if (result.success) {
        toast({
          title: 'Başarılı',
          description: `Şablon ${!template.is_active ? 'aktif' : 'pasif'} edildi`,
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

  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingTemplate(template)
  }

  const handleDelete = async (template: WhatsAppTemplate) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return

    setIsLoading(template.id)
    try {
      // Şablonu pasif yap (soft delete)
      const formData = new FormData()
      formData.append('id', template.id)
      formData.append('name', template.name)
      formData.append('context', template.context)
      formData.append('content', template.content)
      formData.append('is_active', 'false')

      const result = await upsertWhatsAppTemplate(formData)
      
      if (result.success) {
        toast({
          title: 'Başarılı',
          description: 'Şablon silindi',
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

  const getContextBadge = (context: string) => {
    switch (context) {
      case 'ORDER':
        return <Badge variant="default">Sipariş</Badge>
      case 'MESSAGE':
        return <Badge variant="secondary">Mesaj</Badge>
      case 'BOTH':
        return <Badge variant="outline">Her İkisi</Badge>
      default:
        return <Badge variant="outline">{context}</Badge>
    }
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">Henüz şablon eklenmemiş</div>
        <div className="text-gray-400 text-sm">Yukarıdaki formu kullanarak ilk şablonunuzu ekleyin</div>
      </div>
    )
  }

  // Kategori ikonları
  const getContextIcon = (context: string) => {
    switch (context) {
      case 'ORDER': return <Package className="h-4 w-4" />
      case 'MESSAGE': return <MessageSquare className="h-4 w-4" />
      case 'BOTH': return <Users className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Şablon Adı
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Kategori
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              İçerik Önizleme
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Durum
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {templates.map((template) => (
            <tr key={template.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getContextIcon(template.context)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {template.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Güncellendi: {new Date(template.updated_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  {getContextIcon(template.context)}
                  {getContextBadge(template.context)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="max-w-xs">
                  <div className="text-sm text-gray-900 line-clamp-2">
                    {template.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.content.length} karakter
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={() => handleToggleStatus(template)}
                    disabled={isLoading === template.id}
                  />
                  <Badge 
                    variant={template.is_active ? 'default' : 'secondary'}
                    className={template.is_active ? 'bg-green-100 text-green-800 border-green-200' : ''}
                  >
                    {template.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(template.content)
                      toast({
                        title: 'Kopyalandı',
                        description: 'Şablon içeriği panoya kopyalandı',
                        intent: 'success'
                      })
                    }}
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(template)}
                        disabled={isLoading === template.id}
                      >
                        {template.is_active ? (
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
                        onClick={() => handleDelete(template)}
                        disabled={isLoading === template.id}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
