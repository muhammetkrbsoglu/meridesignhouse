import { getSupabaseAdmin } from '@/lib/supabase'
import { unstable_cache } from 'next/cache'
import { prisma } from '../prisma'
import { MessageStatus } from '@prisma/client'

export const getDashboardStats = unstable_cache(
  async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // Optimize with database-level aggregations using Prisma
    const [
      productStats,
      categoryStats,
      userStats,
      orderStats,
      messageStats
    ] = await Promise.all([
      // Products - optimized aggregation
      Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
      ]),
      
      // Categories - optimized aggregation
      Promise.all([
        prisma.category.count(),
        prisma.category.count({ where: { isActive: true } })
      ]),
      
      // Users - optimized aggregation
      Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
      ]),
      
      // Orders - optimized aggregation
      Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ 
          where: { 
            status: { 
              in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] 
            } 
          } 
        }),
        prisma.order.aggregate({
          where: { status: 'DELIVERED' },
          _sum: { totalAmount: true }
        })
      ]),
      
      // Messages - optimized aggregation
      Promise.all([
        prisma.message.count(),
        prisma.message.count({ where: { status: MessageStatus.UNREAD } }),
        prisma.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.message.count({ where: { status: MessageStatus.REPLIED } })
      ])
    ])

    const [totalProducts, activeProducts, recentProducts] = productStats
    const [totalCategories, activeCategories] = categoryStats
    const [totalUsers, adminUsers, recentUsers] = userStats
    const [totalOrders, recentOrders, pendingOrders, completedOrders, revenueAgg] = orderStats
    const [totalMessages, unreadMessages, recentMessages, repliedMessages] = messageStats

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        recent: recentProducts
      },
      categories: {
        total: totalCategories,
        active: activeCategories
      },
      users: {
        total: totalUsers,
        admin: adminUsers,
        regular: totalUsers - adminUsers,
        recent: recentUsers
      },
      orders: {
        total: totalOrders,
        recent: recentOrders,
        pending: pendingOrders,
        completed: completedOrders,
        revenue: Number(revenueAgg._sum.totalAmount) || 0
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
  { revalidate: 300 } // 5 dakika cache - performans için artırıldı
)

// Son aktiviteleri getir - optimize edildi
export const getRecentActivity = unstable_cache(
  async () => {
    try {
      // Tek sorgu ile son aktiviteleri al - performans optimizasyonu
      const [recentOrders, recentMessages, recentProducts] = await Promise.all([
        // Son siparişler - limit azaltıldı
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
          take: 3 // 5'ten 3'e düşürüldü
        }),
        
        // Son mesajlar - limit azaltıldı
        prisma.message.findMany({
          select: {
            id: true,
            name: true,
            subject: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3 // 5'ten 3'e düşürüldü
        }),
        
        // Son ürünler - limit azaltıldı
        prisma.product.findMany({
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 2 // 3'ten 2'ye düşürüldü
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
  { revalidate: 120 } // 2 dakika cache - performans için artırıldı
)

