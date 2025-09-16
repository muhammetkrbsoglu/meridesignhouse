'use server'

import { getSupabaseAdmin, createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function addToFavorites(productId: string) {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    console.log('[favorites.add] auth', { hasUser: !!user, authError })
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' }
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin()
    console.log('[favorites.add] input', { productId })

    // Check if item already exists in favorites
    const { data: existingItem, error: checkError } = await supabase
      .from('favorites')
      .select('*')
      .eq('userId', user.id)
      .eq('productId', productId)
      .single()
    console.log('[favorites.add] existingItem', { existingItem, checkError })

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[favorites.add] check error', checkError)
      return { success: false, error: 'Favoriler kontrol edilirken hata oluştu' }
    }

    if (existingItem) {
      return { success: false, error: 'Ürün zaten favorilerde' }
    }

    const { error } = await supabase
      .from('favorites')
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        productId: productId
      })
    console.log('[favorites.add] insert', { error })

    if (error) {
      console.error('[favorites.add] insert error', error)
      return { success: false, error: 'Favorilere eklenemedi' }
    }

    revalidatePath('/favorites')
    
    // Dispatch favorite update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('favoriteUpdated'));
    }
    
    return { success: true }
  } catch (error) {
    console.error('[favorites.add] unexpected error', error)
    return { success: false, error: 'Favorilere eklenemedi' }
  }
}

export async function removeFromFavorites(productId: string) {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' }
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin()
    console.log('[favorites.remove] input', { productId })

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('userId', user.id)
      .eq('productId', productId)
    console.log('[favorites.remove] delete', { error })

    if (error) {
      console.error('[favorites.remove] delete error', error)
      return { success: false, error: 'Favorilerden çıkarılamadı' }
    }

    revalidatePath('/favorites')
    
    // Dispatch favorite update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('favoriteUpdated'));
    }
    
    return { success: true }
  } catch (error) {
    console.error('[favorites.remove] unexpected error', error)
    return { success: false, error: 'Favorilerden çıkarılamadı' }
  }
}

export async function isProductInFavorites(productId: string): Promise<boolean> {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    if (authError || !user) {
      return false
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('userId', user.id)
      .eq('productId', productId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[favorites.isProductInFavorites] check error', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('[favorites.isProductInFavorites] unexpected error', error)
    return false
  }
}

export async function getFavorites() {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    if (authError || !user) {
      return []
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin()

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        id,
        product:products!inner(
          id,
          name,
          slug,
          price,
          product_images!left(url, alt, "sortOrder"),
          category:categories!inner(id, name, slug)
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })


    if (error) {
      console.error('[favorites.getFavorites] select error', error)
      return []
    }

    return favorites || []
  } catch (error) {
    console.error('[favorites.getFavorites] unexpected error', error)
    return []
  }
}