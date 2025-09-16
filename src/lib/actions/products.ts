'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { 
  ProductWithCategory, 
  SimpleProduct, 
  FeaturedProduct,
  convertSupabaseToProductWithCategory,
  convertToSimpleProduct,
  convertToFeaturedProduct
} from '@/types/product';

// Product validation schema
const ProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı gereklidir'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Fiyat 0 veya daha büyük olmalıdır'),
  oldPrice: z.coerce.number().min(0, 'Eski fiyat 0 veya daha büyük olmalıdır').optional(),
  categoryId: z.string().min(1, 'Kategori seçimi gereklidir'),
  stock: z.coerce.number().min(0, 'Stok 0 veya daha büyük olmalıdır'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isProductOfWeek: z.boolean().default(false),
  productOfWeekCategoryId: z.string().optional(),
  colors: z.array(z.string()).optional(),
})

const CreateProduct = ProductSchema
const UpdateProduct = ProductSchema.partial()

export type State = {
  errors?: {
    name?: string[]
    description?: string[]
    price?: string[]
    oldPrice?: string[]
    categoryId?: string[]
    stock?: string[]
    isActive?: string[]
    isFeatured?: string[]
    isNewArrival?: string[]
    isProductOfWeek?: string[]
    productOfWeekCategoryId?: string[]
  }
  message?: string | null
}

