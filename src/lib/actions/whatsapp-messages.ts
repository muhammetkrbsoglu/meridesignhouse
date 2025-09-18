'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface WhatsAppMessage {
  id: string
  customer_name: string
  product_id: string
  screenshot_url: string
  alt_text: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export async function getWhatsAppMessages(): Promise<WhatsAppMessage[]> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('WhatsApp mesajları getirme hatası:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('WhatsApp mesajları getirme hatası:', error)
    return []
  }
}

export async function getAllWhatsAppMessages(): Promise<WhatsAppMessage[]> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Tüm WhatsApp mesajları getirme hatası:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Tüm WhatsApp mesajları getirme hatası:', error)
    return []
  }
}

export async function createWhatsAppMessage(formData: FormData) {
  try {
    const supabase = getSupabaseAdmin()
    
    const customer_name = formData.get('customer_name') as string
    const product_id = formData.get('product_id') as string
    const screenshot_url = formData.get('screenshot_url') as string
    const alt_text = formData.get('alt_text') as string
    const display_order = parseInt(formData.get('display_order') as string) || 0

    if (!customer_name || !product_id || !screenshot_url || !alt_text) {
      return { success: false, error: 'Tüm alanlar zorunludur' }
    }

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert({
        customer_name,
        product_id,
        screenshot_url,
        alt_text,
        display_order
      })
      .select()
      .single()

    if (error) {
      console.error('WhatsApp mesajı oluşturma hatası:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/settings/whatsapp-messages')
    revalidatePath('/')
    
    return { success: true, data }
  } catch (error) {
    console.error('WhatsApp mesajı oluşturma hatası:', error)
    return { success: false, error: 'Beklenmeyen bir hata oluştu' }
  }
}

export async function updateWhatsAppMessage(id: string, formData: FormData) {
  try {
    const supabase = getSupabaseAdmin()
    
    const customer_name = formData.get('customer_name') as string
    const product_id = formData.get('product_id') as string
    const screenshot_url = formData.get('screenshot_url') as string
    const alt_text = formData.get('alt_text') as string
    const is_active = formData.get('is_active') === 'on'
    const display_order = parseInt(formData.get('display_order') as string) || 0

    if (!customer_name || !product_id || !screenshot_url || !alt_text) {
      return { success: false, error: 'Tüm alanlar zorunludur' }
    }

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .update({
        customer_name,
        product_id,
        screenshot_url,
        alt_text,
        is_active,
        display_order
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('WhatsApp mesajı güncelleme hatası:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/settings/whatsapp-messages')
    revalidatePath('/')
    
    return { success: true, data }
  } catch (error) {
    console.error('WhatsApp mesajı güncelleme hatası:', error)
    return { success: false, error: 'Beklenmeyen bir hata oluştu' }
  }
}

export async function deleteWhatsAppMessage(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('whatsapp_messages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('WhatsApp mesajı silme hatası:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/settings/whatsapp-messages')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('WhatsApp mesajı silme hatası:', error)
    return { success: false, error: 'Beklenmeyen bir hata oluştu' }
  }
}

export async function toggleWhatsAppMessageStatus(id: string, is_active: boolean) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ is_active })
      .eq('id', id)

    if (error) {
      console.error('WhatsApp mesajı durumu güncelleme hatası:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/settings/whatsapp-messages')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('WhatsApp mesajı durumu güncelleme hatası:', error)
    return { success: false, error: 'Beklenmeyen bir hata oluştu' }
  }
}

