'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Kategori adı gereklidir'),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean(),
})

const CreateCategory = CategorySchema.omit({ id: true })
const UpdateCategory = CategorySchema.omit({ id: true })

export type State = {
  errors?: {
    name?: string[]
    description?: string[]
    parentId?: string[]
    isActive?: string[]
  }
  message?: string | null
}

export async function createCategory(data: z.infer<typeof CreateCategory>) {
  // Validate form fields
  const validatedFields = CreateCategory.safeParse(data)

  if (!validatedFields.success) {
    throw new Error('Geçersiz form verileri')
  }

  const { name, description, parentId, isActive } = validatedFields.data

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  const slug = generateSlug(name);

  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('categories')
      .insert({
        id: randomUUID(),
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        isActive: isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Kategori oluşturulamadı')
    }
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Kategori oluşturulamadı')
  }

  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function updateCategory(
  id: string,
  data: z.infer<typeof UpdateCategory>
) {
  const validatedFields = UpdateCategory.safeParse(data)

  if (!validatedFields.success) {
    throw new Error('Geçersiz form verileri')
  }

  const { name, description, parentId, isActive } = validatedFields.data

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  const slug = generateSlug(name);

  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('categories')
      .update({
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        isActive: isActive,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Kategori güncellenemedi')
    }
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Kategori güncellenemedi')
  }

  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function deleteCategory(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    // Check if category has children
    const { data: childCategories, error: childError } = await supabase
      .from('categories')
      .select('id')
      .eq('parentId', id)

    if (childError) {
      console.error('Alt kategori kontrolü hatası:', childError)
      throw new Error(`Alt kategori kontrolü başarısız: ${childError.message}`)
    }

    if (childCategories && childCategories.length > 0) {
      throw new Error('Alt kategorileri olan kategori silinemez')
    }

    // Check if category has products
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('categoryId', id)

    if (productError) {
      console.error('Ürün kontrolü hatası:', productError)
      throw new Error(`Ürün kontrolü başarısız: ${productError.message}`)
    }

    if (products && products.length > 0) {
      throw new Error('Ürünleri olan kategori silinemez')
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Kategori silme hatası:', error)
      throw new Error(`Kategori silinemedi: ${error.message}`)
    }

    console.log('Kategori başarıyla silindi:', id)
  } catch (error) {
    console.error('deleteCategory hatası:', error)
    // Eğer error zaten bir Error objesi ise, onu fırlat
    if (error instanceof Error) {
      throw error
    }
    // Değilse, generic hata mesajı
    throw new Error(`Kategori silinemedi: ${error}`)
  }

  revalidatePath('/admin/categories')
}

const ITEMS_PER_PAGE = 6

export async function fetchFilteredCategories(
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  try {
    const supabase = getSupabaseAdmin()
    
    // Önce kategorileri getir
    let queryBuilder = supabase
      .from('categories')
      .select(`
        *,
        children:categories!parentId(id, name)
      `)
      .order('createdAt', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1)

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { data: categories, error } = await queryBuilder

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Kategoriler getirilemedi')
    }

    if (!categories || categories.length === 0) return []

    // Parent kategorileri manuel olarak fetch et
    const parentIds = categories
      .map(cat => cat.parentId)
      .filter(id => id !== null)
      .filter((id, index, arr) => arr.indexOf(id) === index) // unique

    let parentCategories: Array<{ id: string; name: string }> = []
    if (parentIds.length > 0) {
      const { data: parents, error: parentError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', parentIds)

      if (parentError) {
        console.error('Parent categories error:', parentError)
      } else {
        parentCategories = (parents || []) as Array<{ id: string; name: string }>
      }
    }

    // Kategorilere parent bilgisini ekle
    const categoriesWithParent = categories.map(category => ({
      ...category,
      parent: category.parentId 
        ? parentCategories.find(p => p.id === category.parentId) 
        : null
    }))

    // Her kategori için ürün sayısını çek
    const categoriesWithCounts = await Promise.all(
      categoriesWithParent.map(async (category) => {
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('categoryId', category.id)
          .eq('isActive', true)

        return {
          ...category,
          productCount: productCount || 0
        }
      })
    )

    return categoriesWithCounts
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Kategoriler getirilemedi')
  }
}

export async function fetchMainCategories() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, description, slug, image')
      .is('parentId', null)
      .eq('isActive', true)
      .order('sortOrder', { ascending: true })

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Ana kategoriler getirilemedi')
    }

    return categories?.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      imageUrl: category.image || '/placeholder-category.jpg'
    })) || []
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Ana kategoriler getirilemedi')
  }
}

