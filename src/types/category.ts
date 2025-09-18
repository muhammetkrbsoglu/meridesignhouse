export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  children: Category[]
  level: number
}