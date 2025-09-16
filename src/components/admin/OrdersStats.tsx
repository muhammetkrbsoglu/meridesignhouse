import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, CheckCircle, XCircle, RefreshCw, TrendingUp } from 'lucide-react';

interface OrdersStatsProps {
  totalOrders: number;
  processingOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export function OrdersStats({
  totalOrders,
  processingOrders,
  pendingOrders: _pendingOrders,
  shippedOrders,
  deliveredOrders,
  cancelledOrders,
  totalRevenue,
  monthlyRevenue
}: OrdersStatsProps) {
  const stats = [
    {
      title: 'Toplam Sipariş',
      value: totalOrders,
      icon: Package,
      description: 'Tüm zamanlar',
      color: 'text-blue-600'
    },
    {
      title: 'İşlemde',
      value: processingOrders,
      icon: RefreshCw,
      description: 'Bekleyen siparişler',
      color: 'text-orange-600'
    },
    {
      title: 'Kargoda',
      value: shippedOrders,
      icon: Truck,
      description: 'Yolda olan siparişler',
      color: 'text-purple-600'
    },
    {
      title: 'Teslim Edildi',
      value: deliveredOrders,
      icon: CheckCircle,
      description: 'Başarıyla teslim',
      color: 'text-green-600'
    },
    {
      title: 'İptal/İade',
      value: cancelledOrders,
      icon: XCircle,
      description: 'İptal edilen siparişler',
      color: 'text-red-600'
    },
    {
      title: 'Toplam Gelir',
      value: `${totalRevenue.toLocaleString('tr-TR')} ₺`,
      icon: TrendingUp,
      description: `Bu ay: ${monthlyRevenue.toLocaleString('tr-TR')} ₺`,
      color: 'text-emerald-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof stat.value === 'number' ? stat.value.toLocaleString('tr-TR') : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}