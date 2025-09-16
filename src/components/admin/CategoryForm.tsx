'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createCategory, updateCategory } from '@/lib/actions/categories'
import { toast } from '@/hooks/use-toast'

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  parent?: {
    id: string;
    name: string;
  };
}
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const categorySchema = z.object({
  name: z.string().min(1, 'Kategori adı gereklidir'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

type CategoryFormData = {
  name: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

interface CategoryFormProps {
  category?: Category
  parentCategories: any[]
}

export function CategoryForm({ category, parentCategories }: CategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      parentId: category?.parentId || undefined,
      isActive: category?.isActive ?? true,
    },
  })

  const isActive = watch('isActive')

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true)
    try {
      const formData = {
        ...data,
        isActive: data.isActive ?? true
      }
      if (category) {
        await updateCategory(category.id, formData)
        toast({ intent: 'success', description: 'Kategori güncellendi' })
      } else {
        await createCategory(formData)
        toast({ intent: 'success', description: 'Kategori oluşturuldu' })
      }
      router.push('/admin/categories')
      router.refresh()
    } catch (error) {
      console.error('Form submission error:', error)
      toast({ intent: 'error', description: 'Kategori kaydedilemedi' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Kategori Adı */}
        <div className="mb-4">
          <Label htmlFor="name">Kategori Adı</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Kategori adını girin"
            className="mt-2"
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Açıklama */}
        <div className="mb-4">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Kategori açıklamasını girin (isteğe bağlı)"
            className="mt-2"
            rows={3}
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Üst Kategori */}
        <div className="mb-4">
          <Label htmlFor="parentId">Üst Kategori</Label>
          <Select
            onValueChange={(value) => setValue('parentId', value === 'none' ? undefined : value)}
            defaultValue={category?.parentId || 'none'}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Üst kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ana Kategori</SelectItem>
              {parentCategories
                .filter((parent) => parent.id !== category?.id) // Kendi kendini parent yapmasını engelle
                .map((parent) => {
                  // Hiyerarşik gösterim için prefix ekle
                  const getDisplayName = (category: { name: string; parent?: { id: string } | null }, level = 0): string => {
                    const prefix = '  '.repeat(level) + (level > 0 ? '└─ ' : '');
                    return `${prefix}${category.name}`;
                  };
                  
                  return (
                    <SelectItem key={parent.id} value={parent.id}>
                      {getDisplayName(parent, parent.parent ? 1 : 0)}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>

        {/* Aktif Durumu */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Aktif</Label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {isActive ? 'Kategori aktif ve görünür' : 'Kategori pasif ve gizli'}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Link
          href="/admin/categories"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          İptal
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Kaydediliyor...'
            : category
            ? 'Kategoriyi Güncelle'
            : 'Kategori Oluştur'}
        </Button>
      </div>
    </form>
  )
}