// Create product action
export async function createProduct(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = CreateProduct.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    oldPrice: formData.get('oldPrice') || undefined,
    categoryId: formData.get('categoryId'),
    stock: formData.get('stock'),
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    isNewArrival: formData.get('isNewArrival') === 'on',
    isProductOfWeek: formData.get('isProductOfWeek') === 'on',
    productOfWeekCategoryId: formData.get('productOfWeekCategoryId') || undefined,
    colors: undefined,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Eksik alanlar. Ürün oluşturulamadı.',
    }
  }

  const { name, description, price, oldPrice, categoryId, stock, isActive, isFeatured, isNewArrival, isProductOfWeek, productOfWeekCategoryId, colors } = validatedFields.data
  const colorsArray: string[] = Array.isArray(colors) ? colors : []

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
  }

  const slug = generateSlug(name || '')

  // Parse images from form data
  let images: Array<{ url: string; fileId: string; alt?: string; sortOrder?: number }> = []
  // Parse colorIds from form data
  let colorIds: string[] = []
  try {
    const colorIdsData = formData.get('colorIds')
    if (colorIdsData && typeof colorIdsData === 'string') {
      colorIds = JSON.parse(colorIdsData)
    }
  } catch (error) {
    console.error('Error parsing colorIds:', error)
  }
  try {
    const imagesData = formData.get('images')
    if (imagesData && typeof imagesData === 'string') {
      images = JSON.parse(imagesData)
    }
  } catch (error) {
    console.error('Error parsing images:', error)
  }

  try {
    const supabase = getSupabaseAdmin()
    
    // First, create the product
    const productId = randomUUID()
    const now = new Date().toISOString()
    
    const { data: _product, error: productError } = await supabase
      .from('products')
      .insert({
        id: productId,
        name,
        slug,
        description,
        price: (price || 0).toString(),
        oldPrice: oldPrice ? oldPrice.toString() : null,
        categoryId: categoryId,
        stock,
        isActive: isActive,
        isFeatured: isFeatured,
        isNewArrival: isNewArrival,
        isProductOfWeek: isProductOfWeek,
        productOfWeekCategoryId: productOfWeekCategoryId || null,
        colors: colorsArray,
        createdAt: now,
        updatedAt: now,
      })
      .select('id')
      .single()

    if (productError) {
      console.error('Supabase error:', productError)
      return {
        message: 'Database Hatası: Ürün oluşturulamadı.',
      }
    }

    // Then, insert product images if any
    if (images && images.length > 0) {
      const imageRecords = images.map((image, index) => ({
        id: randomUUID(),
        productId: productId,
        url: image.url,
        fileId: image.fileId || null,
        alt: image.alt || `${name} görseli ${index + 1}`,
        sortOrder: image.sortOrder !== undefined ? image.sortOrder : index,
        createdAt: now
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageRecords)

      if (imagesError) {
        console.error('Error inserting product images:', imagesError)
        // Don't fail the whole operation if images fail
      }
    }

    // Link colors via product_colors and also store hex list in products.colors for backward compatibility
    if (colorIds.length > 0) {
      const { data: colorRows, error: colorFetchError } = await supabase
        .from('colors')
        .select('id, hex')
        .in('id', colorIds)

      if (!colorFetchError && colorRows) {
        const hexes = colorRows.map((r: any) => r.hex)
        await supabase.from('products').update({ colors: hexes }).eq('id', productId)

        const now2 = now
        const rel = colorRows.map((r: any) => ({ product_id: productId, color_id: r.id, created_at: now2 }))
        const { error: relError } = await supabase.from('product_colors').upsert(rel, { onConflict: 'product_id,color_id' })
        if (relError) {
          console.error('product_colors upsert error:', relError)
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      message: 'Database Hatası: Ürün oluşturulamadı.',
    }
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

// Update product action
export async function updateProduct(
  id: string,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const validatedFields = UpdateProduct.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    oldPrice: formData.get('oldPrice') || undefined,
    categoryId: formData.get('categoryId'),
    stock: formData.get('stock'),
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    isNewArrival: formData.get('isNewArrival') === 'on',
    isProductOfWeek: formData.get('isProductOfWeek') === 'on',
    productOfWeekCategoryId: formData.get('productOfWeekCategoryId') || undefined,
    colors: undefined,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Eksik alanlar. Ürün güncellenemedi.',
    }
  }

  const { name, description, price, oldPrice, categoryId, stock, isActive, isFeatured, isNewArrival, isProductOfWeek, productOfWeekCategoryId, colors } = validatedFields.data
  const colorsArray: string[] | undefined = Array.isArray(colors) ? colors : undefined

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
  }

  const slug = generateSlug(name || '')

  // Parse images from form data
  let images: Array<{ url: string; fileId: string; alt?: string; sortOrder?: number }> = []
  // Parse colorIds from form data
  let colorIds: string[] = []
  try {
    const colorIdsData = formData.get('colorIds')
    if (colorIdsData && typeof colorIdsData === 'string') {
      colorIds = JSON.parse(colorIdsData)
    }
  } catch (error) {
    console.error('Error parsing colorIds (update):', error)
  }
  try {
    const imagesData = formData.get('images')
    if (imagesData && typeof imagesData === 'string') {
      images = JSON.parse(imagesData)
    }
  } catch (error) {
    console.error('Error parsing images:', error)
  }

  try {
    const supabase = getSupabaseAdmin()
    
    // First, update the product
    const now = new Date().toISOString()
    
    const { error: productError } = await supabase
      .from('products')
      .update({
        name,
        slug,
        description,
        price: (price || 0).toString(),
        oldPrice: oldPrice ? oldPrice.toString() : null,
        categoryId: categoryId,
        stock,
        isActive: isActive,
        isFeatured: isFeatured,
        isNewArrival: isNewArrival,
        isProductOfWeek: isProductOfWeek,
        productOfWeekCategoryId: productOfWeekCategoryId || null,
        ...(colorsArray !== undefined ? { colors: colorsArray } : {}),
        updatedAt: now,
      })
      .eq('id', id)

    if (productError) {
      console.error('Supabase error:', productError)
      return {
        message: 'Database Hatası: Ürün güncellenemedi.',
      }
    }

    // Update product color relations if provided
    if (Array.isArray(colorIds)) {
      // Clear existing
      await supabase.from('product_colors').delete().eq('product_id', id)
      if (colorIds.length > 0) {
        const { data: colorRows } = await supabase
          .from('colors')
          .select('id, hex')
          .in('id', colorIds)
        const hexes = (colorRows || []).map((r: any) => r.hex)
        await supabase.from('products').update({ colors: hexes }).eq('id', id)
        const now2 = new Date().toISOString()
        const rel = (colorRows || []).map((r: any) => ({ product_id: id, color_id: r.id, created_at: now2 }))
        await supabase.from('product_colors').upsert(rel, { onConflict: 'product_id,color_id' })
      } else {
        await supabase.from('products').update({ colors: [] }).eq('id', id)
      }
    }

    // Then, update product images if any
    if (images && images.length > 0) {
      // First, delete existing images
      await supabase
        .from('product_images')
        .delete()
        .eq('productId', id)

      // Then, insert new images
      const imageRecords = images.map((image, index) => ({
        id: randomUUID(),
        productId: id,
        url: image.url,
        fileId: image.fileId || null,
        alt: image.alt || `${name} görseli ${index + 1}`,
        sortOrder: image.sortOrder !== undefined ? image.sortOrder : index,
        createdAt: now
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageRecords)

      if (imagesError) {
        console.error('Error updating product images:', imagesError)
        // Don't fail the whole operation if images fail
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      message: 'Database Hatası: Ürün güncellenemedi.',
    }
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

// Delete product action
export async function deleteProduct(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Database Hatası: Ürün silinemedi.')
    }
    
    revalidatePath('/admin/products')
  } catch (error) {
    console.error('Delete product error:', error)
    throw new Error('Database Hatası: Ürün silinemedi.')
  }
}

// Fetch products with pagination
export async function fetchFilteredProducts(
  query: string,
  currentPage: number,
) {
  const ITEMS_PER_PAGE = 6
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  try {
    const supabase = getSupabaseAdmin()
    
    let queryBuilder = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name, slug),
        product_images(id, url, fileId, alt, sortOrder)
      `)
      .order('createdAt', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1)

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { data: products, error } = await queryBuilder

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Ürünler getirilemedi.')
    }

    return products || []
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Ürünler getirilemedi.')
  }
}

// Fetch products pages count
export async function fetchProductsPages(query: string) {
  const ITEMS_PER_PAGE = 6

  try {
    const supabase = getSupabaseAdmin()
    
    let queryBuilder = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { count, error } = await queryBuilder

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Ürün sayısı getirilemedi.')
    }

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)
    return totalPages
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Ürün sayısı getirilemedi.')
  }
}

// Fetch product by ID
export async function fetchProductById(id: string): Promise<{ id: string; name: string; slug: string; image?: string } | null> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, 
        name,
        slug,
        product_images (
          url
        )
      `)
      .eq('id', id)
      .eq('isActive', true)
      .maybeSingle()

    if (error) {
      console.error('Product fetch error:', error)
      return null
    }

    if (!data) {
      console.log('Product not found for ID:', id)
      return null
    }

    // ProductGrid ile aynı şekilde ilk görseli al
    const imageUrl = data.product_images && data.product_images.length > 0 ? data.product_images[0].url : null

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      image: imageUrl
    }
  } catch (error) {
    console.error('Product fetch error:', error)
    return null
  }
}

// Fetch categories for select options
export async function fetchCategories() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, parentId')
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Kategoriler getirilemedi.')
    }

    return categories || []
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Kategoriler getirilemedi.')
  }
}

