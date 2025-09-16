'use server';

import { getSupabaseAdmin, createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    product_images: Array<{
      url: string;
      alt: string | null;
      sortOrder: number | null;
    }>;
    category: {
      name: string;
    } | null;
  };
}

export interface CartBundleItemProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  product_images: Array<{ url: string; alt: string | null; sortOrder: number | null }>;
}

export interface CartBundleLine {
  id: string;
  userId: string;
  bundleId: string;
  quantity: number;
  price: number; // bundle price per set
  createdAt: string;
  updatedAt: string;
  bundle: { id: string; name: string; slug: string } | null;
  items: Array<{ id: string; productId: string; quantity: number; product: CartBundleItemProduct | null }>
}

export interface FavoriteItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    product_images: Array<{
      url: string;
      alt: string | null;
      sortOrder: number | null;
    }>;
    category: {
      name: string;
    } | null;
  };
}

/**
 * Add item to cart
 */
export async function addToCart(productId: string, quantity: number = 1) {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    console.log('[cart.addToCart] auth', { hasUser: !!user, authError });
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();
    console.log('[cart.addToCart] input', { productId, quantity });

    // Check if item already exists in cart
    const { data: existingItems, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('userId', user.id)
      .eq('productId', productId);
    console.log('[cart.addToCart] existingItems', { existingItems, checkError });

    if (checkError) {
      console.error('[cart.addToCart] check error', checkError);
      return { success: false, error: 'Sepet kontrol edilirken hata oluştu' };
    }

    const existingItem = existingItems && existingItems.length > 0 ? existingItems[0] : null;

    if (existingItem) {
      // Update quantity if item exists
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ 
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingItem.id);
      console.log('[cart.addToCart] update', { updateError });

      if (updateError) {
        console.error('[cart.addToCart] update error', updateError);
        return { success: false, error: 'Sepet güncellenirken hata oluştu' };
      }
    } else {
      // Add new item to cart
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          id: crypto.randomUUID(),
          userId: user.id,
          productId: productId,
          quantity,
          updatedAt: new Date().toISOString(),
        });
      console.log('[cart.addToCart] insert', { insertError });

      if (insertError) {
        console.error('[cart.addToCart] insert error', insertError);
        return { success: false, error: 'Ürün sepete eklenirken hata oluştu' };
      }
    }

    // Client should refresh state and emit events.
    
    return { success: true };
  } catch (error) {
    console.error('[cart.addToCart] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Add many items to cart (best-effort sequential upsert)
 */
export async function addManyToCart(items: { productId: string; quantity: number }[]) {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    for (const { productId, quantity } of items) {
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('userId', user.id)
        .eq('productId', productId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[cart.addManyToCart] check error', checkError);
        continue;
      }

      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existingItem.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({
            id: crypto.randomUUID(),
            userId: user.id,
            productId: productId,
            quantity,
            updatedAt: new Date().toISOString(),
          });
      }
    }

    // Client should refresh state and emit events.
    
    return { success: true };
  } catch (error) {
    console.error('[cart.addManyToCart] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Add all items of a bundle to cart
 */
export async function addBundleToCart(bundleId: string) {
  'use server'
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    // Fetch bundle price and items
    const [{ data: bundleRow, error: bundleErr }, { data: items, error: itemsErr }] = await Promise.all([
      supabase
        .from('bundles')
        .select('id, name, slug, bundleprice')
        .eq('id', bundleId)
        .maybeSingle(),
      supabase
        .from('bundle_items')
        .select('productid, quantity')
        .eq('bundleid', bundleId)
        .order('sortorder', { ascending: true }),
    ])

    if (bundleErr || !bundleRow) {
      console.error('[cart.addBundleToCart] bundle fetch error', bundleErr)
      return { success: false, error: 'Set bulunamadı' }
    }
    if (itemsErr) {
      console.error('[cart.addBundleToCart] items fetch error', itemsErr)
      return { success: false, error: 'Set ürünleri alınamadı' }
    }

    // If bundle already in cart, just increase quantity
    const { data: existing, error: existingErr } = await supabase
      .from('cart_bundles')
      .select('*')
      .eq('userid', user.id)
      .eq('bundleid', bundleId)
      .maybeSingle()

    if (existingErr) {
      console.error('[cart.addBundleToCart] existing check error', existingErr)
    }

    const priceNumber = typeof bundleRow.bundleprice === 'number' ? bundleRow.bundleprice : Number(bundleRow.bundleprice)
    const nowIso = new Date().toISOString()

    let cartBundleId: string | null = existing?.id ?? null
    if (existing) {
      const { error: updErr } = await supabase
        .from('cart_bundles')
        .update({ quantity: existing.quantity + 1, updatedat: nowIso })
        .eq('id', existing.id)
      if (updErr) {
        console.error('[cart.addBundleToCart] update bundle qty error', updErr)
        return { success: false, error: 'Sepet güncellenemedi' }
      }
    } else {
      const newId = crypto.randomUUID()
      const { error: insErr } = await supabase
        .from('cart_bundles')
        .insert({ id: newId, userid: user.id, bundleid: bundleId, quantity: 1, price: priceNumber, createdat: nowIso, updatedat: nowIso })
      if (insErr) {
        console.error('[cart.addBundleToCart] insert bundle error', insErr)
        return { success: false, error: 'Set sepete eklenemedi' }
      }
      cartBundleId = newId
      // Insert snapshot of items for display/reference
      if (items && items.length > 0) {
        const rows = items.map((it: any) => ({ id: crypto.randomUUID(), cartbundleid: newId, productid: it.productid, quantity: it.quantity || 1 }))
        const { error: itemsInsErr } = await supabase.from('cart_bundle_items').insert(rows)
        if (itemsInsErr) console.error('[cart.addBundleToCart] insert bundle items error', itemsInsErr)
      }
    }

    revalidatePath('/cart')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'))
    }
    return { success: true }
  } catch (error) {
    console.error('[cart.addBundleToCart] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/** Fetch bundle lines in cart */
export async function getCartBundles(): Promise<CartBundleLine[]> {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    if (authError || !user) return []

    const supabase = getSupabaseAdmin();
    const { data: bundles, error } = await supabase
      .from('cart_bundles')
      .select('*')
      .eq('userid', user.id)
      .order('createdat', { ascending: false })

    if (error) {
      console.error('[cart.getCartBundles] fetch error', error)
      return []
    }

    const ids = (bundles || []).map((b: any) => b.id)
    const bundleIds = (bundles || []).map((b: any) => b.bundleid)
    const [{ data: items }, { data: bundleMeta }] = await Promise.all([
      ids.length
        ? supabase
            .from('cart_bundle_items')
            .select('*')
            .in('cartbundleid', ids)
        : Promise.resolve({ data: [] as any[] } as any),
      bundleIds.length
        ? supabase
            .from('bundles')
            .select('id, name, slug')
            .in('id', bundleIds)
        : Promise.resolve({ data: [] as any[] } as any),
    ])

    const metaMap = Object.fromEntries((bundleMeta || []).map((b: any) => [b.id, b]))

    // fetch product details for items (use snake_case key from DB)
    const productIds = Array.from(new Set((items || []).map((i: any) => i.productid)))
    const { data: products } = productIds.length
      ? await supabase
          .from('products')
          .select('id, name, slug, price, product_images(url, alt, sortOrder)')
          .in('id', productIds)
      : { data: [] as any[] }
    const productMap = Object.fromEntries((products || []).map((p: any) => [p.id, p]))

    const itemsByCartBundle = new Map<string, any[]>()
    for (const it of items || []) {
      const arr = itemsByCartBundle.get(it.cartbundleid) || []
      arr.push({ id: it.id, productId: it.productid, quantity: it.quantity, product: productMap[it.productid] || null })
      itemsByCartBundle.set(it.cartbundleid, arr)
    }

    return (bundles || []).map((b: any) => ({
      id: b.id,
      userId: b.userid,
      bundleId: b.bundleid,
      quantity: b.quantity,
      price: typeof b.price === 'number' ? b.price : Number(b.price),
      createdAt: b.createdat,
      updatedAt: b.updatedat,
      bundle: metaMap[b.bundleid] ? { id: metaMap[b.bundleid].id, name: metaMap[b.bundleid].name, slug: metaMap[b.bundleid].slug } : null,
      items: itemsByCartBundle.get(b.id) || [],
    }))
  } catch (e) {
    console.error('[cart.getCartBundles] unexpected error', e)
    return []
  }
}

/** Update bundle quantity */
export async function updateCartBundleQuantity(cartBundleId: string, quantity: number) {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    if (authError || !user) return { success: false, error: 'Giriş yapmanız gerekiyor' }

    if (quantity <= 0) {
      return removeCartBundle(cartBundleId)
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('cart_bundles')
      .update({ quantity, updatedat: new Date().toISOString() })
      .eq('id', cartBundleId)
      .eq('userid', user.id)

    if (error) {
      console.error('[cart.updateCartBundleQuantity] error', error)
      return { success: false, error: 'Sepet güncellenemedi' }
    }

    // Client components should refresh their own state and emit events.
    return { success: true }
  } catch (e) {
    console.error('[cart.updateCartBundleQuantity] unexpected', e)
    return { success: false, error: 'Bir hata oluştu' }
  }
}

/** Remove bundle line */
export async function removeCartBundle(cartBundleId: string) {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    if (authError || !user) return { success: false, error: 'Giriş yapmanız gerekiyor' }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('cart_bundles')
      .delete()
      .eq('id', cartBundleId)
      .eq('userid', user.id)

    if (error) {
      console.error('[cart.removeCartBundle] error', error)
      return { success: false, error: 'Set sepetten çıkarılamadı' }
    }

    // Client components should refresh their own state and emit events.
    return { success: true }
  } catch (e) {
    console.error('[cart.removeCartBundle] unexpected', e)
    return { success: false, error: 'Bir hata oluştu' }
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: string) {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('userId', user.id);

    if (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error: 'Ürün sepetten çıkarılırken hata oluştu' };
    }

    // Client should refresh state and emit events.
    
    return { success: true };
  } catch (error) {
    console.error('[cart.removeFromCart] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(productId: string, quantity: number) {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    // First find the cart item by product_id
    const { data: cartItem, error: findError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('productId', productId)
      .eq('userId', user.id)
      .single();

    if (findError || !cartItem) {
      return { success: false, error: 'Sepet öğesi bulunamadı' };
    }

    if (quantity <= 0) {
      return removeFromCart(cartItem.id);
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ 
        quantity,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', cartItem.id)
      .eq('userId', user.id);

    if (error) {
      console.error('Error updating cart quantity:', error);
      return { success: false, error: 'Sepet güncellenirken hata oluştu' };
    }

    // Client should refresh state and emit events.
    
    return { success: true };
  } catch (error) {
    console.error('[cart.updateCartItemQuantity] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Get user's cart items
 */
export async function getCartItems(): Promise<CartItem[]> {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return [];
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products (
          id,
          name,
          slug,
          price,
          product_images!left(url, alt, "sortOrder"),
          category:categories (
            name
          )
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });


    if (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[cart.getCartItems] unexpected error', error);
    return [];
  }
}

/**
 * Get cart items count
 */
export async function getCartCount(): Promise<number> {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return 0;
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    const [itemsRes, bundlesRes] = await Promise.all([
      supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user.id),
      supabase
        .from('cart_bundles')
        .select('quantity')
        .eq('userid', user.id)
    ])

    if (itemsRes.error) {
      console.error('Error fetching cart items count:', itemsRes.error);
      return 0;
    }
    if (bundlesRes.error) {
      console.error('Error fetching cart bundles for count:', bundlesRes.error);
      return itemsRes.count || 0;
    }

    const bundleQty = (bundlesRes.data || []).reduce((s: number, r: any) => s + (typeof r.quantity === 'number' ? r.quantity : Number(r.quantity) || 0), 0)
    const itemsCount = itemsRes.count || 0
    return itemsCount + bundleQty
  } catch (error) {
    console.error('[cart.getCartCount] unexpected error', error);
    return 0;
  }
}

/**
 * Clear user's cart
 */
export async function clearCart() {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    // Clear both cart_items and cart_bundles
    const [itemsResult, bundlesResult] = await Promise.all([
      supabase
        .from('cart_items')
        .delete()
        .eq('userId', user.id),
      supabase
        .from('cart_bundles')
        .delete()
        .eq('userid', user.id)
    ]);

    if (itemsResult.error) {
      console.error('Error clearing cart items:', itemsResult.error);
      return { success: false, error: 'Sepet ürünleri temizlenirken hata oluştu' };
    }

    if (bundlesResult.error) {
      console.error('Error clearing cart bundles:', bundlesResult.error);
      return { success: false, error: 'Sepet setleri temizlenirken hata oluştu' };
    }

    // Client should refresh state and emit events.
    
    return { success: true };
  } catch (error) {
    console.error('[cart.clearCart] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Add item to favorites
 */
export async function addToFavorites(productId: string) {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();
    console.log('[favorites.add] input', { productId });

    // Check if item already exists in favorites
    const { data: existingItem, error: checkError } = await supabase
      .from('favorites')
      .select('*')
      .eq('userId', user.id)
      .eq('productId', productId)
      .single();
    console.log('[favorites.add] existingItem', { existingItem, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[favorites.add] check error', checkError);
      return { success: false, error: 'Favoriler kontrol edilirken hata oluştu' };
    }

    if (existingItem) {
      return { success: false, error: 'Ürün zaten favorilerde' };
    }

    // Add new item to favorites
    const { error: insertError } = await supabase
      .from('favorites')
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        productId: productId,
      });
    console.log('[favorites.add] insert', { insertError });

    if (insertError) {
      console.error('[favorites.add] insert error', insertError);
      return { success: false, error: 'Ürün favorilere eklenirken hata oluştu' };
    }

    revalidatePath('/favorites');
    return { success: true };
  } catch (error) {
    console.error('[favorites.add] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Remove item from favorites
 */
export async function removeFromFavorites(productId: string) {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('userId', user.id)
      .eq('productId', productId);

    if (error) {
      console.error('[favorites.remove] delete error', error);
      return { success: false, error: 'Ürün favorilerden çıkarılırken hata oluştu' };
    }

    revalidatePath('/favorites');
    return { success: true };
  } catch (error) {
    console.error('[favorites.remove] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Get user's favorite items
 */
export async function getFavoriteItems(): Promise<FavoriteItem[]> {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return [];
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        product:products (
          id,
          name,
          slug,
          price,
          product_images!left(url, alt, "sortOrder"),
          category:categories (
            name
          )
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });


    if (error) {
      console.error('Error fetching favorite items:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[favorites.getFavoriteItems] unexpected error', error);
    return [];
  }
}

/**
 * Check if product is in favorites
 */
export async function isProductInFavorites(productId: string): Promise<boolean> {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return false;
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('userId', user.id)
      .eq('productId', productId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[favorites.isProductInFavorites] check error', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[favorites.isProductInFavorites] unexpected error', error);
    return false;
  }
}

/**
 * Get favorite items count
 */
export async function getFavoriteCount(): Promise<number> {
  try {
    // Get user from server client for authentication check
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return 0;
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = getSupabaseAdmin();

    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id);

    if (error) {
      console.error('Error fetching favorite count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[favorites.getFavoriteCount] unexpected error', error);
    return 0;
  }
}