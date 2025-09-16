'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Calendar, Palette } from 'lucide-react'
import {
  fetchEventTypes,
  fetchThemeStyles,
  assignProductToEventTheme,
  type EventType,
  type ThemeStyle
} from '@/lib/actions/events'
import { fetchProducts } from '@/lib/actions/products'
import { useToast } from '@/hooks/use-toast'

const assignmentSchema = z.object({
  productId: z.string().min(1, 'Ürün seçimi gereklidir'),
  eventTypeId: z.string().min(1, 'Etkinlik türü seçimi gereklidir'),
  themeStyleId: z.string().min(1, 'Tema stili seçimi gereklidir'),
})

type AssignmentFormData = z.infer<typeof assignmentSchema>

interface Product {
  id: string
  name: string
  price: number
  gallery: string[]
  category: {
    name: string
  }
}

export function EventThemeAssignmentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [themeStyles, setThemeStyles] = useState<ThemeStyle[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null)
  const [selectedThemeStyle, setSelectedThemeStyle] = useState<ThemeStyle | null>(null)

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      productId: '',
      eventTypeId: '',
      themeStyleId: '',
    },
  })

  const loadData = useCallback(async () => {
    try {
      const [eventTypesData, themeStylesData, productsData] = await Promise.all([
        fetchEventTypes(),
        fetchThemeStyles(),
        fetchProducts()
      ])
      
      setEventTypes(eventTypesData.filter(et => et.isActive))
      setThemeStyles(themeStylesData.filter(ts => ts.isActive))
      // Ensure gallery exists using images
      const normalized = productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        gallery: Array.isArray(p.images) ? p.images.map((img: any) => img.url) : (Array.isArray(p.gallery) ? p.gallery : []),
        category: { name: p.category?.name || 'Kategori yok' }
      }))
      setProducts(normalized)
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Veriler yüklenirken bir hata oluştu.',
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      setLoading(true)

      await assignProductToEventTheme(
        data.productId,
        data.eventTypeId,
        data.themeStyleId
      )

      toast({
        title: 'Başarılı',
        description: 'Ürün başarıyla etkinlik-tema kombinasyonuna atandı.',
      })

      router.push('/admin/event-themes')
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Atama yapılırken bir hata oluştu. Bu kombinasyon zaten mevcut olabilir.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product || null)
  }

  const handleEventTypeChange = (eventTypeId: string) => {
    const eventType = eventTypes.find(et => et.id === eventTypeId)
    setSelectedEventType(eventType || null)
  }

  const handleThemeStyleChange = (themeStyleId: string) => {
    const themeStyle = themeStyles.find(ts => ts.id === themeStyleId)
    setSelectedThemeStyle(themeStyle || null)
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Ürün Seçimi</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ürün</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          handleProductChange(value)
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Ürün seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center space-x-2">
                                {product.gallery.length > 0 && (
                                  <Image
                                    src={product.gallery[0]}
                                    alt={product.name}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {product.category.name} - ₺{product.price.toLocaleString('tr-TR')}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedProduct && (
                  <div className="mt-4 p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {selectedProduct.gallery.length > 0 && (
                        <Image
                          src={selectedProduct.gallery[0]}
                          alt={selectedProduct.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{selectedProduct.name}</div>
                        <div className="text-sm text-gray-500">{selectedProduct.category.name}</div>
                        <div className="text-sm font-medium text-green-600">
                          ₺{selectedProduct.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Etkinlik Türü</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="eventTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etkinlik Türü</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          handleEventTypeChange(value)
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Etkinlik türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventTypes.map((eventType) => (
                            <SelectItem key={eventType.id} value={eventType.id}>
                              {eventType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedEventType && (
                  <div className="mt-4 p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {selectedEventType.image && (
                        <Image
                          src={selectedEventType.image}
                          alt={selectedEventType.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{selectedEventType.name}</div>
                        {selectedEventType.description && (
                          <div className="text-sm text-gray-500">{selectedEventType.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Theme Style Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Tema Stili</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="themeStyleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tema Stili</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          handleThemeStyleChange(value)
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tema stili seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {themeStyles.map((themeStyle) => (
                            <SelectItem key={themeStyle.id} value={themeStyle.id}>
                              {themeStyle.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedThemeStyle && (
                  <div className="mt-4 p-3 border rounded-lg">
                    <div className="space-y-2">
                      <div className="font-medium">{selectedThemeStyle.name}</div>
                      {selectedThemeStyle.description && (
                        <div className="text-sm text-gray-500">{selectedThemeStyle.description}</div>
                      )}

                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {selectedProduct && selectedEventType && selectedThemeStyle && (
            <Card>
              <CardHeader>
                <CardTitle>Atama Önizlemesi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-8 p-6 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-2">Ürün</div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {selectedProduct.name}
                    </Badge>
                  </div>
                  <div className="text-2xl text-gray-400">+</div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-2">Etkinlik</div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {selectedEventType.name}
                    </Badge>
                  </div>
                  <div className="text-2xl text-gray-400">+</div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-2">Tema</div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {selectedThemeStyle.name}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/event-themes')}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Atanıyor...' : 'Atamayı Yap'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}