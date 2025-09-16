'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export interface BundleItem {
  id: string
  productId: string
  quantity: number
  sortOrder: number
  product?: {
    id: string
    name: string
    slug: string
    price: number
    images: { url: string; alt?: string | null; sortOrder?: number }[]
  }
}

export interface Bundle {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  eventTypeId: string
  themeStyleId: string
  categoryId: string
  bundlePrice: number | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  items: BundleItem[]
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

// Fetch bundles by category
export async function fetchBundlesByCategory(categoryId: string): Promise<Bundle[]> {
  const supabase = getSupabaseAdmin()
  const db = supabase as any

  try {
    const { data: bundles, error } = await db
      .from('bundles')
      .select(`
        id,
        name,
        slug,
        description,
        image,
        eventtypeid,
        themestyleid,
        categoryid,
        bundleprice,
        isactive,
        sortorder,
        createdat,
        updatedat,
        items: bundle_items (
          id,
          productid,
          quantity,
          sortorder,
          product: products (
            id,
            name,
            slug,
            price,
            images: product_images (
              url,
              alt,
              sortOrder
            )
          )
        )
      `)
      .eq('isactive', true)
      .eq('categoryid', categoryId)
      .order('sortorder', { ascending: true })

    if (error) {
      console.error('Error fetching bundles by category:', error)
      return []
    }

    // Map the data to match the expected interface
    return (bundles || []).map((bundle: any) => ({
      id: bundle.id,
      name: bundle.name,
      slug: bundle.slug,
      description: bundle.description,
      image: bundle.image,
      eventTypeId: bundle.eventtypeid,
      themeStyleId: bundle.themestyleid,
      categoryId: bundle.categoryid,
      bundlePrice: bundle.bundleprice,
      isActive: bundle.isactive,
      sortOrder: bundle.sortorder,
      createdAt: bundle.createdat,
      updatedAt: bundle.updatedat,
      items: (bundle.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productid,
        quantity: item.quantity,
        sortOrder: item.sortorder,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          images: (item.product.images || []).map((img: any) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder
          }))
        } : null
      }))
    }))
  } catch (error) {
    console.error('Error in fetchBundlesByCategory:', error)
    return []
  }
}

// Fetch all active bundles
export async function fetchAllActiveBundles(): Promise<Bundle[]> {
  const supabase = getSupabaseAdmin()
  const db = supabase as any

  try {
    const { data: bundles, error } = await db
      .from('bundles')
      .select(`
        id,
        name,
        slug,
        description,
        image,
        eventtypeid,
        themestyleid,
        categoryid,
        bundleprice,
        isactive,
        sortorder,
        createdat,
        updatedat,
        items: bundle_items (
          id,
          productid,
          quantity,
          sortorder,
          product: products (
            id,
            name,
            slug,
            price,
            images: product_images (
              url,
              alt,
              sortOrder
            )
          )
        )
      `)
      .eq('isactive', true)
      .order('sortorder', { ascending: true })

    if (error) {
      console.error('Error fetching active bundles:', error)
      return []
    }

    // Map the data to match the expected interface
    return (bundles || []).map((bundle: any) => ({
      id: bundle.id,
      name: bundle.name,
      slug: bundle.slug,
      description: bundle.description,
      image: bundle.image,
      eventTypeId: bundle.eventtypeid,
      themeStyleId: bundle.themestyleid,
      categoryId: bundle.categoryid,
      bundlePrice: bundle.bundleprice,
      isActive: bundle.isactive,
      sortOrder: bundle.sortorder,
      createdAt: bundle.createdat,
      updatedAt: bundle.updatedat,
      items: (bundle.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productid,
        quantity: item.quantity,
        sortOrder: item.sortorder,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          images: (item.product.images || []).map((img: any) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder
          }))
        } : null
      }))
    }))
  } catch (error) {
    console.error('Error in fetchAllActiveBundles:', error)
    return []
  }
}

