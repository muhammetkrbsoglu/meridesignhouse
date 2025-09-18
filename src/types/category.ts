export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  parentId?: string | null
  isActive?: boolean
  sortOrder?: number
  children?: Category[]
  productCount?: number
  level?: number
}
