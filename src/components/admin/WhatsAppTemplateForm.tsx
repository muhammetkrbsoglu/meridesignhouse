'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertWhatsAppTemplate } from '@/lib/actions/whatsapp-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { Plus, X, Eye, Copy } from 'lucide-react'

interface WhatsAppTemplate {
  id: string
  name: string
  context: 'ORDER' | 'MESSAGE' | 'BOTH'
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WhatsAppTemplateFormProps {
  template?: WhatsAppTemplate
}

// Değişken tanımları
const AVAILABLE_VARIABLES = {
  ORDER: [
    { key: '{ad}', label: 'Müşteri Adı', description: 'Müşterinin adı ve soyadı', icon: 'ğŸ‘¤' },
    { key: '{siparisNo}', label: 'Sipariş Numarası', description: 'Sipariş numarası', icon: 'ğŸ“‹' },
    { key: '{toplam}', label: 'Toplam Tutar', description: 'Sipariş toplam tutarı (₺)', icon: 'ğŸ’°' },
    { key: '{tarih}', label: 'Tarih', description: 'Sipariş tarihi (Türkiye saati)', icon: 'ğŸ“…' },
    { key: '{durum}', label: 'Sipariş Durumu', description: 'Güncel sipariş durumu', icon: 'ğŸ“Š' },
    { key: '{takipNo}', label: 'Kargo Takip No', description: 'Kargo takip numarası', icon: 'ğŸšš' },
    { key: '{tahminiTeslim}', label: 'Tahmini Teslim', description: 'Tahmini teslim tarihi', icon: 'ğŸ“¦' },
    { key: '{kargoFirmasi}', label: 'Kargo Firması', description: 'Kargo firması adı', icon: 'ğŸ¢' },
    { key: '{adres}', label: 'Teslimat Adresi', description: 'Teslimat adresi', icon: 'ğŸ“' },
    { key: '{telefon}', label: 'Telefon', description: 'Müşteri telefon numarası', icon: 'ğŸ“' },
    { key: '{email}', label: 'E-posta', description: 'Müşteri e-posta adresi', icon: 'ğŸ“§' }
  ],
  MESSAGE: [
    { key: '{ad}', label: 'Müşteri Adı', description: 'Mesaj gönderen müşterinin adı ve soyadı', icon: 'ğŸ‘¤' },
    { key: '{email}', label: 'E-posta', description: 'Müşteri e-posta adresi', icon: 'ğŸ“§' },
    { key: '{telefon}', label: 'Telefon', description: 'Müşteri telefon numarası', icon: 'ğŸ“' },
    { key: '{konu}', label: 'Konu', description: 'Mesaj konusu', icon: 'ğŸ’¬' },
    { key: '{mesaj}', label: 'Mesaj', description: 'Müşteri mesajı', icon: 'ğŸ“' },
    { key: '{siparisNo}', label: 'Son Sipariş', description: 'Son sipariş numarası', icon: 'ğŸ“‹' },
    { key: '{tarih}', label: 'Tarih', description: 'Mesaj tarihi (Türkiye saati)', icon: 'ğŸ“…' }
  ],
  BOTH: [
    { key: '{ad}', label: 'Müşteri Adı', description: 'Müşteri adı ve soyadı', icon: 'ğŸ‘¤' },
    { key: '{telefon}', label: 'Telefon', description: 'Telefon numarası', icon: 'ğŸ“' },
    { key: '{email}', label: 'E-posta', description: 'E-posta adresi', icon: 'ğŸ“§' },
    { key: '{tarih}', label: 'Tarih', description: 'Tarih (Türkiye saati)', icon: 'ğŸ“…' },
    { key: '{saat}', label: 'Saat', description: 'Saat (Türkiye saati)', icon: 'ğŸ•' },
    { key: '{sirket}', label: 'Åirket', description: 'Åirket adı', icon: 'ğŸ¢' }
  ]
}

export function WhatsAppTemplateForm({ template }: WhatsAppTemplateFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    name: template?.name || '',
    context: template?.context || 'BOTH' as 'ORDER' | 'MESSAGE' | 'BOTH',
    content: template?.content || '',
    is_active: template?.is_active ?? true
  })

  // Mevcut değişkenleri bul
  const getCurrentVariables = () => {
    const matches = formData.content.match(/\{[^}]+\}/g) || []
    return [...new Set(matches)]
  }

  // Değişken ekle
  const addVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = formData.content.substring(0, start) + variable + formData.content.substring(end)
      setFormData(prev => ({ ...prev, content: newContent }))
      
      // Cursor'u değişkenden sonra konumlandır
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  // Türkiye saat dilimi fonksiyonu
  const getTurkeyTime = (date: Date) => {
    return new Date(date.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}))
  }

  // Önizleme için test verileri
  const generatePreviewData = () => {
    const variables = getCurrentVariables()
    const testData: Record<string, string> = {}
    const now = getTurkeyTime(new Date())
    
    variables.forEach(variable => {
      const cleanVar = variable.replace(/[{}]/g, '')
      switch (cleanVar) {
        case 'ad': testData[variable] = 'Ahmet Yılmaz'; break
        case 'siparisNo': testData[variable] = 'MDH-2024-001'; break
        case 'toplam': testData[variable] = '1.250,00 ₺'; break
        case 'tarih': testData[variable] = now.toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }); break
        case 'durum': testData[variable] = 'Kargoya Verildi'; break
        case 'takipNo': testData[variable] = 'TR123456789'; break
        case 'tahminiTeslim': testData[variable] = now.toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }); break
        case 'kargoFirmasi': testData[variable] = 'Aras Kargo'; break
        case 'adres': testData[variable] = 'Atatürk Mah. 123. Sok. No:45, Kadıköy/İstanbul'; break
        case 'telefon': testData[variable] = '+90 555 123 45 67'; break
        case 'email': testData[variable] = 'ahmet.yilmaz@example.com'; break
        case 'konu': testData[variable] = 'Sipariş Sorgusu'; break
        case 'mesaj': testData[variable] = 'Siparişim ne durumda?'; break
        case 'saat': testData[variable] = now.toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }); break
        case 'sirket': testData[variable] = 'Meri Design House'; break
        default: testData[variable] = `[${cleanVar}]`; break
      }
    })
    
    return testData
  }

  // Önizleme içeriği oluştur
  const getPreviewContent = () => {
    let content = formData.content
    const variables = getCurrentVariables()
    
    variables.forEach(variable => {
      const testData = generatePreviewData()
      content = content.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), testData[variable] || variable)
    })
    
    return content
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formDataToSubmit = new FormData()
      if (template?.id) {
        formDataToSubmit.append('id', template.id)
      }
      formDataToSubmit.append('name', formData.name)
      formDataToSubmit.append('context', formData.context)
      formDataToSubmit.append('content', formData.content)
      if (formData.is_active) {
        formDataToSubmit.append('is_active', 'true')
      }

      const result = await upsertWhatsAppTemplate(formDataToSubmit)

      if (result.success) {
        toast({
          title: 'Başarılı',
          description: template?.id ? 'Åablon güncellendi' : 'Åablon eklendi',
          intent: 'success'
        })
        router.refresh()
        if (!template?.id) {
          setFormData({
            name: '',
            context: 'BOTH',
            content: '',
            is_active: true
          })
        }
      } else {
        toast({
          title: 'Hata',
          description: result.error || 'Beklenmeyen bir hata oluştu',
          intent: 'error'
        })
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        title: 'Hata',
        description: 'Beklenmeyen bir hata oluştu',
        intent: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Åablon Adı */}
          <div className="space-y-2">
            <Label htmlFor="name">Åablon Adı *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Örn: Sipariş Onay Mesajı"
              required
            />
          </div>

          {/* Kullanım Alanı */}
          <div className="space-y-2">
            <Label htmlFor="context">Kullanım Alanı *</Label>
            <Select
              value={formData.context}
              onValueChange={(value: 'ORDER' | 'MESSAGE' | 'BOTH') => setFormData(prev => ({ ...prev, context: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kullanım alanı seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORDER">Sipariş</SelectItem>
                <SelectItem value="MESSAGE">Mesaj</SelectItem>
                <SelectItem value="BOTH">Her İkisi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aktif Durumu */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Aktif</Label>
          </div>
        </div>

        {/* Değişkenler ve Mesaj İçeriği */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Değişkenler */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kullanılabilir Değişkenler</CardTitle>
              <p className="text-sm text-gray-600">
                Değişkenleri tıklayarak mesajınıza ekleyebilirsiniz
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {AVAILABLE_VARIABLES[formData.context].map((variable) => (
                  <div key={variable.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{variable.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {variable.key}
                            </Badge>
                            <span className="text-sm font-medium">{variable.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addVariable(variable.key)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mesaj İçeriği */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mesaj İçeriği *</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Düzenle' : 'Önizleme'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(formData.content)
                    toast({
                      title: 'Kopyalandı',
                      description: 'Mesaj içeriği panoya kopyalandı',
                      intent: 'success'
                    })
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Kopyala
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Önizleme:</h4>
                    <div className="whitespace-pre-wrap text-sm">
                      {getPreviewContent()}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Kullanılan Değişkenler:</h4>
                    <div className="flex flex-wrap gap-1">
                      {getCurrentVariables().map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Mesaj içeriğini buraya yazın..."
                    rows={8}
                    required
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Değişkenleri yukarıdan seçerek ekleyebilir veya manuel olarak yazabilirsiniz
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Kaydediliyor...' : template?.id ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}

