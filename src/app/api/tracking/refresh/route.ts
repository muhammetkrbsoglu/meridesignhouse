import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!config.shipping.enablePolling) {
      return NextResponse.json({ error: 'polling disabled' }, { status: 503 })
    }
    const cronKey = config.cronSecret
    const headerKey = req.headers.get('x-cron-key')
    if (!cronKey || headerKey !== cronKey) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Fetch recent orders that have tracking numbers
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, tracking_number, status, updated_at')
      .not('tracking_number', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      logger.error('tracking.refresh query error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let inserted = 0
    if (orders && orders.length) {
      for (const ord of orders as any[]) {
        // Placeholder: here we would call carrier APIs, map to status, and write meaningful events
        const { error: insErr } = await supabase
          .from('order_timeline_events')
          .insert({
            order_id: ord.id,
            event_type: 'poll',
          })

        if (insErr) {
          logger.warn('timeline insert failed', { orderId: ord.id, error: insErr.message })
        } else {
          inserted += 1
        }
      }
    }

    return NextResponse.json({ checked: orders?.length || 0, timelineInserted: inserted })
  } catch (err: any) {
    logger.error('tracking.refresh fatal', err)
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}



