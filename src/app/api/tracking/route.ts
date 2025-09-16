import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Simple tracking proxy: GET /api/tracking?trackingNumber=XXXX
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const trackingNumber = searchParams.get('trackingNumber')
    if (!trackingNumber) {
      return NextResponse.json({ error: 'trackingNumber required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, carrier, tracking_number, tracking_url, status')
      .eq('tracking_number', trackingNumber)
      .maybeSingle()

    if (error) {
      logger.error('tracking.lookup error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    // For now, just echo saved info. Later we can live-hit carrier API here.
    return NextResponse.json({
      orderId: order.id,
      carrier: order.carrier,
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url,
      status: order.status,
    })
  } catch (err: any) {
    logger.error('tracking.lookup fatal', err)
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


