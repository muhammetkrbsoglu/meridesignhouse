import { getSupabaseAdmin } from '@/lib/supabase'
import { unstable_cache } from 'next/cache'

export const getDashboardStats = unstable_cache(
  async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const supabase = getSupabaseAdmin()
    
    // Optimize: Sadece gerekli verileri al
    const [
      productsResult,
      categoriesResult,
      usersResult,
      ordersResult,
      messagesResult,
      // Toplam sayılar için ayrı sorgular
      totalProductsResult,
      totalCategoriesResult,
      totalUsersResult,
      totalOrdersResult,
      totalMessagesResult
    ] = await Promise.all([
      // Products - sadece son 30 günün verileri
      supabase
        .from('products')
        .select('isActive', { count: 'exact' })
        .gte('createdAt', thirtyDaysAgo.toISOString()),
      
      // Categories - sadece aktif durumu
      supabase
        .from('categories')
        .select('isActive', { count: 'exact' }),
      
      // Users - sadece son 30 günün verileri
      supabase
        .from('users')
        .select('role', { count: 'exact' })
        .gte('createdAt', thirtyDaysAgo.toISOString()),
      
      // Orders - sadece son 30 günün verileri
      supabase
        .from('orders')
        .select('status, totalAmount', { count: 'exact' })
        .gte('createdAt', thirtyDaysAgo.toISOString()),
      
      // Messages - sadece son 7 günün verileri
      supabase
        .from('messages')
        .select('status', { count: 'exact' })
        .gte('createdAt', sevenDaysAgo.toISOString()),
      
      // Toplam sayılar
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true })
    ])

    // Process data efficiently
    const products = productsResult.data || []
    const categories = categoriesResult.data || []
    const users = usersResult.data || []
    const orders = ordersResult.data || []
    const messages = messagesResult.data || []

    // Calculate stats from fetched data
    const totalProducts = totalProductsResult.count || 0
    const activeProducts = products.filter(p => p.isActive).length
    const recentProducts = products.length

    const totalCategories = totalCategoriesResult.count || 0
    const activeCategories = categories.filter(c => c.isActive).length

    const totalUsers = totalUsersResult.count || 0
    const adminUsers = users.filter(u => u.role === 'ADMIN').length
    const recentUsers = users.length

    const totalOrders = totalOrdersResult.count || 0
    const recentOrders = orders.length
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length
    const completedOrders = orders.filter(o => ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length
    const totalRevenue = orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)

    const totalMessages = totalMessagesResult.count || 0
    const unreadMessages = messages.filter(m => m.status === 'UNREAD').length
    const recentMessages = messages.length
    const repliedMessages = messages.filter(m => m.status === 'REPLIED').length

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
  { revalidate: 60 } // 1 dakika cache - daha sık güncelleme
)

// Son aktiviteleri getir - optimize edildi
export const getRecentActivity = unstable_cache(
  async () => {
    try {
      const supabase = getSupabaseAdmin()
      
      // Tek sorgu ile son aktiviteleri al - performans optimizasyonu
      const [recentOrders, recentMessages, recentProducts] = await Promise.all([
        // Son siparişler - sadece gerekli alanlar
        supabase
          .from('orders')
          .select('id, orderNumber, status, customerName, totalAmount, createdAt')
          .order('createdAt', { ascending: false })
          .limit(3),
        
        // Son mesajlar - sadece gerekli alanlar
        supabase
          .from('messages')
          .select('id, name, subject, status, createdAt')
          .order('createdAt', { ascending: false })
          .limit(3),
        
        // Son ürünler - sadece gerekli alanlar
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
  { revalidate: 60 } // 1 dakika cache - daha sık güncelleme
)

