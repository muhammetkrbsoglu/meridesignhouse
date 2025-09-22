'use server';

import { getSupabaseAdmin, createServerClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { CartItem, CartBundleLine, FavoriteItem } from '@/types/cart'
import type { PersonalizationPayload } from '@/types/personalization'
import { revalidatePath } from 'next/cache'
const sanitizePersonalizationPayload = (payload: any): PersonalizationPayload | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const answers = Array.isArray(payload.answers)
    ? payload.answers
        .map((answer: any) => {
          if (!answer || typeof answer !== 'object') {
            return null
          }

          const fieldKey = typeof answer.fieldKey === 'string' ? answer.fieldKey : null
          if (!fieldKey) {
            return null
          }

          const fieldLabel = typeof answer.fieldLabel === 'string' ? answer.fieldLabel : ''
          const type = typeof answer.type === 'string' ? answer.type : 'text'

          let value: string | string[] | null = null
          if (Array.isArray(answer.value)) {
            value = answer.value.filter((item: unknown) => typeof item === 'string')
          } else if (typeof answer.value === 'string') {
            value = answer.value
          } else if (answer.value === null || answer.value === undefined) {
            value = null
          } else {
            value = String(answer.value)
          }

          return {
            fieldKey,
            fieldLabel,
            type,
            value,
            displayValue: typeof answer.displayValue === 'string' ? answer.displayValue : undefined,
            metadata: answer.metadata && typeof answer.metadata === 'object' ? answer.metadata : null,
          }
        })
        .filter((entry): entry is PersonalizationPayload['answers'][number] => entry !== null)
    : []

  if (answers.length === 0) {
    return null
  }

  return {
    completed: Boolean(payload.completed),
    completedAt: typeof payload.completedAt === 'string' ? payload.completedAt : undefined,
    answers,
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  productId: string,
  quantity: number = 1,
  variantId?: string | null,
  personalization?: PersonalizationPayload | null,
) {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    logger.debug('[cart.addToCart] auth', { hasUser: !!user, authError });

    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    const supabase = getSupabaseAdmin();
    const normalizedVariantId = variantId ?? null;
    const personalizationPayload = sanitizePersonalizationPayload(personalization);
    const shouldMerge = !personalizationPayload;

    logger.debug('[cart.addToCart] input', {
      productId,
      quantity,
      variantId: normalizedVariantId,
      hasPersonalization: Boolean(personalizationPayload),
    });

    if (normalizedVariantId) {
      const { data: variantRow, error: variantError } = await supabase
        .from('product_variants')
        .select('id, productId')
        .eq('id', normalizedVariantId)
        .maybeSingle();

      if (variantError || !variantRow || variantRow.productId !== productId) {
        logger.warn('[cart.addToCart] invalid variant reference', { productId, normalizedVariantId, variantError });
        return { success: false, error: 'Geçersiz varyant seçimi' };
      }
    }

    let existingItem: { id: string; quantity: number } | null = null;

    if (shouldMerge) {
      let existingQuery = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('userId', user.id)
        .eq('productId', productId)
        .limit(1);

      if (normalizedVariantId) {
        existingQuery = existingQuery.eq('variantId', normalizedVariantId);
      } else {
        existingQuery = existingQuery.is('variantId', null);
      }

      existingQuery = existingQuery.is('personalization', null);

      const { data: existingItems, error: checkError } = await existingQuery;
      logger.debug('[cart.addToCart] existingItems', { existingItems, checkError });

      if (checkError) {
        logger.error('[cart.addToCart] check error', checkError);
        return { success: false, error: 'Sepet kontrol edilirken hata oluştu' };
      }

      existingItem = existingItems && existingItems.length > 0 ? existingItems[0] : null;
    }

    const now = new Date().toISOString();

    if (existingItem) {
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + quantity,
          variantId: normalizedVariantId,
          personalization: personalizationPayload,
          updatedAt: now,
        })
        .eq('id', existingItem.id);
      logger.debug('[cart.addToCart] update', { updateError });

      if (updateError) {
        logger.error('[cart.addToCart] update error', updateError);
        return { success: false, error: 'Sepet güncellenirken hata oluştu' };
      }
    } else {
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          id: crypto.randomUUID(),
          userId: user.id,
          productId,
          variantId: normalizedVariantId,
          quantity,
          personalization: personalizationPayload,
          updatedAt: now,
        });
      logger.debug('[cart.addToCart] insert', { insertError });

      if (insertError) {
        logger.error('[cart.addToCart] insert error', insertError);
        return { success: false, error: 'Ürün sepete eklenirken hata oluştu' };
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('[cart.addToCart] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Add many items to cart (best-effort sequential upsert)
 */
export async function addManyToCart(
  items: { productId: string; quantity: number; variantId?: string | null; personalization?: PersonalizationPayload | null }[],
) {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    const supabase = getSupabaseAdmin();

    for (const { productId, quantity, variantId, personalization } of items) {
      const normalizedVariantId = variantId ?? null;
      const personalizationPayload = sanitizePersonalizationPayload(personalization);
      const shouldMerge = !personalizationPayload;

      if (normalizedVariantId) {
        const { data: variantRow, error: variantError } = await supabase
          .from('product_variants')
          .select('id, productId')
          .eq('id', normalizedVariantId)
          .maybeSingle();

        if (variantError || !variantRow || variantRow.productId !== productId) {
          logger.warn('[cart.addManyToCart] invalid variant reference', { productId, normalizedVariantId, variantError });
          continue;
        }
      }

      let existingItem: { id: string; quantity: number } | null = null;

      if (shouldMerge) {
        let existingQuery = supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('userId', user.id)
          .eq('productId', productId)
          .limit(1);

        if (normalizedVariantId) {
          existingQuery = existingQuery.eq('variantId', normalizedVariantId);
        } else {
          existingQuery = existingQuery.is('variantId', null);
        }

        existingQuery = existingQuery.is('personalization', null);

        const { data: existing, error: checkError } = await existingQuery.maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          logger.error('[cart.addManyToCart] check error', checkError);
          continue;
        }

        existingItem = existing ?? null;
      }

      const now = new Date().toISOString();

      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({
            quantity: existingItem.quantity + quantity,
            variantId: normalizedVariantId,
            personalization: personalizationPayload,
            updatedAt: now,
          })
          .eq('id', existingItem.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({
            id: crypto.randomUUID(),
            userId: user.id,
            productId,
            variantId: normalizedVariantId,
            quantity,
            personalization: personalizationPayload,
            updatedAt: now,
          });
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('[cart.addManyToCart] unexpected error', error);
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
      logger.error('[cart.addBundleToCart] bundle fetch error', bundleErr)
      return { success: false, error: 'Set bulunamadı' }
    }
    if (itemsErr) {
      logger.error('[cart.addBundleToCart] items fetch error', itemsErr)
      return { success: false, error: 'Set ürünleri alınamadı' }
    }

    // If bundle already in cart, just increase quantity
    const { data: existing, error: existingErr } = await supabase
      .from('cart_bundles')
      .select('id, quantity')
      .eq('userid', user.id)
      .eq('bundleid', bundleId)
      .maybeSingle()

    if (existingErr) {
      logger.error('[cart.addBundleToCart] existing check error', existingErr)
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
        logger.error('[cart.addBundleToCart] update bundle qty error', updErr)
        return { success: false, error: 'Sepet güncellenemedi' }
      }
    } else {
      const newId = crypto.randomUUID()
      const { error: insErr } = await supabase
        .from('cart_bundles')
        .insert({ id: newId, userid: user.id, bundleid: bundleId, quantity: 1, price: priceNumber, createdat: nowIso, updatedat: nowIso })
      if (insErr) {
        logger.error('[cart.addBundleToCart] insert bundle error', insErr)
        return { success: false, error: 'Set sepete eklenemedi' }
      }
      cartBundleId = newId
      // Insert snapshot of items for display/reference
      if (items && items.length > 0) {
        const rows = items.map((it: any) => ({ id: crypto.randomUUID(), cartbundleid: newId, productid: it.productid, quantity: it.quantity || 1 }))
        const { error: itemsInsErr } = await supabase.from('cart_bundle_items').insert(rows)
        if (itemsInsErr) logger.error('[cart.addBundleToCart] insert bundle items error', itemsInsErr)
      }
    }

    revalidatePath('/cart')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'))
    }
    return { success: true }
  } catch (error) {
    logger.error('[cart.addBundleToCart] unexpected error', error);
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
      .select('id, userid, bundleid, quantity, price, createdat, updatedat')
      .eq('userid', user.id)
      .order('createdat', { ascending: false })

    if (error) {
      logger.error('[cart.getCartBundles] fetch error', error)
      return []
    }

    const ids = (bundles || []).map((b: any) => b.id)
    const bundleIds = (bundles || []).map((b: any) => b.bundleid)
    const [{ data: items }, { data: bundleMeta }] = await Promise.all([
      ids.length
        ? supabase
            .from('cart_bundle_items')
            .select('id, cartbundleid, productid, quantity')
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
    logger.error('[cart.getCartBundles] unexpected error', e)
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
      logger.error('[cart.updateCartBundleQuantity] error', error)
      return { success: false, error: 'Sepet güncellenemedi' }
    }

    // Client components should refresh their own state and emit events.
    return { success: true }
  } catch (e) {
    logger.error('[cart.updateCartBundleQuantity] unexpected', e)
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
      logger.error('[cart.removeCartBundle] error', error)
      return { success: false, error: 'Set sepetten çıkarılamadı' }
    }

    // Client components should refresh their own state and emit events.
    return { success: true }
  } catch (e) {
    logger.error('[cart.removeCartBundle] unexpected', e)
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
      logger.error('Error removing from cart:', error);
      return { success: false, error: 'Ürün sepetten çıkarılırken hata oluştu' };
    }

    // Client should refresh state and emit events.
    
    return { success: true };
  } catch (error) {
    logger.error('[cart.removeFromCart] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(productId: string, variantId: string | null, quantity: number) {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    const supabase = getSupabaseAdmin();
    const normalizedVariantId = variantId ?? null;

    let findQuery = supabase
      .from('cart_items')
      .select('id')
      .eq('productId', productId)
      .eq('userId', user.id)
      .limit(1);

    if (normalizedVariantId) {
      findQuery = findQuery.eq('variantId', normalizedVariantId);
    } else {
      findQuery = findQuery.is('variantId', null);
    }

    const { data: cartItem, error: findError } = await findQuery.single();

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
      logger.error('Error updating cart quantity:', error);
      return { success: false, error: 'Sepet güncellenirken hata oluştu' };
    }

    return { success: true };
  } catch (error) {
    logger.error('[cart.updateCartItemQuantity] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Get user's cart items
 */
export async function getCartItems(): Promise<CartItem[]> {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();

    if (authError || !user) {
      return [];
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        userId,
        productId,
        variantId,
        quantity,
        personalization,
        createdAt,
        updatedAt,
        product:products (
          id,
          name,
          slug,
          price,
          colors,
          product_images!left(url, alt, "sortOrder", variantId),
          category:categories ( name ),
          options:product_options!left(
            id,
            label,
            displayType,
            product_option_values(id, value, label, hexValue)
          )
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) {
      logger.error('Error fetching cart items:', error);
      return [];
    }

    const items = (data || []) as Array<any>;
    const variantIds = Array.from(new Set(items.map((item) => item.variantId).filter(Boolean))) as string[];

    const variantMap = new Map<string, any>();

    if (variantIds.length > 0) {
      const { data: variantRows, error: variantError } = await supabase
        .from('product_variants')
        .select(`
          id,
          productId,
          title,
          sku,
          badgeHex,
          stock,
          product_variant_options(optionId, valueId),
          images:product_images!left(url, alt, sortOrder)
        `)
        .in('id', variantIds);

      if (variantError) {
        logger.error('[cart.getCartItems] variant fetch error', variantError);
      } else {
        for (const row of variantRows || []) {
          variantMap.set(row.id, row);
        }
      }
    }

    const result: CartItem[] = items.map((item) => {
      const rawProduct = item.product || null;
      const productImages = (rawProduct?.product_images || []).map((image: any) => ({
        url: image.url,
        alt: image.alt ?? null,
        sortOrder: image.sortOrder ?? 0,
      }));

      const transformedProduct = rawProduct
        ? {
            id: rawProduct.id,
            name: rawProduct.name,
            slug: rawProduct.slug,
            price: typeof rawProduct.price === 'number' ? rawProduct.price : Number(rawProduct.price),
            product_images: productImages,
            colors: Array.isArray(rawProduct.colors) ? rawProduct.colors : [],
            category: rawProduct.category ?? null,
          }
        : null;

      const variantSource = item.variantId ? variantMap.get(item.variantId) ?? null : null;
      let variantOptionValues;

      if (variantSource && rawProduct?.options) {
        const optionList = rawProduct.options || [];
        variantOptionValues = (variantSource.product_variant_options || []).map((selection: any) => {
          const option = optionList.find((opt: any) => opt.id === selection.optionId);
          const valueList = option?.product_option_values || [];
          const value = valueList.find((val: any) => val.id === selection.valueId);
          return {
            optionId: selection.optionId,
            optionLabel: option?.label ?? '',
            valueId: selection.valueId,
            valueLabel: value?.label ?? value?.value ?? selection.valueId,
            hexValue: value?.hexValue ?? null,
          };
        });
      }

      const variant = variantSource
        ? {
            id: variantSource.id,
            title: variantSource.title,
            sku: variantSource.sku ?? null,
            badgeHex: variantSource.badgeHex ?? null,
            stock: typeof variantSource.stock === 'number' ? variantSource.stock : Number(variantSource.stock ?? 0),
            optionValues: variantOptionValues,
            images: (variantSource.images || []).map((img: any) => ({
              url: img.url,
              alt: img.alt ?? null,
              sortOrder: img.sortOrder ?? 0,
            })),
          }
        : null;

      const safeProduct = transformedProduct ?? {
        id: item.productId,
        name: 'Ürün',
        slug: '',
        price: 0,
        product_images: [],
        category: null,
      };

      const personalizationPayload =
        sanitizePersonalizationPayload(item.personalization) ??
        (item.personalization ? (item.personalization as PersonalizationPayload) : null);

      return {
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: safeProduct,
        personalization: personalizationPayload,
        variant,
      };
    });

    return result;
  } catch (error) {
    logger.error('[cart.getCartItems] unexpected error', error);
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
        .select('id', { count: 'exact', head: true })
        .eq('userId', user.id),
      supabase
        .from('cart_bundles')
        .select('quantity')
        .eq('userid', user.id)
    ])

    if (itemsRes.error) {
      logger.error('Error fetching cart items count:', itemsRes.error);
      return 0;
    }
    if (bundlesRes.error) {
      logger.error('Error fetching cart bundles for count:', bundlesRes.error);
      return itemsRes.count || 0;
    }

    const bundleQty = (bundlesRes.data || []).reduce((s: number, r: any) => s + (typeof r.quantity === 'number' ? r.quantity : Number(r.quantity) || 0), 0)
    const itemsCount = itemsRes.count || 0
    return itemsCount + bundleQty
  } catch (error) {
    logger.error('[cart.getCartCount] unexpected error', error);
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
      logger.error('Error clearing cart items:', itemsResult.error);
      return { success: false, error: 'Sepet ürünleri temizlenirken hata oluştu' };
    }

    if (bundlesResult.error) {
      logger.error('Error clearing cart bundles:', bundlesResult.error);
      return { success: false, error: 'Sepet setleri temizlenirken hata oluştu' };
    }

    // Client should refresh state and emit events.
    
    return { success: true };
  } catch (error) {
    logger.error('[cart.clearCart] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Add item to favorites
 */
export async function addToFavorites(productId: string, variantId?: string | null) {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    const supabase = getSupabaseAdmin();
    const normalizedVariantId = variantId ?? null;
    logger.debug('[favorites.add] input', { productId, variantId: normalizedVariantId });

    if (normalizedVariantId) {
      const { data: variantRow, error: variantError } = await supabase
        .from('product_variants')
        .select('id, productId')
        .eq('id', normalizedVariantId)
        .maybeSingle();

      if (variantError || !variantRow || variantRow.productId !== productId) {
        logger.warn('[favorites.add] invalid variant reference', { productId, normalizedVariantId, variantError });
        return { success: false, error: 'Geçersiz varyant seçimi' };
      }
    }

    let existingQuery = supabase
      .from('favorites')
      .select('id')
      .eq('userId', user.id)
      .eq('productId', productId)
      .limit(1);

    if (normalizedVariantId) {
      existingQuery = existingQuery.eq('variantId', normalizedVariantId);
    } else {
      existingQuery = existingQuery.is('variantId', null);
    }

    const { data: existingItem, error: checkError } = await existingQuery.single();
    logger.debug('[favorites.add] existingItem', { existingItem, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('[favorites.add] check error', checkError);
      return { success: false, error: 'Favoriler kontrol edilirken hata oluştu' };
    }

    if (existingItem) {
      return { success: false, error: 'Ürün zaten favorilerde' };
    }

    const { error: insertError } = await supabase
      .from('favorites')
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        productId,
        variantId: normalizedVariantId,
      });
    logger.debug('[favorites.add] insert', { insertError });

    if (insertError) {
      logger.error('[favorites.add] insert error', insertError);
      return { success: false, error: 'Ürün favorilere eklenirken hata oluştu' };
    }

    revalidatePath('/favorites');
    return { success: true };
  } catch (error) {
    logger.error('[favorites.add] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Remove item from favorites
 */
export async function removeFromFavorites(productId: string, variantId?: string | null) {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    const supabase = getSupabaseAdmin();
    const normalizedVariantId = variantId ?? null;

    let deleteQuery = supabase
      .from('favorites')
      .delete()
      .eq('userId', user.id)
      .eq('productId', productId);

    if (normalizedVariantId) {
      deleteQuery = deleteQuery.eq('variantId', normalizedVariantId);
    } else {
      deleteQuery = deleteQuery.is('variantId', null);
    }

    const { error } = await deleteQuery;

    if (error) {
      logger.error('[favorites.remove] delete error', error);
      return { success: false, error: 'Ürün favorilerden çıkarılırken hata oluştu' };
    }

    revalidatePath('/favorites');
    return { success: true };
  } catch (error) {
    logger.error('[favorites.remove] unexpected error', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Get user's favorite items
 */
export async function getFavoriteItems(): Promise<FavoriteItem[]> {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return [];
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        userId,
        productId,
        variantId,
        createdAt,
        product:products (
          id,
          name,
          slug,
          price,
          colors,
          product_images!left(url, alt, "sortOrder", variantId),
          category:categories ( name ),
          options:product_options!left(
            id,
            label,
            displayType,
            product_option_values(id, value, label, hexValue)
          )
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) {
      logger.error('Error fetching favorite items:', error);
      return [];
    }

    const items = (data || []) as Array<any>;
    const variantIds = Array.from(new Set(items.map((item) => item.variantId).filter(Boolean))) as string[];

    const variantMap = new Map<string, any>();

    if (variantIds.length > 0) {
      const { data: variantRows, error: variantError } = await supabase
        .from('product_variants')
        .select(`
          id,
          productId,
          title,
          sku,
          badgeHex,
          stock,
          product_variant_options(optionId, valueId),
          images:product_images!left(url, alt, sortOrder)
        `)
        .in('id', variantIds);

      if (variantError) {
        logger.error('[favorites.getFavoriteItems] variant fetch error', variantError);
      } else {
        for (const row of variantRows || []) {
          variantMap.set(row.id, row);
        }
      }
    }

    const result: FavoriteItem[] = items.map((item) => {
      const rawProduct = item.product || null;
      const productImages = (rawProduct?.product_images || []).map((image: any) => ({
        url: image.url,
        alt: image.alt ?? null,
        sortOrder: image.sortOrder ?? 0,
      }));

      const transformedProduct = rawProduct
        ? {
            id: rawProduct.id,
            name: rawProduct.name,
            slug: rawProduct.slug,
            price: typeof rawProduct.price === 'number' ? rawProduct.price : Number(rawProduct.price),
            product_images: productImages,
            colors: Array.isArray(rawProduct.colors) ? rawProduct.colors : [],
            category: rawProduct.category ?? null,
          }
        : null;

      const variantSource = item.variantId ? variantMap.get(item.variantId) ?? null : null;
      let variantOptionValues;

      if (variantSource && rawProduct?.options) {
        const optionList = rawProduct.options || [];
        variantOptionValues = (variantSource.product_variant_options || []).map((selection: any) => {
          const option = optionList.find((opt: any) => opt.id === selection.optionId);
          const valueList = option?.product_option_values || [];
          const value = valueList.find((val: any) => val.id === selection.valueId);
          return {
            optionId: selection.optionId,
            optionLabel: option?.label ?? '',
            valueId: selection.valueId,
            valueLabel: value?.label ?? value?.value ?? selection.valueId,
            hexValue: value?.hexValue ?? null,
          };
        });
      }

      const variant = variantSource
        ? {
            id: variantSource.id,
            title: variantSource.title,
            sku: variantSource.sku ?? null,
            badgeHex: variantSource.badgeHex ?? null,
            stock: typeof variantSource.stock === 'number' ? variantSource.stock : Number(variantSource.stock ?? 0),
            optionValues: variantOptionValues,
            images: (variantSource.images || []).map((img: any) => ({
              url: img.url,
              alt: img.alt ?? null,
              sortOrder: img.sortOrder ?? 0,
            })),
          }
        : null;

      const safeProduct = transformedProduct ?? {
        id: item.productId,
        name: 'Ürün',
        slug: '',
        price: 0,
        product_images: [],
        category: null,
      };

      return {
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        variantId: item.variantId ?? null,
        createdAt: item.createdAt,
        product: safeProduct,
        variant,
      };
    });

    return result;
  } catch (error) {
    logger.error('[favorites.getFavoriteItems] unexpected error', error);
    return [];
  }
}

/**
 * Check if product is in favorites
 */
export async function isProductInFavorites(productId: string, variantId?: string | null): Promise<boolean> {
  try {
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    
    if (authError || !user) {
      return false;
    }

    const supabase = getSupabaseAdmin();
    const normalizedVariantId = variantId ?? null;

    let query = supabase
      .from('favorites')
      .select('id')
      .eq('userId', user.id)
      .eq('productId', productId)
      .limit(1);

    if (normalizedVariantId) {
      query = query.eq('variantId', normalizedVariantId);
    } else {
      query = query.is('variantId', null);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      logger.error('[favorites.isProductInFavorites] check error', error);
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error('[favorites.isProductInFavorites] unexpected error', error);
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
      logger.error('Error fetching favorite count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('[favorites.getFavoriteCount] unexpected error', error);
    return 0;
  }
}







