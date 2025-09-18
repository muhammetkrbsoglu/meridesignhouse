export interface EventType {
  id: string
  name: string
  description?: string | null
  image?: string | null
  isActive?: boolean
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

export interface ThemeStyle {
  id: string
  name: string
  description?: string | null
  image?: string | null
  isActive?: boolean
  sortOrder?: number
  colors?: string[]
  createdAt?: string
  updatedAt?: string
}
