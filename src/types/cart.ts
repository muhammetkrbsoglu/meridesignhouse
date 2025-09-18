export interface CartProductCategory {
  name: string
}

export interface CartProduct {
  id: string
  name: string
  slug: string
  price: number
  product_images: Array<{
    url: string
    alt: string | null
    sortOrder: number | null
  }>
  category: CartProductCategory | null
}

export interface CartItem {
  id: string
  userId: string
  productId: string
  quantity: number
  createdAt: string
  updatedAt: string
  product: CartProduct
}

export interface CartBundleItemProduct {
  id: string
  name: string
  slug: string
  price: number
  product_images: Array<{ url: string; alt: string | null; sortOrder: number | null }>
}

export interface CartBundleLineItem {
  id: string
  productId: string
  quantity: number
  product: CartBundleItemProduct | null
}

export interface CartBundleLine {
  id: string
  userId: string
  bundleId: string
  quantity: number
  price: number
  createdAt: string
  updatedAt: string
  bundle: { id: string; name: string; slug: string } | null
  items: CartBundleLineItem[]
}

export interface FavoriteItem {
  id: string
  userId: string
  productId: string
  createdAt: string
  product: CartProduct
}

