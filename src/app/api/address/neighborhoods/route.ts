import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const districtId = url.searchParams.get('districtId')
    if (!districtId) {
      return NextResponse.json({ error: 'districtId is required' }, { status: 400 })
    }

    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('id, name, postal_code')
      .eq('district_id', Number(districtId))
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ neighborhoods: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