/**
 * Get product statistics for admin dashboard
 */
export async function getProductStats() {
  try {
    const supabase = getSupabaseAdmin();
    
    const [totalProducts, recentProducts] = await Promise.all([
      // Total products count
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true }),
      
      // Recent products (last 30 days)
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return {
      totalProducts: totalProducts.count || 0,
      recentProducts: recentProducts.count || 0,
    };
  } catch (error) {
    console.error('Error in getProductStats:', error);
    return {
      totalProducts: 0,
      recentProducts: 0,
    };
  }
}

// Fetch all products for admin use (event-theme assignments)
export async function fetchProducts() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        colors,
        product_images(url, alt, sortOrder),
        category:categories!inner(id, name, slug)
      `)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Ürünler getirilemedi.')
    }

    // Transform the data to match the expected interface
    const transformedProducts = products?.map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: typeof product.price === 'object' ? parseFloat(product.price.toString()) : product.price,
      images: (product.product_images || []).map((img: any) => ({ url: img.url, alt: img.alt || null })),
      colors: product.colors || [],
      category: {
        id: product.category?.id || '',
        name: product.category?.name || 'Kategori Yok',
        slug: product.category?.slug || ''
      }
    })) || []

    return transformedProducts
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Ürünler getirilemedi.')
  }
}

// Fetch products with optional filters (customer products page)
export async function fetchProductsFiltered(
  colors?: string[],
  options?: {
    categoryId?: string
    query?: string
    minPrice?: number
    maxPrice?: number
    inStockOnly?: boolean
    sort?: 'popularity' | 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name'
  }
) {
  try {
    const supabase = getSupabaseAdmin()

    let queryBuilder = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        categoryId,
        stock,
        createdAt,
        colors,
        product_images(url, alt, sortOrder),
        category:categories!inner(id, name, slug)
      `)
      .eq('isActive', true)

    // Sort
    const sort = options?.sort || 'popularity'
    switch (sort) {
      case 'newest':
        queryBuilder = queryBuilder.order('createdAt', { ascending: false })
        break
      case 'oldest':
        queryBuilder = queryBuilder.order('createdAt', { ascending: true })
        break
      case 'price-asc':
        queryBuilder = queryBuilder.order('price', { ascending: true })
        break
      case 'price-desc':
        queryBuilder = queryBuilder.order('price', { ascending: false })
        break
      case 'name':
        queryBuilder = queryBuilder.order('name', { ascending: true })
        break
      case 'popularity':
      default:
        queryBuilder = queryBuilder.order('createdAt', { ascending: false })
        break
    }

    if (colors && colors.length > 0) {
      // Postgres array contains: colors @> colors[]
      queryBuilder = queryBuilder.contains('colors', colors)
    }

    if (options?.query) {
      const q = options.query
      queryBuilder = queryBuilder.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }

    if (options?.categoryId) {
      queryBuilder = queryBuilder.eq('categoryId', options.categoryId)
    }

    if (options?.minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', options.minPrice)
    }

    if (options?.maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', options.maxPrice)
    }

    if (options?.inStockOnly) {
      queryBuilder = queryBuilder.gt('stock', 0)
    }

    const { data: products, error } = await queryBuilder

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Ürünler getirilemedi.')
    }

    const transformed = (products || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: typeof product.price === 'object' ? parseFloat(product.price.toString()) : product.price,
      images: (product.product_images || []).map((img: any) => ({ url: img.url, alt: img.alt || null })),
      colors: product.colors || [],
      category: product.category,
      categoryId: product.categoryId,
      stock: product.stock,
      createdAt: product.createdAt,
    }))

    return transformed
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Ürünler getirilemedi.')
  }
}

