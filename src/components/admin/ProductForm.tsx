'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GripVertical, X } from 'lucide-react'

import { createProduct, updateProduct } from '@/lib/actions/products'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageKitUpload } from '@/components/ui/imagekit-upload'
import { ImageKitImage } from '@/components/ui/imagekit-image'

interface Category {
  id: string;
  name: string;
}

const productSchema = z.object({
  name: z.string().min(1, 'Ürün adı gereklidir'),
  description: z.string().min(1, 'Açıklama gereklidir'),
  price: z.number().min(0, 'Fiyat 0 veya daha büyük olmalıdır'),
  oldPrice: z.number().min(0, 'Eski fiyat 0 veya daha büyük olmalıdır').optional(),
  stock: z.number().min(0, 'Stok 0 veya daha büyük olmalıdır'),
  categoryId: z.string().min(1, 'Kategori seçimi gereklidir'),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isProductOfWeek: z.boolean(),
  productOfWeekCategoryId: z.string().optional(),
  colors: z.array(z.string()).optional(),
  images: z.array(z.object({
    url: z.string(),
    fileId: z.string(),
    alt: z.string().optional(),
    sortOrder: z.number().optional()
  })).optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number;
  stock: number;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isProductOfWeek: boolean;
  productOfWeekCategoryId?: string;
  colors?: string[];
  images?: { 
    url: string;
    fileId: string;
    alt?: string;
    sortOrder?: number;
  }[];
}

interface ColorOption { id: string; name: string; slug: string; hex: string; is_active: boolean }

interface ProductFormProps {
  categories: Category[]
  product?: Product
  colors?: ColorOption[]
}

export function ProductForm({ categories, product, colors = [] }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<Array<{
    url: string;
    fileId: string;
    alt?: string;
    sortOrder?: number;
  }>>(product?.images || [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      oldPrice: product?.oldPrice || undefined,
      stock: product?.stock || 0,
      categoryId: product?.categoryId || '',
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      isNewArrival: product?.isNewArrival ?? false,
      isProductOfWeek: product?.isProductOfWeek ?? false,
      productOfWeekCategoryId: product?.productOfWeekCategoryId || '',
      colors: product?.colors || [],
      images: product?.images || [],
    },
  })

  const isActive = watch('isActive')
  const categoryId = watch('categoryId')
  const isFeatured = watch('isFeatured')
  const isNewArrival = watch('isNewArrival')
  const isProductOfWeek = watch('isProductOfWeek')
  const productOfWeekCategoryId = watch('productOfWeekCategoryId')

  // Selected color ids (from palette)
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>(() => {
    const productHexes = (product?.colors || []).map(c => c.toLowerCase())
    return colors
      .filter(c => productHexes.includes(c.hex.toLowerCase()))
      .map(c => c.id)
  })

  const toggleColor = (id: string) => {
    setSelectedColorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleImageUpload = (result: any) => {
    const newImage = {
      url: result.url,
      fileId: result.fileId,
      alt: result.name,
      sortOrder: uploadedImages.length
    }
    
    const updatedImages = [...uploadedImages, newImage]
    setUploadedImages(updatedImages)
    setValue('images', updatedImages)
  }

  const handleImageRemove = (fileId: string) => {
    const updatedImages = uploadedImages.filter(img => img.fileId !== fileId)
    setUploadedImages(updatedImages)
    setValue('images', updatedImages)
  }

  // Reordering UI henüz bağlı değil; kullanılmadığı için geçici olarak kaldırıldı
  // const handleImageReorder = (fromIndex: number, toIndex: number) => {
  // }

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('description', data.description || '')
      formData.append('price', data.price.toString())
      if (data.oldPrice) formData.append('oldPrice', data.oldPrice.toString())
      formData.append('stock', data.stock.toString())
      formData.append('categoryId', data.categoryId)
      if (data.isActive) formData.append('isActive', 'on')
      if (data.isFeatured) formData.append('isFeatured', 'on')
      if (data.isNewArrival) formData.append('isNewArrival', 'on')
      if (data.isProductOfWeek) formData.append('isProductOfWeek', 'on')
      if (data.productOfWeekCategoryId) formData.append('productOfWeekCategoryId', data.productOfWeekCategoryId)
      
      // Add images data
      if (data.images && data.images.length > 0) {
        formData.append('images', JSON.stringify(data.images))
      }

      // Add selected color ids for server to process
      formData.append('colorIds', JSON.stringify(selectedColorIds))

      if (product) {
        const result = await updateProduct(product.id, {}, formData)
        if (result.message && !result.errors) {
          setSuccess('Ürün başarıyla güncellendi!')
        } else {
          setError(result.message || 'Bir hata oluştu')
        }
      } else {
        const result = await createProduct({}, formData)
        if (result.message && !result.errors) {
          setSuccess('Ürün başarıyla oluşturuldu!')
          setTimeout(() => {
            router.push('/admin/products')
          }, 2000)
        } else {
          setError(result.message || 'Bir hata oluştu')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Ürün Adı</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ürün adını girin"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Renkler</Label>
          {colors.length === 0 && (
            <div className="text-xs text-gray-500">
              Henüz aktif renk yok. <a href="/admin/settings/colors" className="text-rose-600 hover:underline">Renk Yöneticisi</a>&rsquo;nden renk ekleyebilirsiniz.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const active = selectedColorIds.includes(c.id)
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleColor(c.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${active ? 'border-rose-500 bg-rose-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  title={c.name}
                >
                  <span className="inline-block h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-500">Birden çok renk seçebilirsiniz.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Kategori</Label>
          <Select
            value={categoryId}
            onValueChange={(value) => setValue('categoryId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Fiyat (TL)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="oldPrice">Eski Fiyat (TL)</Label>
          <Input
            id="oldPrice"
            type="number"
            step="0.01"
            {...register('oldPrice', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.oldPrice && (
            <p className="text-sm text-red-600">{errors.oldPrice.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stok Adedi</Label>
          <Input
            id="stock"
            type="number"
            {...register('stock', { valueAsNumber: true })}
            placeholder="0"
          />
          {errors.stock && (
            <p className="text-sm text-red-600">{errors.stock.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Ürün açıklamasını girin"
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Image Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Ürün Görselleri</Label>
          <Badge variant="secondary">
            {uploadedImages.length} / 10 görsel
          </Badge>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Görsel Yükle
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ImageKitUpload
              onUploadSuccess={handleImageUpload}
              onUploadError={(error) => setError(error)}
              folder="products"
              maxFiles={10}
              maxSize={5 * 1024 * 1024} // 5MB
              acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
              multiple={true}
              showPreview={false}
            />
          </CardContent>
        </Card>

        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Yüklenen Görseller ({uploadedImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={image.fileId} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                      <ImageKitImage
                        src={image.url}
                        alt={image.alt || `Ürün görseli ${index + 1}`}
                        preset="thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Image Info */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">
                          #{index + 1}
                        </span>
                        {image.sortOrder !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Sıra: {image.sortOrder + 1}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-6 h-6 rounded-full p-0"
                        onClick={() => handleImageRemove(image.fileId)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Drag Handle */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-6 h-6 rounded-full p-0 cursor-move"
                      >
                        <GripVertical className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {uploadedImages.length > 1 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    ğŸ’¡ Görselleri sürükleyip bırakarak sıralayabilirsiniz. İlk görsel ana görsel olarak kullanılır.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => setValue('isActive', checked)}
          />
          <Label htmlFor="isActive">Aktif</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isFeatured"
            checked={isFeatured}
            onCheckedChange={(checked) => setValue('isFeatured', checked)}
          />
          <Label htmlFor="isFeatured">Öne Çıkan</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isNewArrival"
            checked={isNewArrival}
            onCheckedChange={(checked) => setValue('isNewArrival', checked)}
          />
          <Label htmlFor="isNewArrival">Yeni Ürün</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isProductOfWeek"
            checked={isProductOfWeek}
            onCheckedChange={(checked) => setValue('isProductOfWeek', checked)}
          />
          <Label htmlFor="isProductOfWeek">Haftanın Ürünü</Label>
        </div>
      </div>

      {isProductOfWeek && (
        <div className="space-y-2">
          <Label htmlFor="productOfWeekCategoryId">Haftanın Ürünü Kategorisi</Label>
          <Select
            value={productOfWeekCategoryId}
            onValueChange={(value) => setValue('productOfWeekCategoryId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.productOfWeekCategoryId && (
            <p className="text-sm text-red-600">{errors.productOfWeekCategoryId.message}</p>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Kaydediliyor...'
            : product
            ? 'Güncelle'
            : 'Oluştur'}
        </Button>
      </div>
    </form>
  )
}
