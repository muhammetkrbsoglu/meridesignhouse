'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'

export async function createShipmentAction(formData: FormData) {
  const orderId = String(formData.get('orderId') || '')
  if (!orderId) return { ok: false, error: 'orderId required' }

  if (config.shipping.estimateOnly) {
    return { ok: false, error: 'estimate_only' }
  }

  const supabase = getSupabaseAdmin()
  // Load order
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, shipment_id, tracking_number, status')
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    logger.error('createShipmentAction load error', error)
    return { ok: false, error: error.message }
  }

  if (!order) return { ok: false, error: 'not_found' }

  // Idempotency guard
  if (order.shipment_id) {
    return { ok: true, message: 'already_created', shipmentId: order.shipment_id }
  }

  // Placeholder: call carrier API here
  const mockShipmentId = `mock_${orderId}`
  const mockTrackingNumber = `TRK-${orderId.slice(0, 8).toUpperCase()}`

  const { error: updErr } = await supabase
    .from('orders')
    .update({
      shipment_id: mockShipmentId,
      tracking_number: mockTrackingNumber,
      status: 'SHIPPED',
    })
    .eq('id', orderId)

  if (updErr) {
    logger.error('createShipmentAction update error', updErr)
    return { ok: false, error: updErr.message }
  }

  await supabase.from('order_timeline_events').insert({
    order_id: orderId,
    event_type: 'shipment_created',
    message: `Gönderi oluşturuldu (mock). Takip No: ${mockTrackingNumber}`,
  })

  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true, shipmentId: mockShipmentId, trackingNumber: mockTrackingNumber }
}



