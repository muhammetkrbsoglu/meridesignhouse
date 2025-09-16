'use client';

import { useState, useEffect } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getUserOrders, getOrderByNumber, cancelOrder, type Order } from '@/lib/actions/orders';
import { supabase } from '@/lib/supabase-browser';
import { Loader2, Package, Search, Eye, X, Truck, CheckCircle, Clock, XCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getWhatsAppHref } from '@/lib/whatsapp-utils';
import { SUPPORT_WHATSAPP_PHONE } from '@/lib/constants';

const statusConfig = {
  PENDING: {
    label: 'Onay Bekliyor',
    color: 'bg-amber-100 text-amber-800',
    icon: Clock
  },
  CONFIRMED: {
    label: 'Onaylandı',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle
  },
  PROCESSING: {
    label: 'İşleniyor',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  READY_TO_SHIP: {
    label: 'Kargoya Hazır',
    color: 'bg-indigo-100 text-indigo-800',
    icon: Package
  },
  SHIPPED: {
    label: 'Kargoda',
    color: 'bg-blue-100 text-blue-800',
    icon: Truck
  },
  DELIVERED: {
    label: 'Teslim Edildi',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'İptal Edildi',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  REFUNDED: {
    label: 'İade Edildi',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Order | null>(null);
  const [searching, setSearching] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    let channel: any;
    const init = async () => {
      await loadOrders();
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id;
        channel = supabase
          .channel('orders-user')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: uid ? `userId=eq.${uid}` : undefined as any }, (payload) => {
            setOrders((prev) => prev.map((o) => (o.id === (payload.new as any).id ? { ...o, ...payload.new } : o)));
          })
          .subscribe();
      } catch {}
    };
    init();
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    try {
      const userOrders = await getUserOrders();
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Siparişler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Lütfen sipariş numarası girin');
      return;
    }

    setSearching(true);
    try {
      const order = await getOrderByNumber(searchQuery.trim());
      if (order) {
        setSearchResult(order);
        toast.success('Sipariş bulundu');
      } else {
        setSearchResult(null);
        toast.error('Sipariş bulunamadı');
      }
    } catch (error) {
      console.error('Error searching order:', error);
      toast.error('Sipariş aranırken hata oluştu');
    } finally {
      setSearching(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancelling(orderId);
    try {
      const result = await cancelOrder(orderId);
      if (result.success) {
        toast.success('Sipariş başarıyla iptal edildi');
        loadOrders(); // Refresh orders
      } else {
        toast.error(result.error || 'Sipariş iptal edilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setCancelling(null);
    }
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const [openSupport, setOpenSupport] = useState(false);
    const status = statusConfig[order.status];
    const StatusIcon = status.icon;

    const buildSupportMessage = (reason: string) => {
      const lines = [
        'Merhaba, siparişim hakkında destek istiyorum.',
        `Konu: ${reason}`,
        `Sipariş No: ${order.orderNumber}`,
        `Tarih: ${format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}`,
        `Toplam: ₺${order.totalAmount?.toLocaleString('tr-TR') || '0'}`,
        `Müşteri Adı: ${order.customerName || '-'}`,
        `Müşteri Telefon: ${order.customerPhone || '-'}`,
      ];
      return lines.join('\n');
    };

    return (
      <Card key={order.id} className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Sipariş #{order.orderNumber}</CardTitle>
              <p className="text-sm text-gray-600">
                {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
              </p>
            </div>
            <div className="flex items-center space-x-2 relative">
              <Badge className={status.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setOpenSupport((s) => !s)}>
                <MessageCircle className="mr-1 h-4 w-4" />
                Soru Sor
              </Button>
              {openSupport && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border rounded-md shadow-lg z-10 p-1">
                  {['Kargo durumunu sormak istiyorum','Sipariş sürecinde değişiklik talebi','Fatura/Adres ile ilgili soru','Ürün hakkında soru','Diğer'].map((label) => (
                    <a
                      key={label}
                      href={getWhatsAppHref(SUPPORT_WHATSAPP_PHONE, buildSupportMessage(label))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setOpenSupport(false)}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              )}
              <Link href={`/orders/${order.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="mr-1 h-4 w-4" />
                  Detay
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Order Items */}
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {item.product.product_images && item.product.product_images.length > 0 ? (
                      <Image
                        src={item.product.product_images[0]?.url || '/placeholder-product.svg'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-gray-600">
                      {item.quantity} adet × ₺{item.price.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-sm text-gray-600">
                  +{order.items.length - 3} ürün daha
                </p>
              )}
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  {order.items.length} ürün
                </p>
                {order.trackingNumber && (
                  <p className="text-sm text-gray-600">
                    Kargo Takip: <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                )}
                {order.estimatedDelivery && (
                  <p className="text-sm text-gray-600">
                    Tahmini Teslimat: {format(new Date(order.estimatedDelivery), 'dd MMMM yyyy', { locale: tr })}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  ₺{order.totalAmount?.toLocaleString('tr-TR') || '0'}
                </p>
                {order.status === 'PROCESSING' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelling === order.id}
                    className="mt-2"
                  >
                    {cancelling === order.id ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        İptal Ediliyor
                      </>
                    ) : (
                      <>
                        <X className="mr-1 h-3 w-3" />
                        İptal Et
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Siparişlerim</h1>
          <p className="text-gray-600">Sipariş geçmişinizi görüntüleyin ve takip edin</p>
        </div>

        {/* Order Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Sipariş Sorgula
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="orderSearch">Sipariş Numarası</Label>
                <Input
                  id="orderSearch"
                  placeholder="ORD-20240101-123456"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {searchResult && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Arama Sonucu:</h3>
                <OrderCard order={searchResult} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Sipariş Geçmişi</h2>
          
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz siparişiniz yok</h3>
                <p className="text-gray-600 mb-6">İlk siparişinizi vermek için alışverişe başlayın</p>
                <Link href="/products">
                  <Button>
                    Alışverişe Başla
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </CustomerLayout>
  );
}