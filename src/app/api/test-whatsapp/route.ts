import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(_request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    // Test verisi ekle
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert([
        {
          customer_name: 'Büşra Hanım',
          product_id: 'test-product-1',
          screenshot_url: 'https://via.placeholder.com/300x600/25D366/FFFFFF?text=WhatsApp+Message+1',
          alt_text: 'WhatsApp ekran görüntüsü 1',
          is_active: true,
          display_order: 1
        },
        {
          customer_name: 'Ayşe Hanım',
          product_id: 'test-product-2',
          screenshot_url: 'https://via.placeholder.com/300x600/25D366/FFFFFF?text=WhatsApp+Message+2',
          alt_text: 'WhatsApp ekran görüntüsü 2',
          is_active: true,
          display_order: 2
        }
      ])
      .select()

    if (error) {
      console.error('Test data insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test data inserted successfully',
      data 
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

