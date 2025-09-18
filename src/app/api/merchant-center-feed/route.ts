import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data: products } = await supabase
    .from('products')
    .select('id,name,slug,description,price,isActive,product_images(url)')
    .eq('isActive', true)
    .limit(1000)

  const items = (products || []).map((p: any) => ({
    id: p.id,
    title: p.name,
    description: p.description || p.name,
    link: `https://meridesignhouse.com/products/${p.slug}`,
    image_link: p.product_images?.[0]?.url || null,
    availability: 'in_stock',
    price: `${Number(p.price).toFixed(2)} TRY`,
    // GTIN/MPN/SKU alanları domain sahibi sağladığında eklenecek
  }))

  return NextResponse.json({ items })
}



