'use client'

import { callRpc } from './rpcClient'
import type { CartBundleLine, CartItem, FavoriteItem } from '@/types/cart'

export function addToCart(productId: string, quantity: number = 1) {
  return callRpc<{ success: boolean; error?: string }>('cart:addToCart', [productId, quantity])
}

export function addManyToCart(items: { productId: string; quantity: number }[]) {
  return callRpc<{ success: boolean; error?: string }>('cart:addManyToCart', [items])
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

export function updateCartItemQuantity(productId: string, quantity: number) {
  return callRpc<{ success: boolean; error?: string }>('cart:updateCartItemQuantity', [productId, quantity])
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

export function addToFavorites(productId: string) {
  return callRpc<{ success: boolean; error?: string }>('favorites:addToFavorites', [productId])
}

export function removeFromFavorites(productId: string) {
  return callRpc<{ success: boolean; error?: string }>('favorites:removeFromFavorites', [productId])
}

export function getFavoriteItems() {
  return callRpc<FavoriteItem[]>('favorites:getFavoriteItems')
}

export function isProductInFavorites(productId: string) {
  return callRpc<boolean>('favorites:isProductInFavorites', [productId])
}

export function getFavoriteCount() {
  return callRpc<number>('favorites:getFavoriteCount')
}