// Fetch active bundles for a given event + theme
export async function fetchBundlesByEventTheme(eventTypeId: string, themeStyleId: string): Promise<Bundle[]> {
  const supabase = getSupabaseAdmin()
  const db = supabase as any

  // Get bundles
  const { data: bundles, error } = await db
    .from('bundles')
    .select(`
      id,
      name,
      slug,
      description,
      image,
      eventtypeid,
      themestyleid,
      categoryid,
      bundleprice,
      isactive,
      sortorder,
      createdat,
      updatedat
    `)
    .eq('isactive', true)
    .eq('eventtypeid', eventTypeId)
    .eq('themestyleid', themeStyleId)
    .order('sortorder', { ascending: true })

  if (error) {
    console.error('Supabase error (bundles):', error)
    return []
  }

  const bundleIds = (bundles || []).map((b: any) => b.id)
  if (bundleIds.length === 0) return []

  // Get items for those bundles
  const { data: items, error: itemsError } = await db
    .from('bundle_items')
    .select('*')
    .in('bundleid', bundleIds)
    .order('sortorder', { ascending: true })

  if (itemsError) {
    console.error('Supabase error (bundle_items):', itemsError)
    return []
  }

  // Fetch minimal product info for items
  const productIds = Array.from(new Set((items || []).map((i: any) => i.productid)))
  let productsMap: Record<string, any> = {}
  if (productIds.length > 0) {
    const { data: products, error: pErr } = await db
      .from('products')
      .select(`id, name, slug, price, product_images(url, alt, sortOrder)`) // minimal needed
      .in('id', productIds)
    if (pErr) {
      console.error('Supabase error (products for bundle items):', pErr)
    } else {
      productsMap = Object.fromEntries((products || []).map((p: any) => [p.id, p]))
    }
  }

  const grouped: Record<string, any> = {}
  for (const b of bundles || []) grouped[b.id] = { ...b, items: [] }
  for (const item of (items || [])) {
    const product = productsMap[item.productid]
    grouped[item.bundleid].items.push({
      id: item.id,
      productId: item.productid,
      quantity: item.quantity,
      sortOrder: item.sortorder,
      product: product
        ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: typeof product.price === 'object' ? parseFloat(product.price.toString()) : product.price,
            images: product.product_images || []
          }
        : undefined
    })
  }

  return Object.values(grouped).map((b: any) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description || null,
    image: b.image || null,
    eventTypeId: b.eventtypeid,
    themeStyleId: b.themestyleid,
    categoryId: b.categoryid,
    bundlePrice: b.bundleprice != null ? Number(b.bundleprice) : null,
    isActive: b.isactive,
    sortOrder: b.sortorder,
    createdAt: b.createdat,
    updatedAt: b.updatedat,
    items: b.items
  }))
}


export interface UpsertBundleInputItem {
  productId: string
  quantity: number
  sortOrder?: number
}

export interface UpsertBundleInput {
  name: string
  description?: string | null
  image?: string | null
  eventTypeId: string
  themeStyleId: string
  categoryId: string
  bundlePrice?: number | null
  isActive: boolean
  sortOrder?: number
  items: UpsertBundleInputItem[]
}

export async function createBundle(input: UpsertBundleInput): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = getSupabaseAdmin() as any
  const id = randomUUID()
  const now = new Date().toISOString()
  const slug = generateSlug(input.name)

  const { error } = await supabase.from('bundles').insert({
    id,
    name: input.name,
    slug,
    description: input.description ?? null,
    image: input.image ?? null,
    eventtypeid: input.eventTypeId,
    themestyleid: input.themeStyleId,
    categoryid: input.categoryId,
    bundleprice: input.bundlePrice ?? null,
    isactive: input.isActive,
    sortorder: input.sortOrder ?? 0,
    createdat: now,
    updatedat: now,
  })

  if (error) {
    console.error('createBundle error:', error)
    return { success: false, error: error.message }
  }

  if (input.items?.length) {
    const itemsToInsert = input.items.map((it, idx) => ({
      id: randomUUID(),
      bundleid: id,
      productid: it.productId,
      quantity: it.quantity,
      sortorder: it.sortOrder ?? idx,
      createdat: now,
    }))
    const { error: itemsErr } = await supabase.from('bundle_items').insert(itemsToInsert)
    if (itemsErr) {
      console.error('createBundle items error:', itemsErr)
      return { success: false, error: itemsErr.message }
    }
  }

  revalidatePath('/products')
  revalidatePath('/')
  return { success: true, id }
}

export async function updateBundle(id: string, input: UpsertBundleInput): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseAdmin() as any
  const now = new Date().toISOString()
  const slug = generateSlug(input.name)

  const { error } = await supabase
    .from('bundles')
    .update({
      name: input.name,
      slug,
      description: input.description ?? null,
      image: input.image ?? null,
      eventtypeid: input.eventTypeId,
      themestyleid: input.themeStyleId,
      categoryid: input.categoryId,
      bundleprice: input.bundlePrice ?? null,
      isactive: input.isActive,
      sortorder: input.sortOrder ?? 0,
      updatedat: now,
    })
    .eq('id', id)

  if (error) {
    console.error('updateBundle error:', error)
    return { success: false, error: error.message }
  }

  // Replace items
  const { error: delErr } = await supabase.from('bundle_items').delete().eq('bundleid', id)
  if (delErr) {
    console.error('updateBundle delete items error:', delErr)
  }

  if (input.items?.length) {
    const itemsToInsert = input.items.map((it, idx) => ({
      id: randomUUID(),
      bundleid: id,
      productid: it.productId,
      quantity: it.quantity,
      sortorder: it.sortOrder ?? idx,
      createdat: now,
    }))
    const { error: insErr } = await supabase.from('bundle_items').insert(itemsToInsert)
    if (insErr) {
      console.error('updateBundle items insert error:', insErr)
    }
  }

  revalidatePath('/products')
  revalidatePath('/')
  return { success: true }
}

