'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Types for the label template system
export interface LabelCategory {
  id: string
  name: string
  slug: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface LabelSize {
  id: string
  category_id: string
  name: string
  value: string
  width_mm?: number
  height_mm?: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface LabelTemplate {
  id: string
  size_id: string
  title: string
  description?: string
  image_url: string
  thumbnail_url?: string
  tags?: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface LabelCategoryWithSizes extends LabelCategory {
  label_sizes: (LabelSize & { label_templates: LabelTemplate[] })[]
}

// CATEGORY ACTIONS

export async function createLabelCategory(data: {
  name: string
  slug: string
  description?: string
  sort_order?: number
}) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: category, error } = await supabase
      .from('label_categories')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description,
        sort_order: data.sort_order || 0,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating label category:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true, data: category }
  } catch (error) {
    console.error('Error creating label category:', error)
    return { success: false, error: 'Kategori oluşturulurken hata oluştu' }
  }
}

export async function updateLabelCategory(id: string, data: {
  name?: string
  slug?: string
  description?: string
  is_active?: boolean
  sort_order?: number
}) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: category, error } = await supabase
      .from('label_categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating label category:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true, data: category }
  } catch (error) {
    console.error('Error updating label category:', error)
    return { success: false, error: 'Kategori güncellenirken hata oluştu' }
  }
}

export async function deleteLabelCategory(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('label_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting label category:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true }
  } catch (error) {
    console.error('Error deleting label category:', error)
    return { success: false, error: 'Kategori silinirken hata oluştu' }
  }
}

export async function getLabelCategories() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: categories, error } = await supabase
      .from('label_categories')
      .select(`
        *,
        label_sizes (
          *,
          label_templates (*)
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching label categories:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: categories as LabelCategoryWithSizes[] }
  } catch (error) {
    console.error('Error fetching label categories:', error)
    return { success: false, error: 'Kategoriler alınırken hata oluştu', data: [] }
  }
}

// SIZE ACTIONS

export async function createLabelSize(data: {
  category_id: string
  name: string
  value: string
  width_mm?: number
  height_mm?: number
  sort_order?: number
}) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: size, error } = await supabase
      .from('label_sizes')
      .insert({
        category_id: data.category_id,
        name: data.name,
        value: data.value,
        width_mm: data.width_mm,
        height_mm: data.height_mm,
        sort_order: data.sort_order || 0,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating label size:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true, data: size }
  } catch (error) {
    console.error('Error creating label size:', error)
    return { success: false, error: 'Boyut oluşturulurken hata oluştu' }
  }
}

export async function updateLabelSize(id: string, data: {
  name?: string
  value?: string
  width_mm?: number
  height_mm?: number
  is_active?: boolean
  sort_order?: number
}) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: size, error } = await supabase
      .from('label_sizes')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating label size:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true, data: size }
  } catch (error) {
    console.error('Error updating label size:', error)
    return { success: false, error: 'Boyut güncellenirken hata oluştu' }
  }
}

export async function deleteLabelSize(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('label_sizes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting label size:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true }
  } catch (error) {
    console.error('Error deleting label size:', error)
    return { success: false, error: 'Boyut silinirken hata oluştu' }
  }
}

export async function getLabelSizesByCategory(categoryId: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: sizes, error } = await supabase
      .from('label_sizes')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching label sizes:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: sizes as LabelSize[] }
  } catch (error) {
    console.error('Error fetching label sizes:', error)
    return { success: false, error: 'Boyutlar alınırken hata oluştu', data: [] }
  }
}

// TEMPLATE ACTIONS

export async function createLabelTemplate(data: {
  size_id: string
  title: string
  description?: string
  image_url: string
  thumbnail_url?: string
  tags?: string[]
  sort_order?: number
}) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: template, error } = await supabase
      .from('label_templates')
      .insert({
        size_id: data.size_id,
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        thumbnail_url: data.thumbnail_url,
        tags: data.tags,
        sort_order: data.sort_order || 0,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating label template:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true, data: template }
  } catch (error) {
    console.error('Error creating label template:', error)
    return { success: false, error: 'Şablon oluşturulurken hata oluştu' }
  }
}

export async function updateLabelTemplate(id: string, data: {
  title?: string
  description?: string
  image_url?: string
  thumbnail_url?: string
  tags?: string[]
  is_active?: boolean
  sort_order?: number
}) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: template, error } = await supabase
      .from('label_templates')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating label template:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true, data: template }
  } catch (error) {
    console.error('Error updating label template:', error)
    return { success: false, error: 'Şablon güncellenirken hata oluştu' }
  }
}

export async function deleteLabelTemplate(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('label_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting label template:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true }
  } catch (error) {
    console.error('Error deleting label template:', error)
    return { success: false, error: 'Şablon silinirken hata oluştu' }
  }
}

export async function getLabelTemplatesBySize(sizeId: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: templates, error } = await supabase
      .from('label_templates')
      .select('*')
      .eq('size_id', sizeId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching label templates:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: templates as LabelTemplate[] }
  } catch (error) {
    console.error('Error fetching label templates:', error)
    return { success: false, error: 'Şablonlar alınırken hata oluştu', data: [] }
  }
}

// BULK OPERATIONS

export async function createMultipleLabelTemplates(templates: {
  size_id: string
  title: string
  description?: string
  image_url: string
  thumbnail_url?: string
  tags?: string[]
  sort_order?: number
}[]) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('label_templates')
      .insert(templates.map((template, index) => ({
        ...template,
        sort_order: template.sort_order || index,
        is_active: true
      })))
      .select()

    if (error) {
      console.error('Error creating multiple label templates:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/label-templates')
    return { success: true, data }
  } catch (error) {
    console.error('Error creating multiple label templates:', error)
    return { success: false, error: 'Şablonlar oluşturulurken hata oluştu' }
  }
}

// HELPER FUNCTIONS

// Moved to client-safe util at '@/lib/utils/slug'
