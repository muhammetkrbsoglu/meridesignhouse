export interface MenuCategory {
  id: string
  name: string
  slug: string
  image?: string | null
  description?: string | null
  children?: MenuCategory[]
}

export interface MenuProductCategory {
  name: string
  slug: string
}

export interface MenuProduct {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
  colors?: string[]
  categories: MenuProductCategory[]
}
