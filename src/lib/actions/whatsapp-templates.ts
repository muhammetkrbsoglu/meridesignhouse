'use server'

import { getSupabaseAdmin } from '@/lib/supabase'

export async function listWhatsAppTemplates(context?: 'ORDER'|'MESSAGE'|'BOTH') {
  const supabase = getSupabaseAdmin()
  let q = supabase.from('whatsapp_templates').select('*').eq('is_active', true)
  if (context && context !== 'BOTH') {
    // BOTH veya eşleşen context
    q = q.in('context', ['BOTH', context] as any)
  }
  const { data, error } = await q.order('updated_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function upsertWhatsAppTemplate(formData: FormData) {
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '')
  const context = String(formData.get('context') || 'BOTH') as 'ORDER'|'MESSAGE'|'BOTH'
  const content = String(formData.get('content') || '')
  const is_active = String(formData.get('is_active') || 'true') === 'true'

  if (!name || !content) {
    return { success: false, error: 'Ad ve içerik zorunludur' }
  }

  const supabase = getSupabaseAdmin()
  if (id) {
    const { error } = await supabase.from('whatsapp_templates').update({ name, context, content, is_active }).eq('id', id)
    if (error) return { success: false, error: 'Güncelleme başarısız' }
    return { success: true }
  } else {
    const { error } = await supabase.from('whatsapp_templates').insert({ name, context, content, is_active })
    if (error) return { success: false, error: 'Ekleme başarısız' }
    return { success: true }
  }
}

export async function upsertWhatsAppTemplateDirect(payload: {
  id?: string
  name: string
  context: 'ORDER'|'MESSAGE'|'BOTH'
  content: string
  is_active: boolean
}) {
  const supabase = getSupabaseAdmin()
  if (payload.id) {
    const { error } = await supabase.from('whatsapp_templates').update({
      name: payload.name,
      context: payload.context,
      content: payload.content,
      is_active: payload.is_active,
    }).eq('id', payload.id)
    if (error) return { success: false }
    return { success: true }
  } else {
    const { error } = await supabase.from('whatsapp_templates').insert({
      name: payload.name,
      context: payload.context,
      content: payload.content,
      is_active: payload.is_active,
    })
    if (error) return { success: false }
    return { success: true }
  }
}

export async function seedWhatsAppTemplatesIfEmpty(defaults: Array<{
  name: string
  context: 'ORDER'|'MESSAGE'|'BOTH'
  is_active: boolean
  content: string
}>) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('whatsapp_templates').select('id').limit(1)
  if (error) return { success: false }
  if ((data?.length || 0) > 0) return { success: true, seeded: false }
  const { error: insErr } = await supabase.from('whatsapp_templates').insert(defaults as any)
  if (insErr) return { success: false }
  return { success: true, seeded: true }
}



