import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// IMPORTANT: Do not export a browser client from this module. It is imported by client components.

// For server-side usage (client-side compatible)
export const createClient = () => {
  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1]
      },
      set(name: string, value: string, options: any) {
        document.cookie = `${name}=${value}; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`
      },
      remove(name: string, options: any) {
        document.cookie = `${name}=; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}; max-age=0`
      }
    }
  })
}

// For server-side usage with service role key (bypasses RLS)
export const createServerClient = async () => {
  const cookieStore: any = await (cookies as any)()
  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 })
      }
    }
  })
}

// Admin client with service role key (lazy loaded)
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('Service Role Key exists:', !!serviceRoleKey)
    console.log('Service Role Key length:', serviceRoleKey?.length || 0)
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
    }
    
    _supabaseAdmin = createSupabaseClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return _supabaseAdmin
}

// Anon client for public operations (no cookies needed)
export const createAnonClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          role: 'ADMIN' | 'CUSTOMER'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          phone?: string | null
          role?: 'ADMIN' | 'CUSTOMER'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          role?: 'ADMIN' | 'CUSTOMER'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image: string | null
          parent_id: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          compare_price: number | null
          cost_price: number | null
          sku: string | null
          barcode: string | null
          track_quantity: boolean
          quantity: number
          weight: number | null
          image: string | null
          gallery: string[] | null
          category_id: string | null
          is_active: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_product_of_week: boolean
          product_of_week_category_id: string | null
          old_price: number | null
          meta_title: string | null
          meta_description: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price: number
          compare_price?: number | null
          cost_price?: number | null
          sku?: string | null
          barcode?: string | null
          track_quantity?: boolean
          quantity?: number
          weight?: number | null
          image_url?: string | null
          gallery?: string[] | null
          category_id?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_product_of_week?: boolean
          product_of_week_category_id?: string | null
          old_price?: number | null
          meta_title?: string | null
          meta_description?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price?: number
          compare_price?: number | null
          cost_price?: number | null
          sku?: string | null
          barcode?: string | null
          track_quantity?: boolean
          quantity?: number
          weight?: number | null
          image_url?: string | null
          gallery?: string[] | null
          category_id?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_product_of_week?: boolean
          product_of_week_category_id?: string | null
          old_price?: number | null
          meta_title?: string | null
          meta_description?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
          total: number
          subtotal: number
          tax: number
          shipping: number
          shipping_address: Record<string, unknown>
          billing_address: Record<string, unknown> | null
          payment_method: string
          payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
          tracking_number: string | null
          estimated_delivery: string | null
          notes: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          user_id: string
          status?: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
          total: number
          subtotal: number
          tax?: number
          shipping?: number
          shipping_address: Record<string, unknown>
          billing_address?: Record<string, unknown> | null
          payment_method: string
          payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
          tracking_number?: string | null
          estimated_delivery?: string | null
          notes?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          status?: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
          total?: number
          subtotal?: number
          tax?: number
          shipping?: number
          shipping_address?: Record<string, unknown>
          billing_address?: Record<string, unknown> | null
          payment_method?: string
          payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
          tracking_number?: string | null
          estimated_delivery?: string | null
          notes?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string | null
          order_id: string | null
          type: 'CONTACT' | 'ORDER_INQUIRY' | 'SUPPORT'
          name: string
          email: string
          phone: string | null
          subject: string
          message: string
          status: 'UNREAD' | 'READ' | 'REPLIED' | 'CLOSED'
          admin_reply: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_id?: string | null
          type?: 'CONTACT' | 'ORDER_INQUIRY' | 'SUPPORT'
          name: string
          email: string
          phone?: string | null
          subject: string
          message: string
          status?: 'UNREAD' | 'READ' | 'REPLIED' | 'CLOSED'
          admin_reply?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_id?: string | null
          type?: 'CONTACT' | 'ORDER_INQUIRY' | 'SUPPORT'
          name?: string
          email?: string
          phone?: string | null
          subject?: string
          message?: string
          status?: 'UNREAD' | 'READ' | 'REPLIED' | 'CLOSED'
          admin_reply?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ,
      user_addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          full_name: string
          phone: string
          address: string
          city: string
          state: string | null
          postal_code: string | null
          country: string
          is_default_shipping: boolean
          is_default_billing: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          full_name: string
          phone: string
          address: string
          city: string
          state?: string | null
          postal_code?: string | null
          country?: string
          is_default_shipping?: boolean
          is_default_billing?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          full_name?: string
          phone?: string
          address?: string
          city?: string
          state?: string | null
          postal_code?: string | null
          country?: string
          is_default_shipping?: boolean
          is_default_billing?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_types: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      theme_styles: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color_palette: string[] | null
          image: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color_palette?: string[] | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color_palette?: string[] | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_theme_assignments: {
        Row: {
          id: string
          event_type_id: string
          theme_style_id: string
          product_id: string
          is_featured: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          event_type_id: string
          theme_style_id: string
          product_id: string
          is_featured?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          event_type_id?: string
          theme_style_id?: string
          product_id?: string
          is_featured?: boolean
          sort_order?: number
          created_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']