// Collect dynamic color suggestions from products.colors and theme_styles.colors
export async function fetchColorSuggestions(limit: number = 24): Promise<string[]> {
  try {
    const supabase = getSupabaseAdmin()

    // Fetch colors from products
    const { data: productColorsData } = await supabase
      .from('products')
      .select('colors')
      .eq('isActive', true)

    // Fetch colors from theme styles
    const { data: themeColorsData } = await supabase
      .from('theme_styles')
      .select('colors')
      .eq('isActive', true)

    const productColors = (productColorsData || [])
      .flatMap((row: any) => Array.isArray(row.colors) ? row.colors : [])
    const themeColors = (themeColorsData || [])
      .flatMap((row: any) => Array.isArray(row.colors) ? row.colors : [])

    // Normalize, dedupe and keep order by frequency
    const all = [...productColors, ...themeColors]
      .filter(Boolean)
      .map((c: string) => c.toLowerCase())

    const freq = new Map<string, number>()
    for (const c of all) freq.set(c, (freq.get(c) || 0) + 1)

    const uniqueSorted = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c)

    // Fallback defaults if empty
    if (uniqueSorted.length === 0) {
      return ['#ffffff','#000000','#ff0000','#ffa500','#ffff00','#00ff00','#00ffff','#0000ff','#800080','#ff69b4']
    }

    return uniqueSorted.slice(0, limit)
  } catch (error) {
    console.error('Renk önerileri getirilirken hata:', error)
    return ['#ffffff','#000000','#ff0000','#ffa500','#ffff00','#00ff00','#00ffff','#0000ff','#800080','#ff69b4']
  }
}

// Customer site functions
const ITEMS_PER_PAGE = 12;

export async function fetchProductsByCategory(
  categorySlug: string,
  currentPage: number = 1,
  query?: string,
  sortBy: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name' | 'popularity' = 'newest',
  minPrice?: number,
  maxPrice?: number
): Promise<ProductWithCategory[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const supabase = getSupabaseAdmin();
    
    // Önce kategoriyi bul
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        children:categories!parentId(
          id,
          name,
          slug,
          children:categories!parentId(id, name, slug)
        )
      `)
      .eq('slug', categorySlug)
      .single();

    if (categoryError || !category) {
      return [];
    }

    // Tüm alt kategorilerin ID'lerini topla
    const categoryIds = [category.id];
    
    // 2. seviye alt kategoriler
    if (category.children) {
      category.children.forEach((child: { id: string; children?: { id: string }[] }) => {
        categoryIds.push(child.id);
        // 3. seviye alt kategoriler
        if (child.children) {
          child.children.forEach((grandChild: { id: string }) => {
            categoryIds.push(grandChild.id);
          });
        }
      });
    }

    // Sıralama seçenekleri
    let orderColumn = 'createdAt';
    let ascending = false;
    
    switch (sortBy) {
      case 'oldest':
        orderColumn = 'createdAt';
        ascending = true;
        break;
      case 'price-asc':
        orderColumn = 'price';
        ascending = true;
        break;
      case 'price-desc':
        orderColumn = 'price';
        ascending = false;
        break;
      case 'name':
        orderColumn = 'name';
        ascending = true;
        break;
    }

    let queryBuilder = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        isActive,
        createdAt,
        categoryId,
        product_images(url, alt, sortOrder),
        category:categories!inner(id, name, slug)
      `)
      .in('categoryId', categoryIds)
      .eq('isActive', true)
      .order(orderColumn, { ascending })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    const { data: products, error } = await queryBuilder;

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    return products.map((product: any) => 
      convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        gallery: [],
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category
      })
    );
  } catch (error) {
    console.error('Kategori ürünleri getirilirken hata:', error);
    return [];
  }
}