// Hiyerarşik kategori yapısını getir (4 seviyeye kadar)
export async function fetchCategoryHierarchy(parentId: string | null = null, level: number = 0): Promise<any[]> {
  try {
    const supabase = getSupabaseAdmin()
    
    if (level >= 4) return [] // Maksimum 4 seviye
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, parentId, isActive, sortOrder')
      .eq('parentId', parentId)
      .eq('isActive', true)
      .order('sortOrder', { ascending: true })

    if (error) {
      console.error('Database Error:', error)
      return []
    }

    if (!categories || categories.length === 0) return []

    // Her kategori için alt kategorileri recursive olarak getir
    const categoriesWithChildren = await Promise.all(
      categories.map(async (category) => {
        const children = await fetchCategoryHierarchy(category.id, level + 1)
        return {
          ...category,
          children,
          level
        }
      })
    )

    return categoriesWithChildren
  } catch (error) {
    console.error('Database Error:', error)
    return []
  }
}

// Tüm ana kategorileri hiyerarşik yapıyla getir
export async function fetchAllMainCategoriesWithHierarchy() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: mainCategories, error } = await supabase
      .from('categories')
      .select('id, name, description, slug, image, sortOrder')
      .is('parentId', null)
      .eq('isActive', true)
      .order('sortOrder', { ascending: true })

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Ana kategoriler getirilemedi')
    }

    if (!mainCategories) return []

    // Her ana kategori için hiyerarşik yapıyı getir
    const categoriesWithHierarchy = await Promise.all(
      mainCategories.map(async (category) => {
        const children = await fetchCategoryHierarchy(category.id, 1)
        return {
          ...category,
          children,
          level: 0
        }
      })
    )

    return categoriesWithHierarchy
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Ana kategoriler getirilemedi')
  }
}

export async function fetchCategoriesPages(query: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    let queryBuilder = supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { count, error } = await queryBuilder

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Kategori sayısı getirilemedi')
    }

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)
    return totalPages
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Kategori sayısı getirilemedi')
  }
}

export async function fetchCategoryById(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        *,
        children:categories!parentId(id, name),
        products!inner(count)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Kategori getirilemedi')
    }

    // Parent kategori bilgisini manuel olarak fetch et
    let parent = null
    if (category.parentId) {
      const { data: parentData, error: parentError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', category.parentId)
        .single()

      if (!parentError && parentData) {
        parent = parentData
      }
    }

    return {
      ...category,
      parent
    }
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Kategori getirilemedi')
  }
}

export async function fetchParentCategories() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name')
      .is('parentId', null)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Ana kategoriler getirilemedi')
    }

    return categories || []
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Ana kategoriler getirilemedi')
  }
}

// Çok seviyeli kategori yapısı için tüm kategorileri getir
export async function fetchAllCategoriesForParent() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id, 
        name, 
        parentId,
        parent:categories!parentId(id, name)
      `)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Kategoriler getirilemedi')
    }

    return categories || []
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Kategoriler getirilemedi')
  }
}

/**
 * Get category statistics for admin dashboard
 */
export async function getCategoryStats() {
  try {
    const supabase = getSupabaseAdmin()
    
    const [totalCategories, activeCategories] = await Promise.all([
      // Total categories count
      (await createServerClient())
        .from('categories')
        .select('*', { count: 'exact', head: true }),
      
      // Active categories count
      (await createServerClient())
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true),
    ])

    return {
      totalCategories: totalCategories.count || 0,
      activeCategories: activeCategories.count || 0,
    }
  } catch (error) {
    console.error('Error in getCategoryStats:', error)
    return {
      totalCategories: 0,
      activeCategories: 0,
    }
  }
}

export async function fetchAllCategories() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, parentId')
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Database Error:', error)
      throw new Error('Kategoriler getirilemedi')
    }

    return categories || []
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Kategoriler getirilemedi')
  }
}