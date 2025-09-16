import { Card, CardContent } from '@/components/ui/card'
import { 
  Package, 
  FolderTree, 
  Users, 
  TrendingUp,
  Shield,
  ShoppingCart,
  MessageSquare,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    products: { total: number; active: number; recent: number };
    categories: { total: number; active: number };
    users: { total: number; admin: number; regular: number; recent: number };
    orders: { total: number; recent: number; pending: number; completed: number; revenue: number };
    messages: { total: number; unread: number; recent: number; replied: number };
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statsData = [
    {
      name: 'Siparişler',
      value: stats.orders.total.toString(),
      icon: ShoppingCart,
      change: `${stats.orders.pending} bekleyen`,
      changeType: stats.orders.pending > 0 ? 'warning' as const : 'positive' as const,
      description: `${stats.orders.completed} tamamlanan`,
      color: 'text-blue-600',
    },
    {
      name: 'Mesajlar',
      value: stats.messages.total.toString(),
      icon: MessageSquare,
      change: `${stats.messages.unread} okunmamış`,
      changeType: stats.messages.unread > 0 ? 'warning' as const : 'positive' as const,
      description: `${stats.messages.replied} yanıtlanan`,
      color: 'text-green-600',
    },
    {
      name: 'Toplam Gelir',
      value: `₺${stats.orders.revenue.toLocaleString('tr-TR')}`,
      icon: DollarSign,
      change: `+${stats.orders.recent} yeni sipariş`,
      changeType: 'positive' as const,
      description: 'Tamamlanan siparişlerden',
      color: 'text-emerald-600',
    },
    {
      name: 'Toplam Kullanıcı',
      value: stats.users.total.toString(),
      icon: Users,
      change: `+${stats.users.recent} yeni`,
      changeType: 'positive' as const,
      description: `${stats.users.admin} admin, ${stats.users.regular} normal`,
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
                {stat.changeType === 'warning' && (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                {stat.changeType === 'positive' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="mt-4">
                <div className={`flex items-center text-sm ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600' 
                    : stat.changeType === 'warning'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }`}>
                  {stat.changeType === 'positive' && (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  )}
                  {stat.changeType === 'warning' && (
                    <Clock className="h-4 w-4 mr-1" />
                  )}
                  <span className="font-medium">{stat.change}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
