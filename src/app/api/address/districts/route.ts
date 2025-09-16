import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const cityId = url.searchParams.get('cityId')
    if (!cityId) {
      return NextResponse.json({ error: 'cityId is required' }, { status: 400 })
    }

    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('districts')
      .select('id, name')
      .eq('city_id', Number(cityId))
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ districts: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


