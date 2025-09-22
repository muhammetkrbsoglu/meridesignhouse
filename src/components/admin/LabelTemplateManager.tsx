'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { ImageKitUpload, SimpleImageKitUpload } from '@/components/ui/imagekit-upload'
import {
  type LabelCategory,
  type LabelSize,
  type LabelTemplate,
  type LabelCategoryWithSizes,
  createLabelCategory,
  updateLabelCategory,
  deleteLabelCategory,
  createLabelSize,
  updateLabelSize,
  deleteLabelSize,
  createLabelTemplate,
  updateLabelTemplate,
  deleteLabelTemplate,
  createMultipleLabelTemplates,
  getLabelCategories,
} from '@/lib/actions/label-templates'
import { generateSlugFromName } from '@/lib/utils/slug'

interface CategoryFormData {
  name: string
  slug: string
  description: string
}

interface SizeFormData {
  name: string
  value: string
  width_mm: string
  height_mm: string
}

interface TemplateFormData {
  title: string
  description: string
  image_url: string
  thumbnail_url: string
  tags: string
}

export function LabelTemplateManager() {
  const [categories, setCategories] = useState<LabelCategoryWithSizes[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'manage' | 'preview'>('manage')
  
  // Form states
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: ''
  })
  const [sizeForm, setSizeForm] = useState<SizeFormData>({
    name: '',
    value: '',
    width_mm: '',
    height_mm: ''
  })
  const [templateForm, setTemplateForm] = useState<TemplateFormData>({
    title: '',
    description: '',
    image_url: '',
    thumbnail_url: '',
    tags: ''
  })

  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<LabelCategory | null>(null)
  const [editingSize, setEditingSize] = useState<LabelSize | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<LabelTemplate | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getLabelCategories()
      if (result.success) {
        setCategories(result.data)
        if (result.data.length > 0 && !selectedCategory) {
          setSelectedCategory(result.data[0].id)
        }
      } else {
        toast.error(result.error || 'Kategoriler yüklenemedi')
      }
    } catch (error) {
      toast.error('Kategoriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Category handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCategory) {
        const result = await updateLabelCategory(editingCategory.id, {
          name: categoryForm.name,
          slug: categoryForm.slug,
          description: categoryForm.description || undefined
        })
        
        if (result.success) {
          toast.success('Kategori güncellendi')
          setCategoryDialogOpen(false)
          setEditingCategory(null)
          loadCategories()
        } else {
          toast.error(result.error || 'Kategori güncellenemedi')
        }
      } else {
        const result = await createLabelCategory({
          name: categoryForm.name,
          slug: categoryForm.slug,
          description: categoryForm.description || undefined
        })
        
        if (result.success) {
          toast.success('Kategori oluşturuldu')
          setCategoryDialogOpen(false)
          loadCategories()
        } else {
          toast.error(result.error || 'Kategori oluşturulamadı')
        }
      }
      
      setCategoryForm({ name: '', slug: '', description: '' })
    } catch (error) {
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const result = await deleteLabelCategory(categoryId)
      if (result.success) {
        toast.success('Kategori silindi')
        loadCategories()
        if (selectedCategory === categoryId) {
          setSelectedCategory('')
        }
      } else {
        toast.error(result.error || 'Kategori silinemedi')
      }
    } catch (error) {
      toast.error('Kategori silinirken hata oluştu')
    }
  }

  // Size handlers
  const handleSizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCategory) {
      toast.error('Önce bir kategori seçin')
      return
    }

    try {
      if (editingSize) {
        const result = await updateLabelSize(editingSize.id, {
          name: sizeForm.name,
          value: sizeForm.value,
          width_mm: sizeForm.width_mm ? parseInt(sizeForm.width_mm) : undefined,
          height_mm: sizeForm.height_mm ? parseInt(sizeForm.height_mm) : undefined
        })
        
        if (result.success) {
          toast.success('Boyut güncellendi')
          setSizeDialogOpen(false)
          setEditingSize(null)
          loadCategories()
        } else {
          toast.error(result.error || 'Boyut güncellenemedi')
        }
      } else {
        const result = await createLabelSize({
          category_id: selectedCategory,
          name: sizeForm.name,
          value: sizeForm.value,
          width_mm: sizeForm.width_mm ? parseInt(sizeForm.width_mm) : undefined,
          height_mm: sizeForm.height_mm ? parseInt(sizeForm.height_mm) : undefined
        })
        
        if (result.success) {
          toast.success('Boyut oluşturuldu')
          setSizeDialogOpen(false)
          loadCategories()
        } else {
          toast.error(result.error || 'Boyut oluşturulamadı')
        }
      }
      
      setSizeForm({ name: '', value: '', width_mm: '', height_mm: '' })
    } catch (error) {
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  const handleDeleteSize = async (sizeId: string) => {
    try {
      const result = await deleteLabelSize(sizeId)
      if (result.success) {
        toast.success('Boyut silindi')
        loadCategories()
        if (selectedSize === sizeId) {
          setSelectedSize('')
        }
      } else {
        toast.error(result.error || 'Boyut silinemedi')
      }
    } catch (error) {
      toast.error('Boyut silinirken hata oluştu')
    }
  }

  // Template handlers
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSize) {
      toast.error('Önce bir boyut seçin')
      return
    }

    try {
      const tags = templateForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      
      if (editingTemplate) {
        const result = await updateLabelTemplate(editingTemplate.id, {
          title: templateForm.title,
          description: templateForm.description || undefined,
          image_url: templateForm.image_url,
          thumbnail_url: templateForm.thumbnail_url || undefined,
          tags: tags.length > 0 ? tags : undefined
        })
        
        if (result.success) {
          toast.success('Şablon güncellendi')
          setTemplateDialogOpen(false)
          setEditingTemplate(null)
          loadCategories()
        } else {
          toast.error(result.error || 'Şablon güncellenemedi')
        }
      } else {
        const result = await createLabelTemplate({
          size_id: selectedSize,
          title: templateForm.title,
          description: templateForm.description || undefined,
          image_url: templateForm.image_url,
          thumbnail_url: templateForm.thumbnail_url || undefined,
          tags: tags.length > 0 ? tags : undefined
        })
        
        if (result.success) {
          toast.success('Şablon oluşturuldu')
          setTemplateDialogOpen(false)
          loadCategories()
        } else {
          toast.error(result.error || 'Şablon oluşturulamadı')
        }
      }
      
      setTemplateForm({ title: '', description: '', image_url: '', thumbnail_url: '', tags: '' })
    } catch (error) {
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const result = await deleteLabelTemplate(templateId)
      if (result.success) {
        toast.success('Şablon silindi')
        loadCategories()
      } else {
        toast.error(result.error || 'Şablon silinemedi')
      }
    } catch (error) {
      toast.error('Şablon silinirken hata oluştu')
    }
  }

  // Helper functions
  const openCategoryDialog = (category?: LabelCategory) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        description: category.description || ''
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', slug: '', description: '' })
    }
    setCategoryDialogOpen(true)
  }

  const openSizeDialog = (size?: LabelSize) => {
    if (size) {
      setEditingSize(size)
      setSizeForm({
        name: size.name,
        value: size.value,
        width_mm: size.width_mm?.toString() || '',
        height_mm: size.height_mm?.toString() || ''
      })
    } else {
      setEditingSize(null)
      setSizeForm({ name: '', value: '', width_mm: '', height_mm: '' })
    }
    setSizeDialogOpen(true)
  }

  const openTemplateDialog = (template?: LabelTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setTemplateForm({
        title: template.title,
        description: template.description || '',
        image_url: template.image_url,
        thumbnail_url: template.thumbnail_url || '',
        tags: template.tags?.join(', ') || ''
      })
    } else {
      setEditingTemplate(null)
      setTemplateForm({ title: '', description: '', image_url: '', thumbnail_url: '', tags: '' })
    }
    setTemplateDialogOpen(true)
  }

  const handleCategoryNameChange = (name: string) => {
    setCategoryForm(prev => ({
      ...prev,
      name,
      slug: generateSlugFromName(name)
    }))
  }

  const currentCategory = categories.find(cat => cat.id === selectedCategory)
  const currentSizes = currentCategory?.label_sizes || []
  const currentSize = currentSizes.find(size => size.id === selectedSize)
  const currentTemplates = currentSize?.label_templates || []

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Etiket Şablonları</h1>
          <p className="text-muted-foreground">Kategoriler, boyutlar ve şablonları yönetin</p>
        </div>
        <Button onClick={() => openCategoryDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant={viewMode === 'manage' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('manage')}
        >
          Yönetim
        </Button>
        <Button 
          variant={viewMode === 'preview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('preview')}
        >
          Önizleme
        </Button>
      </div>

      {viewMode === 'manage' && (
        <div className="space-y-6">
          {/* Categories Section */}
          <Card>
            <CardHeader>
              <CardTitle>Kategoriler</CardTitle>
              <CardDescription>
                Şablon kategorilerini yönetin (Söz-Nişan-Kına, Doğum Günü vb.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{category.name}</h3>
                        <Badge variant="secondary">{category.slug}</Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.label_sizes?.length || 0} boyut, {' '}
                        {category.label_sizes?.reduce((total, size) => total + (size.label_templates?.length || 0), 0) || 0} şablon
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className={selectedCategory === category.id ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {selectedCategory === category.id ? 'Seçili' : 'Seç'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCategoryDialog(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm boyutlar ve şablonlar da silinecek.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                
                {categories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz kategori yok. İlk kategorinizi oluşturun.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sizes Section */}
          {selectedCategory && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Boyutlar</CardTitle>
                    <CardDescription>
                      {currentCategory?.name} kategorisi için boyutları yönetin
                    </CardDescription>
                  </div>
                  <Button onClick={() => openSizeDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Boyut
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {currentSizes.map((size) => (
                    <div key={size.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{size.name}</h4>
                          <Badge variant="outline">{size.value}</Badge>
                        </div>
                        {(size.width_mm || size.height_mm) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {size.width_mm}×{size.height_mm} mm
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {size.label_templates?.length || 0} şablon
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSize(size.id)}
                          className={selectedSize === size.id ? 'bg-primary text-primary-foreground' : ''}
                        >
                          {selectedSize === size.id ? 'Seçili' : 'Seç'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSizeDialog(size)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Boyutu Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu boyutu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm şablonlar da silinecek.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSize(size.id)}>
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  
                  {currentSizes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Bu kategori için henüz boyut yok. İlk boyutunuzu oluşturun.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Templates Section */}
          {selectedSize && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Şablonlar</CardTitle>
                    <CardDescription>
                      {currentSize?.name} boyutu için şablonları yönetin (Maks. 40 şablon)
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => openTemplateDialog()}
                    disabled={currentTemplates.length >= 40}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Şablon
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {currentTemplates.map((template) => (
                    <div key={template.id} className="border rounded-lg overflow-hidden">
                      <div className="aspect-square relative bg-gray-100">
                        {template.image_url ? (
                          <Image
                            src={template.image_url}
                            alt={template.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h5 className="font-medium text-sm mb-1">{template.title}</h5>
                        {template.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {template.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTemplateDialog(template)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Düzenle
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu şablonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {currentTemplates.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Bu boyut için henüz şablon yok. İlk şablonunuzu oluşturun.
                    </div>
                  )}
                </div>
                
                {currentTemplates.length > 0 && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    {currentTemplates.length} / 40 şablon kullanılıyor
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {viewMode === 'preview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Şablon Önizlemesi</CardTitle>
              <CardDescription>
                Müşterilerin göreceği şablon kataloğunu önizleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCategory && selectedSize ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge>{currentCategory?.name}</Badge>
                    <Badge variant="outline">{currentSize?.name}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentTemplates.map((template) => (
                      <div key={template.id} className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                        <div className="aspect-square relative bg-gray-100">
                          {template.image_url ? (
                            <Image
                              src={template.image_url}
                              alt={template.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="font-medium text-sm">{template.title}</p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Önizleme için bir kategori ve boyut seçin
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </DialogTitle>
            <DialogDescription>
              Şablon kategorisi bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-name">Kategori Adı</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                  placeholder="Söz-Nişan-Kına Kartları"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category-slug">URL Adı (Slug)</Label>
                <Input
                  id="category-slug"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="soz-nisan-kina-kartlari"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category-description">Açıklama (Opsiyonel)</Label>
                <Textarea
                  id="category-description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Bu kategori hakkında kısa açıklama"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit">
                {editingCategory ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Size Dialog */}
      <Dialog open={sizeDialogOpen} onOpenChange={setSizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSize ? 'Boyut Düzenle' : 'Yeni Boyut'}
            </DialogTitle>
            <DialogDescription>
              Etiket/kart boyutu bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSizeSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="size-name">Boyut Adı</Label>
                <Input
                  id="size-name"
                  value={sizeForm.name}
                  onChange={(e) => setSizeForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="10x15 cm Kartlar"
                  required
                />
              </div>
              <div>
                <Label htmlFor="size-value">Boyut Değeri</Label>
                <Input
                  id="size-value"
                  value={sizeForm.value}
                  onChange={(e) => setSizeForm(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="10x15_cm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size-width">Genişlik (mm)</Label>
                  <Input
                    id="size-width"
                    type="number"
                    value={sizeForm.width_mm}
                    onChange={(e) => setSizeForm(prev => ({ ...prev, width_mm: e.target.value }))}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="size-height">Yükseklik (mm)</Label>
                  <Input
                    id="size-height"
                    type="number"
                    value={sizeForm.height_mm}
                    onChange={(e) => setSizeForm(prev => ({ ...prev, height_mm: e.target.value }))}
                    placeholder="150"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setSizeDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit">
                {editingSize ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-7xl w-[96vw]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon'}
            </DialogTitle>
            <DialogDescription>
              Şablon bilgilerini ve görsel URL'ini girin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTemplateSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: text fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-title">Şablon Başlığı</Label>
                    <Input
                      id="template-title"
                      value={templateForm.title}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Şablon 01"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-tags">Etiketler (virgülle ayırın)</Label>
                    <Input
                      id="template-tags"
                      value={templateForm.tags}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="minimal, modern, klasik"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <Label htmlFor="template-description">Açıklama</Label>
                    <Input
                      id="template-description"
                      value={templateForm.description}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Minimal tipografi, modern görünüm"
                    />
                  </div>
                </div>
              </div>

              {/* Right: uploads and previews */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Şablon Görseli</Label>
                  <ImageKitUpload
                    folder="label-templates"
                    multiple={false}
                    maxFiles={1}
                    showPreview={false}
                    onUploadSuccess={(res) => {
                      setTemplateForm(prev => ({ ...prev, image_url: res.url }))
                      toast.success('Görsel yüklendi')
                    }}
                    onUploadError={(err) => toast.error(err)}
                  />
                  {templateForm.image_url && (
                    <div className="mt-2">
                      <div className="aspect-square relative w-28 rounded border overflow-hidden bg-gray-100">
                        <Image src={templateForm.image_url} alt="Önizleme" fill className="object-cover" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Küçük Görsel (Opsiyonel)</Label>
                  <SimpleImageKitUpload
                    folder="label-templates/thumbnails"
                    buttonText="Küçük Görsel Yükle"
                    onUploadSuccess={(res) => {
                      setTemplateForm(prev => ({ ...prev, thumbnail_url: res.url }))
                      toast.success('Küçük görsel yüklendi')
                    }}
                    onUploadError={(err) => toast.error(err)}
                  />
                  {templateForm.thumbnail_url && (
                    <div className="mt-2">
                      <div className="aspect-square relative w-16 rounded border overflow-hidden bg-gray-100">
                        <Image src={templateForm.thumbnail_url} alt="Küçük Önizleme" fill className="object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit">
                {editingTemplate ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
