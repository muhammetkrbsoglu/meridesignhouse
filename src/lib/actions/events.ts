'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface EventType {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface ThemeStyle {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  sortOrder: number
  colors?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ProductEventTheme {
  id: string
  productId: string
  eventTypeId: string
  themeStyleId: string
  createdAt: Date
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: { url: string; alt: string | null }[]
  }
  eventType: {
    id: string
    name: string
  }
  themeStyle: ThemeStyle
}

// Fetch all active event types
export async function fetchEventTypes(): Promise<EventType[]> {
  try {
    const supabase = getSupabaseAdmin()
    const { data: eventTypes, error } = await supabase
      .from('event_types')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: true })
    
    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Failed to fetch event types')
    }
    
    return eventTypes?.map((event: { id: string; name: string; description: string; imageUrl: string; isActive: boolean; createdAt: string; updatedAt: string }) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      image: event.imageUrl,
      isActive: event.isActive,
      sortOrder: 0, // Supabase schema'da yok
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    })) || []
  } catch (error) {
    console.error('Error fetching event types:', error)
    throw new Error('Failed to fetch event types')
  }
}

// Fetch all active theme styles
export async function fetchThemeStyles(): Promise<ThemeStyle[]> {
  try {
    const supabase = getSupabaseAdmin()
    const { data: themeStyles, error } = await supabase
      .from('theme_styles')
      .select('id, name, description, image, isActive, createdAt, updatedAt, colors')
      .eq('isActive', true)
      .order('createdAt', { ascending: true })
    
    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Failed to fetch theme styles')
    }
    
    return themeStyles?.map((theme: { id: string; name: string; description: string; image: string; isActive: boolean; createdAt: string; updatedAt: string; colors?: string[] }) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      image: theme.image,
      isActive: theme.isActive,
      sortOrder: 0, // Supabase schema'da yok
      colors: theme.colors || [],
      createdAt: new Date(theme.createdAt),
      updatedAt: new Date(theme.updatedAt)
    })) || []
  } catch (error) {
    console.error('Error fetching theme styles:', error)
    throw new Error('Failed to fetch theme styles')
  }
}

// Fetch products for specific event type and theme combination
export async function fetchProductsForEventTheme(
  eventTypeId: string,
  themeStyleId: string
): Promise<ProductEventTheme[]> {
  try {
    const products = await prisma.productEventTheme.findMany({
      where: {
        eventTypeId,
        themeStyleId,
        product: {
          isActive: true
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              select: {
                url: true,
                alt: true
              },
              orderBy: {
                sortOrder: 'asc'
              },
              take: 1
            }
          }
        },
        eventType: {
          select: {
            id: true,
            name: true
          }
        },
        themeStyle: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            isActive: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })
    // Convert Decimal to number in product.price
    return products.map((p) => ({
      ...p,
      product: {
        ...p.product,
        price: typeof (p.product as any).price === 'object' 
          ? parseFloat((p.product as any).price.toString()) 
          : (p.product as any).price
      }
    })) as unknown as ProductEventTheme[]
  } catch (error) {
    console.error('Error fetching products for event theme:', error)
    throw new Error('Failed to fetch products for event theme')
  }
}

// Create event type
export async function createEventType(data: {
  name: string
  description?: string
  image?: string
  sortOrder?: number
}): Promise<EventType> {
  try {
    const eventType = await prisma.eventType.create({
      data: {
        name: data.name,
        description: data.description || null,
        image: data.image || null,
        sortOrder: data.sortOrder || 0,
        isActive: true
      }
    })
    
    revalidatePath('/admin/events')
    return eventType
  } catch (error) {
    console.error('Error creating event type:', error)
    throw new Error('Failed to create event type')
  }
}

// Update event type
export async function updateEventType(
  id: string,
  data: {
    name?: string
    description?: string
    image?: string
    isActive?: boolean
    sortOrder?: number
  }
): Promise<EventType> {
  try {
    const eventType = await prisma.eventType.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder })
      }
    })
    
    revalidatePath('/admin/events')
    return eventType
  } catch (error) {
    console.error('Error updating event type:', error)
    throw new Error('Failed to update event type')
  }
}

// Delete event type
export async function deleteEventType(id: string): Promise<void> {
  try {
    await prisma.eventType.delete({
      where: { id }
    })
    
    revalidatePath('/admin/events')
  } catch (error) {
    console.error('Error deleting event type:', error)
    throw new Error('Failed to delete event type')
  }
}