export async function deleteBundle(id: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseAdmin() as any
  const { error: delItemsErr } = await supabase.from('bundle_items').delete().eq('bundleid', id)
  if (delItemsErr) {
    console.error('deleteBundle items error:', delItemsErr)
  }
  const { error } = await supabase.from('bundles').delete().eq('id', id)
  if (error) {
    console.error('deleteBundle error:', error)
    return { success: false, error: error.message }
  }
  revalidatePath('/products')
  revalidatePath('/')
  return { success: true }
}

export async function fetchBundleById(id: string): Promise<Bundle | null> {
  const supabase = getSupabaseAdmin() as any
  const { data: bData, error } = await supabase.from('bundles').select('*').eq('id', id).maybeSingle()
  if (error || !bData) return null

  const { data: items, error: itemsError } = await supabase
    .from('bundle_items')
    .select('*')
    .eq('bundleid', id)
    .order('sortorder', { ascending: true })
  if (itemsError) return null

  const productIds = Array.from(new Set((items || []).map((i: any) => i.productid)))
  let productsMap: Record<string, any> = {}
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select(`id, name, slug, price, product_images(url, alt, sortOrder)`) 
      .in('id', productIds)
    productsMap = Object.fromEntries((products || []).map((p: any) => [p.id, p]))
  }

  const itemsOut: BundleItem[] = (items || []).map((it: any) => {
    const p = productsMap[it.productid]
    return {
      id: it.id,
      productId: it.productid,
      quantity: it.quantity,
      sortOrder: it.sortorder,
      product: p
        ? {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: typeof p.price === 'object' ? parseFloat(p.price.toString()) : p.price,
            images: p.product_images || [],
          }
        : undefined,
    }
  })

  return {
    id: bData.id,
    name: bData.name,
    slug: bData.slug,
    description: bData.description || null,
    image: bData.image || null,
    eventTypeId: bData.eventtypeid,
    themeStyleId: bData.themestyleid,
    categoryId: bData.categoryid,
    bundlePrice: bData.bundleprice != null ? Number(bData.bundleprice) : null,
    isActive: bData.isactive,
    sortOrder: bData.sortorder,
    createdAt: bData.createdat,
    updatedAt: bData.updatedat,
    items: itemsOut,
  }
}

export async function fetchBundleBySlug(slug: string): Promise<Bundle | null> {
  const supabase = getSupabaseAdmin() as any
  const { data } = await supabase.from('bundles').select('id').eq('slug', slug).maybeSingle()
  if (!data?.id) return null
  return fetchBundleById(data.id)
}

export interface FetchBundlesOptions {
  eventTypeId?: string
  themeStyleId?: string
  activeOnly?: boolean
}

export async function fetchBundles(options: FetchBundlesOptions = {}): Promise<Bundle[]> {
  const supabase = getSupabaseAdmin() as any
  let query = supabase.from('bundles').select('*')
  if (options.activeOnly) query = query.eq('isactive', true)
  if (options.eventTypeId) query = query.eq('eventtypeid', options.eventTypeId)
  if (options.themeStyleId) query = query.eq('themestyleid', options.themeStyleId)
  const { data: bundles, error } = await query.order('sortorder', { ascending: true })
  if (error || !bundles?.length) return []

  const bundleIds = (bundles || []).map((b: any) => b.id)
  const { data: items } = await supabase
    .from('bundle_items')
    .select('*')
    .in('bundleid', bundleIds)
    .order('sortorder', { ascending: true })

  const productIds = Array.from(new Set((items || []).map((i: any) => i.productid)))
  let productsMap: Record<string, any> = {}
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select(`id, name, slug, price, product_images(url, alt, sortOrder)`) 
      .in('id', productIds)
    productsMap = Object.fromEntries((products || []).map((p: any) => [p.id, p]))
  }

  const grouped: Record<string, any> = {}
  for (const b of bundles || []) grouped[b.id] = { ...b, items: [] }
  for (const it of (items || [])) {
    const p = productsMap[it.productid]
    grouped[it.bundleid].items.push({
      id: it.id,
      productId: it.productid,
      quantity: it.quantity,
      sortOrder: it.sortorder,
      product: p
        ? {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: typeof p.price === 'object' ? parseFloat(p.price.toString()) : p.price,
            images: p.product_images || [],
          }
        : undefined,
    })
  }

  return Object.values(grouped).map((b: any) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description || null,
    image: b.image || null,
    eventTypeId: b.eventtypeid,
    themeStyleId: b.themestyleid,
    categoryId: b.categoryid,
    bundlePrice: b.bundleprice != null ? Number(b.bundleprice) : null,
    isActive: b.isactive,
    sortOrder: b.sortorder,
    createdAt: b.createdat,
    updatedAt: b.updatedat,
    items: b.items,
  }))
}


