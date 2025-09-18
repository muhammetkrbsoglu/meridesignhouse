'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface Color {
  id: string
  name: string
  slug: string
  hex: string
  is_active: boolean
}

const defaultColors: Array<{ name: string; slug: string; hex: string; is_active: boolean }> = [
  { name: 'Açık Kırmızı', slug: 'acik-kirmizi', hex: '#FF6B6B', is_active: true },
  { name: 'Kırmızı', slug: 'kirmizi', hex: '#FF0000', is_active: true },
  { name: 'Koyu Kırmızı', slug: 'koyu-kirmizi', hex: '#8B0000', is_active: true },
  { name: 'Açık Turuncu', slug: 'acik-turuncu', hex: '#FFB066', is_active: true },
  { name: 'Turuncu', slug: 'turuncu', hex: '#FFA500', is_active: true },
  { name: 'Koyu Turuncu', slug: 'koyu-turuncu', hex: '#CC7000', is_active: true },
  { name: 'Açık Sarı', slug: 'acik-sari', hex: '#FFF59D', is_active: true },
  { name: 'Sarı', slug: 'sari', hex: '#FFFF00', is_active: true },
  { name: 'Hardal Sarı', slug: 'hardal-sari', hex: '#D4AF37', is_active: true },
  { name: 'Açık Yeşil', slug: 'acik-yesil', hex: '#90EE90', is_active: true },
  { name: 'Yeşil', slug: 'yesil', hex: '#00A651', is_active: true },
  { name: 'Koyu Yeşil', slug: 'koyu-yesil', hex: '#006400', is_active: true },
  { name: 'Açık Mavi', slug: 'acik-mavi', hex: '#87CEFA', is_active: true },
  { name: 'Mavi', slug: 'mavi', hex: '#1E90FF', is_active: true },
  { name: 'Koyu Mavi', slug: 'koyu-mavi', hex: '#00008B', is_active: true },
  { name: 'Açık Mor', slug: 'acik-mor', hex: '#C3A6FF', is_active: true },
  { name: 'Mor', slug: 'mor', hex: '#800080', is_active: true },
  { name: 'Koyu Mor', slug: 'koyu-mor', hex: '#4B0082', is_active: true },
  { name: 'Açık Pembe', slug: 'acik-pembe', hex: '#FFC0CB', is_active: true },
  { name: 'Pembe', slug: 'pembe', hex: '#FF69B4', is_active: true },
  { name: 'Koyu Pembe', slug: 'koyu-pembe', hex: '#C2185B', is_active: true },
  { name: 'Açık Kahverengi', slug: 'acik-kahverengi', hex: '#D2B48C', is_active: true },
  { name: 'Kahverengi', slug: 'kahverengi', hex: '#8B4513', is_active: true },
  { name: 'Koyu Kahverengi', slug: 'koyu-kahverengi', hex: '#5D3A1A', is_active: true },
  { name: 'Açık Gri', slug: 'acik-gri', hex: '#D3D3D3', is_active: true },
  { name: 'Gri', slug: 'gri', hex: '#808080', is_active: true },
  { name: 'Koyu Gri', slug: 'koyu-gri', hex: '#4F4F4F', is_active: true },
  { name: 'Siyah', slug: 'siyah', hex: '#000000', is_active: true },
  { name: 'Beyaz', slug: 'beyaz', hex: '#FFFFFF', is_active: true },
]

export async function seedColorsIfEmpty() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('colors')
    .select('id')
    .limit(1)
  if (error) return { success: false }
  if (data && data.length > 0) return { success: true }
  const { error: insertError } = await supabase.from('colors').insert(defaultColors)
  if (insertError) return { success: false }
  return { success: true }
}

export async function listActiveColors(): Promise<Color[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    // Table yoksa veya yetki hatası varsa sessizce boş dön
    return []
  }
  return (data as Color[]) || []
}

export async function listAllColors(): Promise<Color[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return []
  }
  return (data as Color[]) || []
}

export async function upsertColor(color: Partial<Color> & { name: string; hex: string; slug: string; is_active?: boolean }) {
  const supabase = getSupabaseAdmin()
  const payload = {
    id: color.id || undefined,
    name: color.name,
    slug: color.slug,
    hex: color.hex,
    is_active: color.is_active ?? true,
  }
  const { error } = await supabase.from('colors').upsert(payload, { onConflict: 'id' })
  if (error) {
    console.error('Color upsert error:', error)
    return { success: false, error: 'Renk kaydedilemedi' }
  }
  revalidatePath('/admin/settings/colors')
  return { success: true }
}

export async function deleteColor(id: string) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('colors').delete().eq('id', id)
  if (error) {
    console.error('Color delete error:', error)
    return { success: false, error: 'Renk silinemedi' }
  }
  revalidatePath('/admin/settings/colors')
  return { success: true }
}

export async function setColorActive(id: string, isActive: boolean) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('colors').update({ is_active: isActive }).eq('id', id)
  if (error) {
    console.error('Color update error:', error)
    return { success: false, error: 'Renk güncellenemedi' }
  }
  revalidatePath('/admin/settings/colors')
  return { success: true }
}



