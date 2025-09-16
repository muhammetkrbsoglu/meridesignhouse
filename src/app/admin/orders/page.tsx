import { Suspense } from 'react';
import { AdminGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { RefreshButton } from '@/components/admin/RefreshButton';
import { getAllOrders, getOrderStatistics } from '@/lib/actions/orders';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { OrdersStats } from '@/components/admin/OrdersStats';

export const metadata = {
  title: 'Siparişler | Admin Panel',
  description: 'Sipariş yönetimi sayfası',
};

function LoadingStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Siparişler Yükleniyor...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function OrdersStatsWrapper() {
  const stats = await getOrderStatistics();
  
  return (
    <OrdersStats
      totalOrders={stats.totalOrders}
      processingOrders={stats.processingOrders}
      pendingOrders={stats.pendingOrders}
      shippedOrders={stats.shippedOrders}
      deliveredOrders={stats.deliveredOrders}
      cancelledOrders={stats.cancelledOrders}
      totalRevenue={stats.totalRevenue}
      monthlyRevenue={stats.monthlyRevenue}
    />
  );
}

async function OrdersTableWrapper() {
  const orders = await getAllOrders();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Siparişler ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <OrdersTable orders={orders} />
      </CardContent>
    </Card>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Siparişler</h1>
              <p className="text-muted-foreground">
                Tüm siparişleri görüntüleyin ve yönetin
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktar
              </Button>
              <RefreshButton />
            </div>
          </div>

          {/* Statistics */}
          <Suspense fallback={<LoadingStats />}>
            <OrdersStatsWrapper />
          </Suspense>

          {/* Orders Table */}
          <Suspense fallback={<LoadingTable />}>
            <OrdersTableWrapper />
          </Suspense>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}