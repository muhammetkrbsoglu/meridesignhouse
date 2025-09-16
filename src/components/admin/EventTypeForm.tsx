'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createEventType, updateEventType, type EventType } from '@/lib/actions/events'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const eventTypeSchema = z.object({
  name: z.string().min(1, 'Etkinlik türü adı gereklidir'),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().min(0, 'Sıralama 0 veya daha büyük olmalıdır'),
  isActive: z.boolean(),
})

type EventTypeFormData = z.infer<typeof eventTypeSchema>

interface EventTypeFormProps {
  eventType?: EventType
}

export function EventTypeForm({ eventType }: EventTypeFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<EventTypeFormData>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: {
      name: eventType?.name || '',
      description: eventType?.description || '',
      image: eventType?.image || '',
      sortOrder: eventType?.sortOrder || 0,
      isActive: eventType?.isActive ?? true,
    },
  })

  const onSubmit = async (data: EventTypeFormData) => {
    try {
      setLoading(true)

      if (eventType) {
        await updateEventType(eventType.id, {
          name: data.name,
          description: data.description || undefined,
          image: data.image || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        })
        toast({ intent: 'success', description: 'Etkinlik türü başarıyla güncellendi.' })
      } else {
        await createEventType({
          name: data.name,
          description: data.description || undefined,
          image: data.image || undefined,
          sortOrder: data.sortOrder,
        })
        toast({ intent: 'success', description: 'Etkinlik türü başarıyla oluşturuldu.' })
      }

      router.push('/admin/events')
    } catch (_error) {
      toast({ intent: 'error', description: eventType
          ? 'Etkinlik türü güncellenirken bir hata oluştu.'
          : 'Etkinlik türü oluşturulurken bir hata oluştu.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {eventType ? 'Etkinlik Türü Düzenle' : 'Yeni Etkinlik Türü'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField<EventTypeFormData, "name">
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etkinlik Türü Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Düğün, Nişan, Doğum Günü..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Event Concept Designer&apos;da görünecek etkinlik türü adı
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField<EventTypeFormData, "description">
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Etkinlik türü hakkında kısa açıklama..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Etkinlik türü hakkında açıklayıcı bilgi (opsiyonel)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField<EventTypeFormData, "image">
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Görsel URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Etkinlik türü için görsel URL&apos;si (opsiyonel)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField<EventTypeFormData, "sortOrder">
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sıralama</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Etkinlik türlerinin sıralanma düzeni (0 = en üstte)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField<EventTypeFormData, "isActive">
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Aktif</FormLabel>
                    <FormDescription>
                      Bu etkinlik türü Event Concept Designer&apos;da görünsün mü?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {eventType ? 'Güncelle' : 'Oluştur'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/events')}
                disabled={loading}
              >
                İptal
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}