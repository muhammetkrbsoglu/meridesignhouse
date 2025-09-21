import { NextRequest, NextResponse } from 'next/server'
import {
  addToCart,
  addManyToCart,
  addBundleToCart,
  getCartBundles,
  updateCartBundleQuantity,
  removeCartBundle,
  removeFromCart,
  updateCartItemQuantity,
  getCartItems,
  getCartCount,
  clearCart,
  addToFavorites,
  removeFromFavorites,
  getFavoriteItems,
  isProductInFavorites,
  getFavoriteCount,
} from '@/lib/actions/cart'
import { fetchAllMainCategoriesWithHierarchy } from '@/lib/actions/categories'
import { fetchEventTypes, fetchThemeStyles } from '@/lib/actions/events'
import { fetchMenuCategories, fetchFeaturedProductsForCategory, fetchWeeklyFeaturedProduct, fetchAllWeeklyFeaturedProducts, fetchWeeklyFeaturedProductsForCategories } from '@/lib/actions/menu'
import { createContactMessage, backfillMessageUserIds } from '@/lib/actions/messages'

const actionMap = {
  'cart:addToCart': addToCart,
  'cart:addManyToCart': addManyToCart,
  'cart:addBundleToCart': addBundleToCart,
  'cart:getCartBundles': getCartBundles,
  'cart:updateCartBundleQuantity': updateCartBundleQuantity,
  'cart:removeCartBundle': removeCartBundle,
  'cart:removeFromCart': removeFromCart,
  'cart:updateCartItemQuantity': updateCartItemQuantity,
  'cart:getCartItems': getCartItems,
  'cart:getCartCount': getCartCount,
  'cart:clearCart': clearCart,
  'favorites:addToFavorites': addToFavorites,
  'favorites:removeFromFavorites': removeFromFavorites,
  'favorites:getFavoriteItems': getFavoriteItems,
  'favorites:isProductInFavorites': isProductInFavorites,
  'favorites:getFavoriteCount': getFavoriteCount,
  'categories:fetchAllMainCategoriesWithHierarchy': fetchAllMainCategoriesWithHierarchy,
  'events:fetchEventTypes': fetchEventTypes,
  'events:fetchThemeStyles': fetchThemeStyles,
  'menu:fetchMenuCategories': fetchMenuCategories,
  'menu:fetchFeaturedProductsForCategory': fetchFeaturedProductsForCategory,
  'menu:fetchWeeklyFeaturedProduct': fetchWeeklyFeaturedProduct,
  'menu:fetchAllWeeklyFeaturedProducts': fetchAllWeeklyFeaturedProducts,
  'menu:fetchWeeklyFeaturedProductsForCategories': fetchWeeklyFeaturedProductsForCategories,
  'messages:createContactMessage': createContactMessage,
  'messages:backfillMessageUserIds': backfillMessageUserIds,
} satisfies Record<string, (...args: any[]) => Promise<any>>

export async function POST(req: NextRequest) {
  try {
    let body
    try {
      body = await req.json()
    } catch (jsonError) {
      console.error('RPC: JSON parsing failed:', jsonError)
      return NextResponse.json({ success: false, error: 'Geçersiz JSON formatı' }, { status: 400 })
    }

    const { action, args } = body ?? {}

    if (typeof action !== 'string') {
      console.error(`RPC Error: Invalid action type '${typeof action}'`)
      return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 400 })
    }

    const handler = actionMap[action]

    if (!handler) {
      console.error(`RPC Error: Unsupported action '${action}'`)
      return NextResponse.json({ success: false, error: 'Desteklenmeyen işlem' }, { status: 400 })
    }

    if (args !== undefined && !Array.isArray(args)) {
      console.error(`RPC Error: Invalid args type '${typeof args}' for action '${action}'`, args)
      return NextResponse.json({ success: false, error: 'Argümanlar dizi olmalı' }, { status: 400 })
    }

    const result = await handler(...(args ?? []))

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error(`RPC Error: Handler execution failed for action '${action}':`, error)
    return NextResponse.json({ success: false, error: 'Beklenmeyen hata' }, { status: 500 })
  }
}
