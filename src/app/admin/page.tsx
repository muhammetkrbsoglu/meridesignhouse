import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardStats, getRecentActivity } from '@/lib/actions/dashboard'
import { Suspense } from 'react'
import { DashboardStats } from '@/components/admin/DashboardStats'
import Link from 'next/link'
import { 
  ShoppingCart, 
  MessageSquare, 
  Package, 
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// Loading component
function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="ml-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // Fetch all statistics and recent activity
  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity()
  ])
  return (
    <AdminGuard fallback={<DashboardLoading />}> 
      <AdminLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Meri Design House yönetim paneline hoş geldiniz
            </p>
          </div>

          {/* Stats Grid */}
          <Suspense fallback={<DashboardLoading />}>
            <DashboardStats stats={stats} />
          </Suspense>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
                <CardDescription>
                  Sistemdeki son değişiklikler ve güncellemeler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <Link key={activity.id} href={activity.href}>
                        <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0">
                            {activity.type === 'order' && <ShoppingCart className="h-4 w-4 text-blue-500" />}
                            {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-green-500" />}
                            {activity.type === 'product' && <Package className="h-4 w-4 text-purple-500" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-600">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.time).toLocaleString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Henüz aktivite bulunmuyor</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
                <CardDescription>
                  Sık kullanılan yönetim işlemleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/admin/orders">
                    <div className="rounded-lg border border-gray-200 p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ShoppingCart className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Siparişler</h4>
                            <p className="text-xs text-gray-500">
                              {stats.orders.pending > 0 ? `${stats.orders.pending} bekleyen sipariş` : 'Tüm siparişleri görüntüle'}
                            </p>
                          </div>
                        </div>
                        {stats.orders.pending > 0 && (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  </Link>

                  <Link href="/admin/messages">
                    <div className="rounded-lg border border-gray-200 p-4 hover:bg-green-50 hover:border-green-300 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Mesajlar</h4>
                            <p className="text-xs text-gray-500">
                              {stats.messages.unread > 0 ? `${stats.messages.unread} okunmamış mesaj` : 'Tüm mesajları görüntüle'}
                            </p>
                          </div>
                        </div>
                        {stats.messages.unread > 0 && (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  </Link>

                  <Link href="/admin/products/new">
                    <div className="rounded-lg border border-gray-200 p-4 hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Plus className="h-5 w-5 text-purple-600" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Ürün Ekle</h4>
                          <p className="text-xs text-gray-500">
                            Yeni ürün ekle
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/admin/categories">
                    <div className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-gray-600" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Kategoriler</h4>
                          <p className="text-xs text-gray-500">
                            Kategori yönetimi
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}

export const metadata = {
  title: 'Dashboard - Admin Panel',
  description: 'Yönetim paneli ana sayfası',
}