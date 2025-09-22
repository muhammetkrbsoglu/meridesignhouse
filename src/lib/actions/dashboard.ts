import { getSupabaseAdmin } from '@/lib/supabase'
import { unstable_cache } from 'next/cache'

export const getDashboardStats = unstable_cache(
  async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const supabase = getSupabaseAdmin()
    
    // Products - Supabase queries
    const [
      { count: totalProducts },
      { count: activeProducts },
      { count: recentProducts }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('products').select('*', { count: 'exact', head: true }).gte('createdAt', thirtyDaysAgo.toISOString())
    ])
    
    // Categories - Supabase queries
    const [
      { count: totalCategories },
      { count: activeCategories }
    ] = await Promise.all([
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }).eq('isActive', true)
    ])
    
    // Users - Supabase queries
    const [
      { count: totalUsers },
      { count: adminUsers },
      { count: recentUsers }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN'),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('createdAt', thirtyDaysAgo.toISOString())
    ])
    
    // Orders - Supabase queries
    const [
      { count: totalOrders },
      { count: recentOrders },
      { count: pendingOrders },
      { count: completedOrders },
      { data: revenueData }
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('createdAt', thirtyDaysAgo.toISOString()),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED']),
      supabase.from('orders').select('totalAmount').eq('status', 'DELIVERED')
    ])
    
    // Messages - Supabase queries
    const [
      { count: totalMessages },
      { count: unreadMessages },
      { count: recentMessages },
      { count: repliedMessages }
    ] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'UNREAD'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('createdAt', sevenDaysAgo.toISOString()),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'REPLIED')
    ])

    // Calculate revenue from delivered orders
    const totalRevenue = revenueData?.reduce((sum, order) => {
      const amount = Number(order.totalAmount) || 0
      return sum + amount
    }, 0) || 0

    return {
      products: {
        total: totalProducts || 0,
        active: activeProducts || 0,
        recent: recentProducts || 0
      },
      categories: {
        total: totalCategories || 0,
        active: activeCategories || 0
      },
      users: {
        total: totalUsers || 0,
        admin: adminUsers || 0,
        regular: (totalUsers || 0) - (adminUsers || 0),
        recent: recentUsers || 0
      },
      orders: {
        total: totalOrders || 0,
        recent: recentOrders || 0,
        pending: pendingOrders || 0,
        completed: completedOrders || 0,
        revenue: totalRevenue
      },
      messages: {
        total: totalMessages || 0,
        unread: unreadMessages || 0,
        recent: recentMessages || 0,
        replied: repliedMessages || 0
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

// Son aktiviteleri getir - Supabase ile optimize edildi
export const getRecentActivity = unstable_cache(
  async () => {
    try {
      const supabase = getSupabaseAdmin()
      
      // Tek sorgu ile son aktiviteleri al - performans optimizasyonu
      const [recentOrders, recentMessages, recentProducts] = await Promise.all([
        // Son siparişler - limit azaltıldı
        supabase
          .from('orders')
          .select('id, orderNumber, status, customerName, totalAmount, createdAt')
          .order('createdAt', { ascending: false })
          .limit(3),
        
        // Son mesajlar - limit azaltıldı
        supabase
          .from('messages')
          .select('id, name, subject, status, createdAt')
          .order('createdAt', { ascending: false })
          .limit(3),
        
        // Son ürünler - limit azaltıldı
        supabase
          .from('products')
          .select('id, name, isActive, createdAt')
          .order('createdAt', { ascending: false })
          .limit(2)
      ])

      const activities: Array<{ id: string; type: string; title: string; description: string; amount?: number; status?: string; time: Date; href: string }> = []

      // Sipariş aktiviteleri
      recentOrders.data?.forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: 'Yeni Sipariş',
          description: `${order.customerName} - ${order.orderNumber}`,
          amount: Number(order.totalAmount) || 0,
          status: order.status,
          time: new Date(order.createdAt),
          href: `/admin/orders/${order.id}`
        })
      })

      // Mesaj aktiviteleri
      recentMessages.data?.forEach(message => {
        activities.push({
          id: `message-${message.id}`,
          type: 'message',
          title: message.status === 'UNREAD' ? 'Yeni Mesaj' : 'Mesaj Yanıtlandı',
          description: `${message.name} - ${message.subject}`,
          status: message.status,
          time: new Date(message.createdAt),
          href: `/admin/messages/${message.id}`
        })
      })

      // Ürün aktiviteleri
      recentProducts.data?.forEach(product => {
        activities.push({
          id: `product-${product.id}`,
          type: 'product',
          title: 'Yeni Ürün',
          description: product.name,
          status: product.isActive ? 'active' : 'inactive',
          time: new Date(product.createdAt),
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

