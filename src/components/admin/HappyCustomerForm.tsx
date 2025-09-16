'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createWhatsAppMessage } from '@/lib/actions/whatsapp-messages'
import { fetchProducts } from '@/lib/actions/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { useImageKitUpload } from '@/hooks/use-imagekit'
import { getPresetImageUrl } from '@/lib/imagekit'
import Image from 'next/image'

interface Product {
  id: string
  name: string
}

interface HappyCustomerFormProps {
  message?: {
    id: string
    customer_name: string
    product_id: string
    screenshot_url: string
    alt_text: string
    is_active: boolean
    display_order: number
  }
  products?: Product[]
}

export function HappyCustomerForm({ message, products: initialProducts }: HappyCustomerFormProps) {
  const router = useRouter()
  const { uploadFile } = useImageKitUpload()
  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [isLoading, setIsLoading] = useState(false)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    customer_name: message?.customer_name || '',
    product_id: message?.product_id || '',
    screenshot_url: message?.screenshot_url || '',
    alt_text: message?.alt_text || '',
    is_active: message?.is_active ?? true,
    display_order: message?.display_order || 0
  })

  // Load products if not provided
  useEffect(() => {
    if (!initialProducts) {
      fetchProducts().then(products => {
        setProducts(products.map(p => ({ id: p.id, name: p.name })))
      })
    }
  }, [initialProducts])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setScreenshotFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let screenshotUrl = formData.screenshot_url

      // Upload new image if file selected
      if (screenshotFile) {
        try {
          const uploadResult = await new Promise<{ success: boolean; url: string }>((resolve, reject) => {
            uploadFile(screenshotFile, {
              folder: 'whatsapp-screenshots',
              onSuccess: (result) => resolve({ success: true, url: result.url }),
              onError: (error) => reject(new Error(error))
            })
          })
          
          if (uploadResult.success) {
            screenshotUrl = uploadResult.url
          }
        } catch (error) {
          toast({
            title: 'Hata',
            description: 'Görsel yüklenirken hata oluştu',
            intent: 'error'
          })
          return
        }
      }

      const formDataToSubmit = new FormData()
      formDataToSubmit.append('customer_name', formData.customer_name)
      formDataToSubmit.append('product_id', formData.product_id)
      formDataToSubmit.append('screenshot_url', screenshotUrl)
      formDataToSubmit.append('alt_text', formData.alt_text)
      formDataToSubmit.append('display_order', formData.display_order.toString())
      if (formData.is_active) {
        formDataToSubmit.append('is_active', 'on')
      }

      const result = await createWhatsAppMessage(formDataToSubmit)

      if (result.success) {
        toast({
          title: 'Başarılı',
          description: 'Müşteri mesajı eklendi',
          intent: 'success'
        })
        router.refresh()
        setFormData({
          customer_name: '',
          product_id: '',
          screenshot_url: '',
          alt_text: '',
          is_active: true,
          display_order: 0
        })
        setScreenshotFile(null)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Müşteri Adı */}
        <div className="space-y-2">
          <Label htmlFor="customer_name">Müşteri Adı *</Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
            placeholder="Örn: Büşra Hanım"
            required
          />
        </div>

        {/* Ürün Seçimi */}
        <div className="space-y-2">
          <Label htmlFor="product_id">Ürün *</Label>
          <Select
            value={formData.product_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ürün seçin" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        {/* Ekran Görüntüsü */}
        <div className="space-y-2">
          <Label htmlFor="screenshot">Müşteri Mesajı Görseli *</Label>
          <Input
            id="screenshot"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required={!message}
          />
          {formData.screenshot_url && (
            <div className="mt-2">
              <Image 
                src={getPresetImageUrl(formData.screenshot_url, 'whatsappMessage')} 
                alt="Mevcut görsel" 
                width={128}
                height={256}
                className="w-32 h-64 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* Alt Text */}
        <div className="space-y-2">
          <Label htmlFor="alt_text">Alt Text *</Label>
          <Input
            id="alt_text"
            value={formData.alt_text}
            onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
            placeholder="Örn: Müşteri mesajı görseli 1"
            required
          />
        </div>

        {/* Display Order */}
        <div className="space-y-2">
          <Label htmlFor="display_order">Görüntüleme Sırası</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
            placeholder="0"
          />
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

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </form>
  )
}