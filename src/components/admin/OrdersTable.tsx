'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, Filter, Package, Truck, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { updateOrderStatus, deleteOrderAction } from '@/lib/actions/orders';
import Link from 'next/link';
import { Order } from '@/lib/actions/orders';
import { getWhatsAppHref } from '@/lib/whatsapp-utils';
import { supabase } from '@/lib/supabase-browser';

interface OrdersTableProps {
  orders: Order[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800';
    case 'SHIPPED':
      return 'bg-purple-100 text-purple-800';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PROCESSING':
      return <Package className="h-4 w-4" />;
    case 'SHIPPED':
      return <Truck className="h-4 w-4" />;
    case 'DELIVERED':
      return <CheckCircle className="h-4 w-4" />;
    case 'CANCELLED':
    case 'REFUNDED':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'PROCESSING':
      return 'İşleniyor';
    case 'SHIPPED':
      return 'Kargoda';
    case 'DELIVERED':
      return 'Teslim Edildi';
    case 'CANCELLED':
      return 'İptal Edildi';
    case 'REFUNDED':
      return 'İade Edildi';
    default:
      return status;
  }
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [liveOrders, setLiveOrders] = useState<Order[]>(orders);

  useEffect(() => {
    setLiveOrders(orders);
  }, [orders]);

  useEffect(() => {
    const channel = supabase
      .channel('orders-admin')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setLiveOrders((prev) => prev.map((o) => (o.id === (payload.new as any).id ? { ...o, ...payload.new } as Order : o)));
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Filter orders
  const filteredOrders = liveOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus as Order['status']);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Sipariş durumu güncellenirken hata:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Sipariş no, müşteri adı veya e-posta ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="PROCESSING">İşleniyor</SelectItem>
            <SelectItem value="SHIPPED">Kargoda</SelectItem>
            <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
            <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
            <SelectItem value="REFUNDED">İade Edildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Sipariş No</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Müşteri</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Durum</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Ürün Sayısı</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Toplam</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Tarih</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{order.orderNumber}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{order.customerName || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{order.customerEmail || 'N/A'}</div>
                </td>
                <td className="py-3 px-4">
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{getStatusText(order.status)}</span>
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-900">{order.items?.length || 0} ürün</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900">
                    {Number(order.totalAmount || 0).toLocaleString('tr-TR')} ₺
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-500">
                    {(typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2 items-center">
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Detay
                      </Button>
                    </Link>
                    {order.customerPhone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const href = getWhatsAppHref(order.customerPhone!, `Merhaba ${order.customerName || ''},\n\nSipariş No: ${order.orderNumber}\n`);
                          window.open(href, '_blank');
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                    {order.status === 'PROCESSING' && (
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusUpdate(order.id, value)}
                        disabled={isUpdating === order.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROCESSING">İşleniyor</SelectItem>
                          <SelectItem value="SHIPPED">Kargola</SelectItem>
                          <SelectItem value="CANCELLED">İptal Et</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {order.status === 'SHIPPED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                        disabled={isUpdating === order.id}
                      >
                        Teslim Et
                      </Button>
                    )}

                    {/* Delete order */}
                    <form action={deleteOrderAction} onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                      if (!confirm('Bu siparişi silmek istediğinize emin misiniz? İşlem geri alınamaz.')) {
                        e.preventDefault();
                      }
                    }}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <Button variant="destructive" size="sm">Sil</Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Filtrelere uygun sipariş bulunamadı.' 
              : 'Henüz sipariş bulunmuyor.'
            }
          </div>
        )}
      </div>
    </div>
  );
}
