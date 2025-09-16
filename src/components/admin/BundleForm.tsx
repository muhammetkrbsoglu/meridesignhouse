'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { fetchEventTypes, fetchThemeStyles, type EventType, type ThemeStyle } from '@/lib/actions/events'
import { fetchProducts, fetchCategories } from '@/lib/actions/products'
import { createBundle, updateBundle } from '@/lib/actions/bundles'
import { useToast } from '@/hooks/use-toast'

const bundleSchema = z.object({
  name: z.string().min(2, 'İsim gerekli'),
  description: z.string().optional(),
  image: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  eventTypeId: z.string().min(1, 'Etkinlik türü seçin'),
  themeStyleId: z.string().min(1, 'Tema stili seçin'),
  categoryId: z.string().min(1, 'Kategori seçin'),
  bundlePrice: z.coerce.number().nullable().optional(),
  isActive: z.coerce.boolean(),
  sortOrder: z.coerce.number().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.coerce.number().min(1),
    sortOrder: z.coerce.number().optional()
  })).min(1, 'En az bir ürün seçin')
})

type BundleFormData = z.infer<typeof bundleSchema>

interface ProductOption {
  id: string
  name: string
  price: number
  image?: string | null
}

interface BundleFormProps {
  defaultValues?: Partial<BundleFormData>
  bundleId?: string
}

export function BundleForm({ defaultValues, bundleId }: BundleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [themeStyles, setThemeStyles] = useState<ThemeStyle[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])

  const form = useForm<BundleFormData>({
    resolver: zodResolver(bundleSchema) as unknown as import('react-hook-form').Resolver<BundleFormData>,
    defaultValues: {
      name: '',
      description: '',
      image: '',
      eventTypeId: '',
      themeStyleId: '',
      categoryId: '',
      bundlePrice: undefined,
      isActive: true,
      sortOrder: 0,
      items: [],
      ...defaultValues,
    }
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [ets, tss, cats, prods] = await Promise.all([
          fetchEventTypes(),
          fetchThemeStyles(),
          fetchCategories(),
          fetchProducts()
        ])
        setEventTypes(ets)
        setThemeStyles(tss)
        setCategories(cats)
        setProductOptions(
          prods.map((p: { id: string | number; name: string; price: number | { toString(): string }; images?: Array<{ url: string }>; product_images?: Array<{ url: string }> }) => ({
            id: String(p.id),
            name: p.name,
            price: typeof p.price === 'object' ? parseFloat(p.price.toString()) : Number(p.price) || 0,
            image: p.images?.[0]?.url || p.product_images?.[0]?.url || null,
          }))
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const watchedItems = (form.watch('items') || []) as NonNullable<BundleFormData['items']>
  const selectedCount = watchedItems.length
  const selectedTotal = useMemo(() => {
    const map = new Map(productOptions.map(p => [String(p.id), p]))
    return watchedItems.reduce((acc: number, it: NonNullable<BundleFormData['items']>[number]) => {
      const p = map.get(String(it.productId))
      const qty = Number(it.quantity) || 1
      return acc + (p ? p.price * qty : 0)
    }, 0)
  }, [watchedItems, productOptions])

  const onSubmit = async (values: BundleFormData) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      image: values.image || null,
      eventTypeId: values.eventTypeId,
      themeStyleId: values.themeStyleId,
      categoryId: values.categoryId,
      bundlePrice: values.bundlePrice ?? null,
      isActive: values.isActive,
      sortOrder: values.sortOrder ?? 0,
      items: values.items.map((it, idx) => ({
        productId: it.productId,
        quantity: it.quantity,
        sortOrder: it.sortOrder ?? idx,
      }))
    }

    const res = bundleId ? await updateBundle(bundleId, payload) : await createBundle(payload)
    if ('success' in res && res.success) {
      toast({ intent: 'success', description: 'Set kaydedildi.' })
      router.push('/admin/bundles')
      router.refresh()
    } else {
      toast({ intent: 'error', description: (res as any).error || 'İşlem başarısız' })
    }
  }

  const toggleProduct = (productId: string) => {
    const items = form.getValues('items') || []
    const idx = items.findIndex(i => i.productId === productId)
    if (idx >= 0) {
      items.splice(idx, 1)
    } else {
      items.push({ productId, quantity: 1, sortOrder: items.length })
    }
    form.setValue('items', [...items])
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Yükleniyor…</CardTitle>
        </CardHeader>
        <CardContent>
          Lütfen bekleyin…
        </CardContent>
      </Card>
    )
  }

  const submitHandler = form.handleSubmit(onSubmit)

  return (
    <Form {...form}>
      <form onSubmit={submitHandler} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Set Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İsim</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Minimalist Doğum Günü Seti" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Kısa açıklama" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kapak Görseli URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etkinlik Türü</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map(et => (
                          <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="themeStyleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tema Stili</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {themeStyles.map(ts => (
                          <SelectItem key={ts.id} value={ts.id}>{ts.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bundlePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Set Fiyatı (opsiyonel)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Örn: 149.90" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktif</FormLabel>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={!!field.value} onCheckedChange={v => field.onChange(!!v)} />
                      <span>Set aktif</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sıra</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Badge variant="secondary">Seçili ürün: {selectedCount}</Badge>
                <Badge>Toplam: {selectedTotal.toFixed(2)}₺</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ürünler</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {productOptions.map(p => {
              const isSelected = (form.watch('items') || []).some(i => i.productId === p.id)
              return (
                <div key={p.id} className={`border rounded-md p-3 flex items-center justify-between ${isSelected ? 'border-primary' : 'border-muted'}`}>
                  <div className="space-y-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.price.toFixed(2)}₺</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <Input
                        className="w-20"
                        type="number"
                        min={1}
                        value={(form.watch('items') || []).find(i => i.productId === p.id)?.quantity ?? 1}
                        onChange={(e) => {
                          const items = form.getValues('items') || []
                          const idx = items.findIndex(i => i.productId === p.id)
                          if (idx >= 0) {
                            items[idx] = { ...items[idx], quantity: Number(e.target.value) }
                            form.setValue('items', [...items])
                          }
                        }}
                      />
                    )}
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleProduct(p.id)} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/bundles')}>İptal</Button>
          <Button type="submit">Kaydet</Button>
        </div>
      </form>
    </Form>
  )
}


