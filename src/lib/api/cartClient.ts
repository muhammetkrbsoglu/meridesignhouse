'use client'

import { callRpc } from './rpcClient'
import type { CartBundleLine, CartItem, FavoriteItem } from '@/types/cart'
import type { PersonalizationPayload } from '@/types/personalization'

export function addToCart(
  productId: string,
  quantity: number = 1,
  variantId?: string | null,
  personalization?: PersonalizationPayload | null,
) {
  return callRpc<{ success: boolean; error?: string }>('cart:addToCart', [productId, quantity, variantId ?? null, personalization ?? null])
}

export function addManyToCart(
  items: { productId: string; quantity: number; variantId?: string | null; personalization?: PersonalizationPayload | null }[],
) {
  const payload = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    variantId: item.variantId ?? null,
    personalization: item.personalization ?? null,
  }))
  return callRpc<{ success: boolean; error?: string }>('cart:addManyToCart', [payload])
}

export function addBundleToCart(bundleId: string) {
  return callRpc<{ success: boolean; error?: string }>('cart:addBundleToCart', [bundleId])
}

export function getCartBundles() {
  return callRpc<CartBundleLine[]>('cart:getCartBundles')
}

export function updateCartBundleQuantity(cartBundleId: string, quantity: number) {
  return callRpc<{ success: boolean; error?: string }>('cart:updateCartBundleQuantity', [cartBundleId, quantity])
}

export function removeCartBundle(cartBundleId: string) {
  return callRpc<{ success: boolean; error?: string }>('cart:removeCartBundle', [cartBundleId])
}

export function removeFromCart(cartItemId: string) {
  return callRpc<{ success: boolean; error?: string }>('cart:removeFromCart', [cartItemId])
}

export function updateCartItemQuantity(productId: string, variantId: string | null, quantity: number) {
  return callRpc<{ success: boolean; error?: string }>('cart:updateCartItemQuantity', [productId, variantId ?? null, quantity])
}

export function getCartItems() {
  return callRpc<CartItem[]>('cart:getCartItems')
}

export function getCartCount() {
  return callRpc<number>('cart:getCartCount')
}

export function clearCart() {
  return callRpc<{ success: boolean; error?: string }>('cart:clearCart')
}

export function addToFavorites(productId: string, variantId?: string | null) {
  return callRpc<{ success: boolean; error?: string }>('favorites:addToFavorites', [productId, variantId ?? null])
}

export function removeFromFavorites(productId: string, variantId?: string | null) {
  return callRpc<{ success: boolean; error?: string }>('favorites:removeFromFavorites', [productId, variantId ?? null])
}

export function getFavoriteItems() {
  return callRpc<FavoriteItem[]>('favorites:getFavoriteItems')
}

export function isProductInFavorites(productId: string, variantId?: string | null) {
  return callRpc<boolean>('favorites:isProductInFavorites', [productId, variantId ?? null])
}

export function getFavoriteCount() {
  return callRpc<number>('favorites:getFavoriteCount')
}

