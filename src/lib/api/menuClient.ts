'use client'

import { callRpc } from './rpcClient'
import type { MenuCategory, MenuProduct } from '@/types/menu'

export function fetchMenuCategories() {
  return callRpc<MenuCategory[]>('menu:fetchMenuCategories')
}

export function fetchFeaturedProductsForCategory(categoryId: string, limit: number = 6) {
  return callRpc<MenuProduct[]>('menu:fetchFeaturedProductsForCategory', [categoryId, limit])
}

export function fetchWeeklyFeaturedProduct(categoryId: string) {
  return callRpc<MenuProduct | null>('menu:fetchWeeklyFeaturedProduct', [categoryId])
}

export function fetchAllWeeklyFeaturedProducts() {
  return callRpc<MenuProduct[]>('menu:fetchAllWeeklyFeaturedProducts')
}

export function fetchWeeklyFeaturedProductsForCategories(categoryIds: string[]) {
  return callRpc<MenuProduct[]>('menu:fetchWeeklyFeaturedProductsForCategories', [categoryIds])
}