// Create theme style
export async function createThemeStyle(data: {
  name: string
  description?: string
  image?: string
  sortOrder?: number
  colors?: string[]
}): Promise<ThemeStyle> {
  try {
    const themeStyle = await prisma.themeStyle.create({
      data: {
        name: data.name,
        description: data.description || null,
        image: data.image || null,
        sortOrder: data.sortOrder || 0,
        colors: data.colors || [],
        isActive: true
      }
    })
    
    revalidatePath('/admin/themes')
    revalidatePath('/')
    return themeStyle
  } catch (error) {
    console.error('Error creating theme style:', error)
    throw new Error('Failed to create theme style')
  }
}

// Update theme style
export async function updateThemeStyle(
  id: string,
  data: {
    name?: string
    description?: string
    image?: string
    isActive?: boolean
    sortOrder?: number
    colors?: string[]
  }
): Promise<ThemeStyle> {
  try {
    const themeStyle = await prisma.themeStyle.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.colors !== undefined && { colors: data.colors })
      }
    })
    
    revalidatePath('/admin/themes')
    revalidatePath('/')
    return themeStyle
  } catch (error) {
    console.error('Error updating theme style:', error)
    throw new Error('Failed to update theme style')
  }
}

// Delete theme style
export async function deleteThemeStyle(id: string): Promise<void> {
  try {
    await prisma.themeStyle.delete({
      where: { id }
    })
    
    revalidatePath('/admin/themes')
  } catch (error) {
    console.error('Error deleting theme style:', error)
    throw new Error('Failed to delete theme style')
  }
}

// Assign product to event type and theme combination
export async function assignProductToEventTheme(
  productId: string,
  eventTypeId: string,
  themeStyleId: string
): Promise<ProductEventTheme> {
  const data = { productId, eventTypeId, themeStyleId }
  try {
    // Check if assignment already exists
    const existing = await prisma.productEventTheme.findFirst({
      where: {
        productId: data.productId,
        eventTypeId: data.eventTypeId,
        themeStyleId: data.themeStyleId
      }
    })
    
    if (existing) {
      throw new Error('Product is already assigned to this event type and theme combination')
    }
    
    const assignment = await prisma.productEventTheme.create({
      data: {
        productId: data.productId,
        eventTypeId: data.eventTypeId,
        themeStyleId: data.themeStyleId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              select: {
                url: true,
                alt: true
              },
              orderBy: {
                sortOrder: 'asc'
              },
              take: 1
            }
          }
        },
        eventType: {
          select: {
            id: true,
            name: true
          }
        },
        themeStyle: {
           select: {
             id: true,
             name: true,
             description: true,
             image: true,
             isActive: true,
             sortOrder: true,
             createdAt: true,
             updatedAt: true
           }
         }
      }
    })
    
    const normalized = {
      ...assignment,
      product: {
        ...assignment.product,
        price: typeof (assignment.product as any).price === 'object'
          ? parseFloat((assignment.product as any).price.toString())
          : (assignment.product as any).price
      }
    } as unknown as ProductEventTheme
    
    revalidatePath('/admin/products')
    revalidatePath('/admin/event-themes')
    return normalized
  } catch (error) {
    console.error('Error assigning product to event theme:', error)
    throw new Error('Failed to assign product to event theme')
  }
}

// Remove product from event type and theme combination
export async function removeProductFromEventTheme(
  productId: string,
  eventTypeId: string,
  themeStyleId: string
): Promise<void> {
  try {
    await prisma.productEventTheme.deleteMany({
      where: {
        productId,
        eventTypeId,
        themeStyleId
      }
    })
    
    revalidatePath('/admin/products')
    revalidatePath('/admin/event-themes')
  } catch (error) {
    console.error('Error removing product from event theme:', error)
    throw new Error('Failed to remove product from event theme')
  }
}

// Fetch event theme assignments (alias for fetchProductEventThemeAssignments)
export async function fetchEventThemeAssignments(): Promise<ProductEventTheme[]> {
  return fetchProductEventThemeAssignments()
}

// Get all product-event-theme assignments for admin management
export async function fetchProductEventThemeAssignments(): Promise<ProductEventTheme[]> {
  try {
    const assignments = await prisma.productEventTheme.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              select: {
                url: true,
                alt: true
              },
              orderBy: {
                sortOrder: 'asc'
              },
              take: 1
            }
          }
        },
        eventType: {
          select: {
            id: true,
            name: true
          }
        },
        themeStyle: true
      },
      orderBy: [
        { eventType: { name: 'asc' } },
        { themeStyle: { name: 'asc' } },
        { product: { name: 'asc' } }
      ]
    })
    
    // Convert Decimal prices to numbers
    return assignments.map(assignment => ({
      ...assignment,
      product: {
        ...assignment.product,
        price: typeof assignment.product.price === 'object' 
          ? parseFloat(assignment.product.price.toString()) 
          : assignment.product.price
      }
    }))
  } catch (error) {
    console.error('Error fetching product event theme assignments:', error)
    throw new Error('Failed to fetch product event theme assignments')
  }
}

