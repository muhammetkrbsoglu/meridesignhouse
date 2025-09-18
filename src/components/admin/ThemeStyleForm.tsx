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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'

import { createThemeStyle, updateThemeStyle, type ThemeStyle } from '@/lib/actions/events'
import { useToast } from '@/hooks/use-toast'

const themeStyleSchema = z.object({
  name: z.string().min(1, 'Tema stili adı gereklidir'),
  description: z.string().optional(),
  sortOrder: z.number().min(0, 'Sıralama 0 veya daha büyük olmalıdır'),
  isActive: z.boolean(),
  colors: z.array(z.string()).min(4, 'En az 4 renk seçmelisiniz').max(4, 'En fazla 4 renk seçebilirsiniz'),
})

type ThemeStyleFormData = z.infer<typeof themeStyleSchema>

interface ThemeStyleFormProps {
  themeStyle?: ThemeStyle
}

export function ThemeStyleForm({ themeStyle }: ThemeStyleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<ThemeStyleFormData>({
    resolver: zodResolver(themeStyleSchema),
    defaultValues: {
      name: themeStyle?.name || '',
      description: themeStyle?.description || '',
      sortOrder: themeStyle?.sortOrder || 0,
      isActive: themeStyle?.isActive ?? true,
      colors: themeStyle?.colors && themeStyle.colors.length > 0 ? themeStyle.colors : ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    },
  })

  const onSubmit = async (data: ThemeStyleFormData) => {
    try {
      setLoading(true)

      if (themeStyle) {
        await updateThemeStyle(themeStyle.id, data)
        toast({ intent: 'success', description: 'Tema stili başarıyla güncellendi.' })
      } else {
        await createThemeStyle(data)
        toast({ intent: 'success', description: 'Tema stili başarıyla oluşturuldu.' })
      }

      router.push('/admin/themes')
    } catch (_error) {
      toast({ intent: 'error', description: 'Tema stili kaydedilirken bir hata oluştu.' })
    } finally {
      setLoading(false)
    }
  }



  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tema Stili Adı</FormLabel>
              <FormControl>
                <Input placeholder="Romantik, Elegant, Modern..." {...field} />
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
                <Textarea
                  placeholder="Tema stili hakkında açıklama..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Renk Paleti (4 Renk)</FormLabel>
              <FormControl>
                <div className="grid grid-cols-4 gap-4">
                  {(field.value || []).map((color, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            const input = document.getElementById(`color-${index}`) as HTMLInputElement
                            input?.click()
                          }}
                        />
                        <div className="flex flex-col space-y-1">
                          <Input
                            id={`color-${index}`}
                            type="color"
                            value={color}
                            onChange={(e) => {
                              const newColors = [...field.value]
                              newColors[index] = e.target.value
                              field.onChange(newColors)
                            }}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={color}
                            onChange={(e) => {
                              const newColors = [...field.value]
                              newColors[index] = e.target.value
                              field.onChange(newColors)
                            }}
                            placeholder="#000000"
                            className="w-20 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">Renk {index + 1}</p>
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Aktif</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Tema stili aktif olarak gösterilsin mi?
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/themes')}
            disabled={loading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : themeStyle ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
