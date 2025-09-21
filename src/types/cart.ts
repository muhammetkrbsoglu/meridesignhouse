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

export interface CartItemVariantOptionValue {
  optionId: string
  optionLabel: string
  valueId: string
  valueLabel: string
  hexValue?: string | null
}

export interface CartItemVariantImage {
  url: string
  alt: string | null
  sortOrder: number | null
}

export interface CartItemVariant {
  id: string
  title: string
  sku?: string | null
  badgeHex?: string | null
  stock?: number | null
  optionValues?: CartItemVariantOptionValue[]
  images?: CartItemVariantImage[]
}

export interface CartItem {
  id: string
  userId: string
  productId: string
  variantId: string | null
  quantity: number
  createdAt: string
  updatedAt: string
  product: CartProduct
  variant?: CartItemVariant | null
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
  variantId: string | null
  createdAt: string
  product: CartProduct
  variant?: CartItemVariant | null
}

