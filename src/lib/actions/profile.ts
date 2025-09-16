'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  birth_date: string | null
  gender: string | null
  preferences: any
  newsletter_subscription: boolean
  profile_image: string | null
  createdAt: string
  updatedAt: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, phone, address, city, state, zip_code, country, birth_date, gender, preferences, newsletter_subscription, profile_image, createdAt, updatedAt')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profile getirme hatası:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Profile getirme hatası:', error)
    return null
  }
}

export interface UserAddress {
  id: string
  user_id: string
  label: string
  full_name: string
  phone: string
  address: string
  city: string
  state: string | null
  postal_code: string | null
  country: string
  is_default_shipping: boolean
  is_default_billing: boolean
  created_at: string
  updated_at: string
}

export async function listUserAddresses(userId: string): Promise<UserAddress[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('user_addresses')
    .select('id, user_id, label, full_name, phone, address, city, state, postal_code, country, is_default_shipping, is_default_billing, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('listUserAddresses error', error)
    return []
  }
  return data || []
}

export async function getMyAddresses(): Promise<UserAddress[]> {
  'use server'
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return []
  return await listUserAddresses(user.id)
}

export async function setDefaultAddress(userId: string, id: string, opts: { shipping?: boolean; billing?: boolean }) {
  const supabase = getSupabaseAdmin()
  const updates: any = {}
  if (opts.shipping) updates.is_default_shipping = true
  if (opts.billing) updates.is_default_billing = true
  const { error } = await supabase
    .from('user_addresses')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) {
    console.error('setDefaultAddress error', error)
    return { success: false, error: 'Varsayılan adres atanamadı' }
  }
  revalidatePath('/profile')
  return { success: true }
}

export async function createUserAddress(userId: string, payload: Omit<UserAddress, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('user_addresses')
    .insert({ ...payload, user_id: userId })
  if (error) {
    console.error('createUserAddress error', error)
    return { success: false, error: 'Adres eklenemedi' }
  }
  revalidatePath('/profile')
  return { success: true }
}

export async function updateUserAddress(userId: string, id: string, updates: Partial<Omit<UserAddress, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('user_addresses')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) {
    console.error('updateUserAddress error', error)
    return { success: false, error: 'Adres güncellenemedi' }
  }
  revalidatePath('/profile')
  return { success: true }
}

export async function deleteUserAddress(userId: string, id: string) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) {
    console.error('deleteUserAddress error', error)
    return { success: false, error: 'Adres silinemedi' }
  }
  revalidatePath('/profile')
  return { success: true }
}

export async function updateUserProfile(
  userId: string, 
  profileData: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('users')
      .update({
        ...profileData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Profile güncelleme hatası:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Profile güncelleme hatası:', error)
    return { success: false, error: 'Beklenmeyen bir hata oluştu' }
  }
}

export async function getUserOrders(userId: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          product:products (
            id,
            name,
            slug,
            price,
            product_images (url, alt)
          )
        )
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Siparişler getirme hatası:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Siparişler getirme hatası:', error)
    return []
  }
}

export async function getUserMessages(userId: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        order:orders (id, orderNumber)
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Mesajlar getirme hatası:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Mesajlar getirme hatası:', error)
    return []
  }
}

export async function linkMyMessagesByEmail() {
  'use server'
  try {
    const server = await createServerClient()
    const { data: auth } = await server.auth.getUser()
    const user = auth.user
    if (!user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' }
    }
    const admin = getSupabaseAdmin()
    const email = user.email
    if (!email) {
      return { success: false, error: 'E-posta bulunamadı' }
    }
    const { error } = await admin
      .from('messages')
      .update({ userId: user.id })
      .is('userId', null)
      .eq('email', email)

    if (error) {
      console.error('linkMyMessagesByEmail error', error)
      return { success: false, error: 'Eşleştirme sırasında hata oluştu' }
    }
    revalidatePath('/profile')
    return { success: true }
  } catch (e) {
    console.error('linkMyMessagesByEmail exception', e)
    return { success: false, error: 'Beklenmeyen bir hata oluştu' }
  }
}

export async function getOrderStats(userId: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('orders')
      .select('status, totalAmount')
      .eq('userId', userId)

    if (error) {
      console.error('Sipariş istatistikleri hatası:', error)
      return {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        completedOrders: 0
      }
    }

    const stats = {
      totalOrders: data.length,
      totalSpent: data.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      pendingOrders: data.filter(order => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)).length,
      completedOrders: data.filter(order => order.status === 'DELIVERED').length
    }

    return stats
  } catch (error) {
    console.error('Sipariş istatistikleri hatası:', error)
    return {
      totalOrders: 0,
      totalSpent: 0,
      pendingOrders: 0,
      completedOrders: 0
    }
  }
}
