import { getSupabaseAdmin } from '@/lib/supabase'
import { unstable_cache } from 'next/cache'
import { prisma } from '../prisma'
import { MessageStatus } from '@prisma/client'

export const getDashboardStats = unstable_cache(
  async () => {
  try {
    const supabase = getSupabaseAdmin()
    
    // Tüm istatistikleri paralel olarak al
    const [
      productsStats,
      categoriesStats,
      usersStats,
      messagesStats
    ] = await Promise.all([
      // Products
      supabase
        .from('products')
        .select('createdAt, isActive', { count: 'exact' }),
      
      // Categories
      supabase
        .from('categories')
        .select('isActive', { count: 'exact' }),
      
      // Users
      supabase
        .from('users')
        .select('role, createdAt', { count: 'exact' }),
      
      // Messages
      prisma.message.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ])

    // Hesaplamalar
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // Products
    const recentProductsCount = productsStats.data?.filter(p => 
      p.createdAt && new Date(p.createdAt) >= thirtyDaysAgo
    ).length || 0
    
    const activeProductsCount = productsStats.data?.filter(p => 
      p.isActive === true
    ).length || 0
    
    // Categories
    const activeCategoriesCount = categoriesStats.data?.filter(c => 
      c.isActive === true
    ).length || 0
    
    // Users
    const adminUsersCount = usersStats.data?.filter(u => 
      u.role === 'admin'
    ).length || 0
    
    const recentUsersCount = usersStats.data?.filter(u => 
      u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo
    ).length || 0

    // Orders - Prisma'dan doğru veri çek
    const ordersData = await prisma.order.findMany({
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true
      }
    })
    
    const totalOrders = ordersData.length
    const recentOrders = ordersData.filter(o => o.createdAt >= thirtyDaysAgo).length
    const pendingOrders = ordersData.filter(o => o.status === 'PENDING').length
    const completedOrders = ordersData.filter(o => 
      o.status === 'DELIVERED' || o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'SHIPPED'
    ).length
    const totalRevenue = ordersData
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0)

    // Messages
    const totalMessages = messagesStats.length
    const unreadMessages = messagesStats.filter(m => m.status === MessageStatus.UNREAD).length
    const recentMessages = messagesStats.filter(m => m.createdAt >= sevenDaysAgo).length
    const repliedMessages = messagesStats.filter(m => m.status === MessageStatus.REPLIED).length

    return {
      products: {
        total: productsStats.count || 0,
        active: activeProductsCount,
        recent: recentProductsCount
      },
      categories: {
        total: categoriesStats.count || 0,
        active: activeCategoriesCount
      },
      users: {
        total: usersStats.count || 0,
        admin: adminUsersCount,
        regular: (usersStats.count || 0) - adminUsersCount,
        recent: recentUsersCount
      },
      orders: {
        total: totalOrders,
        recent: recentOrders,
        pending: pendingOrders,
        completed: completedOrders,
        revenue: totalRevenue
      },
      messages: {
        total: totalMessages,
        unread: unreadMessages,
        recent: recentMessages,
        replied: repliedMessages
      }
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    return {
      products: { total: 0, active: 0, recent: 0 },
      categories: { total: 0, active: 0 },
      users: { total: 0, admin: 0, regular: 0, recent: 0 },
      orders: { total: 0, recent: 0, pending: 0, completed: 0, revenue: 0 },
      messages: { total: 0, unread: 0, recent: 0, replied: 0 }
    }
  }
},
  ['dashboard-stats'],
  { revalidate: 60 } // 1 dakika cache
)

// Son aktiviteleri getir
export const getRecentActivity = unstable_cache(
  async () => {
    try {
      const [recentOrders, recentMessages, recentProducts] = await Promise.all([
        // Son siparişler
        prisma.order.findMany({
          select: {
            id: true,
            orderNumber: true,
            status: true,
            customerName: true,
            totalAmount: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        
        // Son mesajlar
        prisma.message.findMany({
          select: {
            id: true,
            name: true,
            subject: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        
        // Son ürünler
        prisma.product.findMany({
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        })
      ])

      const activities: Array<{ id: string; type: string; title: string; description: string; amount?: number; status?: string; time: Date; href: string }> = []

      // Sipariş aktiviteleri
      recentOrders.forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: 'Yeni Sipariş',
          description: `${order.customerName} - ${order.orderNumber}`,
          amount: Number(order.totalAmount),
          status: order.status,
          time: order.createdAt,
          href: `/admin/orders/${order.id}`
        })
      })

      // Mesaj aktiviteleri
      recentMessages.forEach(message => {
        activities.push({
          id: `message-${message.id}`,
          type: 'message',
          title: message.status === 'UNREAD' ? 'Yeni Mesaj' : 'Mesaj Yanıtlandı',
          description: `${message.name} - ${message.subject}`,
          status: message.status,
          time: message.createdAt,
          href: `/admin/messages/${message.id}`
        })
      })

      // Ürün aktiviteleri
      recentProducts.forEach(product => {
        activities.push({
          id: `product-${product.id}`,
          type: 'product',
          title: 'Yeni Ürün',
          description: product.name,
          status: product.isActive ? 'active' : 'inactive',
          time: product.createdAt,
          href: `/admin/products/${product.id}`
        })
      })

      // Zaman sırasına göre sırala ve en son 5 aktiviteyi al
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5)

    } catch (error) {
      console.error('Error in getRecentActivity:', error)
      return []
    }
  },
  ['recent-activity'],
  { revalidate: 30 } // 30 saniye cache
)

