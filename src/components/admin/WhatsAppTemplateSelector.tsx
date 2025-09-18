'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { MessageSquare, Send, Eye, Copy } from 'lucide-react'
import { listWhatsAppTemplates } from '@/lib/actions/whatsapp-templates'
import { getWhatsAppHref } from '@/lib/whatsapp-utils'

interface WhatsAppTemplate {
  id: string
  name: string
  context: 'ORDER' | 'MESSAGE' | 'BOTH'
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WhatsAppTemplateSelectorProps {
  orderContext?: {
    orderNumber: string
    customerName: string
    customerPhone: string
    status: string
    totalAmount: number
    trackingNumber?: string
    estimatedDelivery?: string
    paymentMethod?: string
    paymentStatus?: string
    shippingAddressText?: string
    billingAddressText?: string
    createdAt: string
  }
  messageContext?: {
    subject: string
    message: string
    lastOrderNumber?: string
    lastOrderDate?: string
  }
  context: 'ORDER' | 'MESSAGE'
}

export function WhatsAppTemplateSelector({ 
  orderContext, 
  messageContext, 
  context 
}: WhatsAppTemplateSelectorProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await listWhatsAppTemplates(context)
        setTemplates(data)
      } catch (error) {
        console.error('Error loading templates:', error)
        toast({
          title: 'Hata',
          description: 'Åablonlar yüklenirken hata oluştu',
          intent: 'error'
        })
      }
    }
    loadTemplates()
  }, [context])

  // Türkiye saat dilimi fonksiyonu
  const getTurkeyTime = (date: Date) => {
    return new Date(date.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}))
  }

  // Değişken değerlerini doldur
  const getVariableValues = () => {
    const values: Record<string, string> = {}
    const now = getTurkeyTime(new Date())
    
    if (orderContext) {
      values['{ad}'] = orderContext.customerName
      values['{siparisNo}'] = orderContext.orderNumber
      values['{toplam}'] = `${orderContext.totalAmount.toLocaleString('tr-TR')} ₺`
      values['{tarih}'] = getTurkeyTime(new Date(orderContext.createdAt)).toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      values['{durum}'] = orderContext.status
      values['{takipNo}'] = orderContext.trackingNumber || 'Henüz atanmadı'
      values['{tahminiTeslim}'] = orderContext.estimatedDelivery || 'Henüz belirlenmedi'
      values['{kargoFirmasi}'] = 'Aras Kargo'
      values['{adres}'] = orderContext.shippingAddressText || 'Adres bilgisi yok'
      values['{telefon}'] = orderContext.customerPhone
      values['{email}'] = orderContext.customerName // Email bilgisi yok, isim kullan
      values['{saat}'] = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      values['{sirket}'] = 'Meri Design House'
    }
    
    if (messageContext) {
      values['{ad}'] = orderContext?.customerName || 'Müşteri'
      values['{email}'] = orderContext?.customerName || 'Müşteri' // Email bilgisi yok
      values['{telefon}'] = orderContext?.customerPhone || ''
      values['{konu}'] = messageContext.subject
      values['{mesaj}'] = messageContext.message
      values['{siparisNo}'] = messageContext.lastOrderNumber || 'Yok'
      values['{tarih}'] = messageContext.lastOrderDate ? 
        getTurkeyTime(new Date(messageContext.lastOrderDate)).toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : 
        now.toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      values['{saat}'] = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      values['{sirket}'] = 'Meri Design House'
    }
    
    return values
  }

  // Mesaj içeriğini değişkenlerle doldur
  const fillMessageContent = (content: string) => {
    let filledContent = content
    const values = getVariableValues()
    
    Object.entries(values).forEach(([variable, value]) => {
      filledContent = filledContent.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
    
    return filledContent
  }

  // Åablon seçildiğinde
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setCustomMessage(fillMessageContent(template.content))
    }
  }

  // WhatsApp'a gönder
  const handleSendWhatsApp = () => {
    const message = customMessage || selectedTemplate?.content || ''
    if (!message.trim()) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir mesaj yazın',
        intent: 'error'
      })
      return
    }

    const phone = orderContext?.customerPhone || ''
    if (!phone) {
      toast({
        title: 'Hata',
        description: 'Telefon numarası bulunamadı',
        intent: 'error'
      })
      return
    }

    const whatsappUrl = getWhatsAppHref(phone, message)
    window.open(whatsappUrl, '_blank')
  }

  // Mesajı kopyala
  const handleCopyMessage = () => {
    const message = customMessage || selectedTemplate?.content || ''
    navigator.clipboard.writeText(message)
    toast({
      title: 'Kopyalandı',
      description: 'Mesaj panoya kopyalandı',
      intent: 'success'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          WhatsApp Mesaj Gönder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Åablon Seçimi */}
        <div className="space-y-2">
          <Label>Åablon Seçin</Label>
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Bir şablon seçin..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <span>{template.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {template.context === 'ORDER' ? 'Sipariş' : 
                       template.context === 'MESSAGE' ? 'Mesaj' : 'Her İkisi'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mesaj İçeriği */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Mesaj İçeriği</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Düzenle' : 'Önizleme'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMessage}
              >
                <Copy className="h-4 w-4 mr-2" />
                Kopyala
              </Button>
            </div>
          </div>
          
          {showPreview ? (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="whitespace-pre-wrap text-sm">
                {fillMessageContent(customMessage || selectedTemplate?.content || '')}
              </div>
            </div>
          ) : (
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Mesaj içeriğini buraya yazın..."
              rows={6}
              className="font-mono text-sm"
            />
          )}
        </div>

        {/* Gönder Butonu */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSendWhatsApp}
            disabled={!customMessage.trim() && !selectedTemplate}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            WhatsApp'ta Gönder
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