export async function fetchProductsCategoryPages(
  categorySlug: string,
  query?: string,
  minPrice?: number,
  maxPrice?: number
): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Önce kategoriyi bul
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select(`
        id,
        children:categories!parentId(
          id,
          children:categories!parentId(id)
        )
      `)
      .eq('slug', categorySlug)
      .single();

    if (categoryError || !category) {
      return 0;
    }

    // Tüm alt kategorilerin ID'lerini topla
    const categoryIds = [category.id];
    
    if (category.children) {
      category.children.forEach((child: { id: string; children?: { id: string }[] }) => {
        categoryIds.push(child.id);
        if (child.children) {
          child.children.forEach((grandChild: { id: string }) => {
            categoryIds.push(grandChild.id);
          });
        }
      });
    }

    let queryBuilder = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .in('categoryId', categoryIds)
      .eq('isActive', true);

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    const { count, error } = await queryBuilder;

    if (error) {
      console.error('Supabase error:', error);
      return 0;
    }

    return Math.ceil((count || 0) / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Kategori sayfa sayısı hesaplanırken hata:', error);
    return 0;
  }
}

export async function fetchCategoryBySlug(slug: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        *,
        parent:categories!parentId(id, name, slug),
        children:categories!parentId(
          id,
          name,
          slug,
          products!inner(count)
        ),
        products!inner(count)
      `)
      .eq('slug', slug)
      .eq('isActive', true)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }

    return category;
  } catch (error) {
    console.error('Kategori getirilirken hata:', error);
    return null;
  }
}

export async function fetchProductBySlug(slug: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(
          id,
          name,
          slug,
          parent:categories!parentId(id, name, slug)
        ),
        product_images(id, url, fileId, alt, sortOrder)
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }

    if (!product) {
      console.log('Product not found for slug:', slug);
      return null;
    }

    return product;
  } catch (error) {
    console.error('Ürün getirilirken hata:', error);
    return null;
  }
}

export async function fetchRelatedProducts(productId: string, categoryId: string, limit: number = 4): Promise<ProductWithCategory[]> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        product_images(url, alt, sortOrder),
        isActive,
        createdAt,
        categoryId,
        category:categories!inner(id, name, slug)
      `)
      .eq('categoryId', categoryId)
      .eq('isActive', true)
      .neq('id', productId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    return products.map((product: any) => {
      const gallery = Array.isArray(product.product_images)
        ? product.product_images
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((img: any) => img.url)
        : []
      return convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        gallery,
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category,
      })
    });
  } catch (error) {
    console.error('İlgili ürünler getirilirken hata:', error);
    return [];
  }
}

