'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { formatPhoneForWhatsApp, isValidTurkishPhone } from '@/lib/whatsapp-utils'

export async function getOrderPublic(trackingCode: string, phone: string) {
  try {
    if (!trackingCode || !phone) {
      return { success: false, error: 'Takip kodu ve telefon zorunludur' }
    }

    const supabase = getSupabaseAdmin()

    const normalizedPhone = formatPhoneForWhatsApp(phone)
    if (!isValidTurkishPhone(normalizedPhone)) {
      return { success: false, error: 'Geçerli bir telefon numarası girin' }
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, orderNumber, status, total, shippingAddress')
      .eq('orderNumber', trackingCode)
      .single()

    if (error || !order) {
      return { success: false, error: 'Sipariş bulunamadı' }
    }

    // Match by phone in shippingAddress
    const orderPhone = (order as any).shippingAddress?.phone
    const normalizedOrderPhone = orderPhone ? formatPhoneForWhatsApp(orderPhone) : ''
    if (!normalizedOrderPhone || normalizedOrderPhone !== normalizedPhone) {
      return { success: false, error: 'Bilgiler uyuşmuyor' }
    }

    return { success: true, order }
  } catch (e) {
    console.error('getOrderPublic error', e)
    return { success: false, error: 'Bir hata oluştu' }
  }
}