// Search products with sorting and filtering
export async function fetchSearchProducts(
  query: string,
  currentPage: number = 1,
  sortBy: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name' | 'popularity' = 'newest',
  minPrice?: number,
  maxPrice?: number
): Promise<ProductWithCategory[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const supabase = getSupabaseAdmin();
    
    // Sıralama seçenekleri
    let orderColumn = 'createdAt';
    let ascending = false;
    
    switch (sortBy) {
      case 'oldest':
        orderColumn = 'createdAt';
        ascending = true;
        break;
      case 'price-asc':
        orderColumn = 'price';
        ascending = true;
        break;
      case 'price-desc':
        orderColumn = 'price';
        ascending = false;
        break;
      case 'name':
        orderColumn = 'name';
        ascending = true;
        break;
      case 'popularity':
        // Popülerlik için createdAt kullanıyoruz (gelecekte view count eklenebilir)
        orderColumn = 'createdAt';
        ascending = false;
        break;
    }

    let queryBuilder = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        isActive,
        createdAt,
        categoryId,
        product_images(url, alt, sortOrder),
        category:categories!inner(id, name, slug)
      `)
      .eq('isActive', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order(orderColumn, { ascending })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    const { data: products, error } = await queryBuilder;

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    return products.map((product: any) => {
      const gallery = Array.isArray(product.product_images)
        ? product.product_images
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((img: any) => img.url)
        : []
      return convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        gallery,
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category
      })
    });
  } catch (error) {
    console.error('Arama ürünleri getirilirken hata:', error);
    return [];
  }
}

// Get search results page count
export async function fetchSearchProductsPages(
  query: string,
  minPrice?: number,
  maxPrice?: number
): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    
    let queryBuilder = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    const { count, error } = await queryBuilder;

    if (error) {
      console.error('Supabase error:', error);
      return 0;
    }

    return Math.ceil((count || 0) / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Arama sayfa sayısı hesaplanırken hata:', error);
    return 0;
  }
}

// Get price range for category or search
export async function fetchPriceRange(
  categorySlug?: string,
  searchQuery?: string
): Promise<{ min: number; max: number }> {
  try {
    const supabase = getSupabaseAdmin();
    
    let queryBuilder = supabase
      .from('products')
      .select('price')
      .eq('isActive', true);

    if (categorySlug) {
      // Get category and its children IDs
      const { data: category } = await supabase
        .from('categories')
        .select(`
          id,
          children:categories!parentId(
            id,
            children:categories!parentId(id)
          )
        `)
        .eq('slug', categorySlug)
        .single();

      if (category) {
        const categoryIds = [category.id];
        if (category.children) {
          category.children.forEach((child: { id: string; children?: { id: string }[] }) => {
            categoryIds.push(child.id);
            if (child.children) {
              child.children.forEach((grandChild: { id: string }) => {
                categoryIds.push(grandChild.id);
              });
            }
          });
        }
        queryBuilder = queryBuilder.in('categoryId', categoryIds);
      }
    }

    if (searchQuery) {
      queryBuilder = queryBuilder.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data: products, error } = await queryBuilder;

    if (error || !products || products.length === 0) {
      return { min: 0, max: 10000 };
    }

    const prices = products.map(p => p.price).filter(p => p != null);
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  } catch (error) {
    console.error('Fiyat aralığı hesaplanırken hata:', error);
    return { min: 0, max: 10000 };
  }
}

/**
 * Fetch featured products for homepage
 */
export async function fetchFeaturedProducts(limit: number = 8): Promise<FeaturedProduct[]> {
  try {
    // Use admin client to bypass RLS policies
    const supabase = getSupabaseAdmin();
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        isActive,
        createdAt,
        categoryId,
        category:categories!inner(id, name, slug),
        product_images(url, alt, sortOrder)
      `)
      .eq('isActive', true)
      .eq('isFeatured', true)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Öne çıkan ürünler getirilirken hata:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    const productsWithCategory = products.map((product: any) => {
      const gallery = Array.isArray(product.product_images)
        ? product.product_images
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((img: any) => img.url)
        : []
      return convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: typeof product.price === 'object' ? parseFloat(product.price.toString()) : product.price,
        gallery,
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category
      })
    });

    // FeaturedProduct'a dönüştür
    return productsWithCategory.map(convertToFeaturedProduct);
  } catch (error) {
    console.error('Öne çıkan ürünler getirilirken hata:', error);
    return [];
  }
}

/**
 * Fetch new arrivals for homepage
 */
export async function fetchNewArrivals(limit: number = 8): Promise<SimpleProduct[]> {
  try {
    // Use admin client to bypass RLS policies
    const supabase = getSupabaseAdmin()
    const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      price,
      isActive,
      isNewArrival,
      createdAt,
      categoryId,
      category:categories!inner(id, name, slug),
      product_images(url, alt, sortOrder)
    `)
    .eq('isActive', true)
    .eq('isNewArrival', true)
    .order('createdAt', { ascending: false })
    .limit(limit);

    if (error) {
      console.error('Yeni ürünler getirilirken hata:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    const productsWithCategory = products.map((product: any) => {
      const gallery = Array.isArray(product.product_images)
        ? product.product_images
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((img: any) => img.url)
        : []
      return convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: typeof product.price === 'object' ? parseFloat(product.price.toString()) : product.price,
        gallery,
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category
      })
    });

    // SimpleProduct'a dönüştür
    return productsWithCategory.map(convertToSimpleProduct);
  } catch (error) {
    console.error('Yeni ürünler getirilirken hata:', error);
    return [];
  }
}
