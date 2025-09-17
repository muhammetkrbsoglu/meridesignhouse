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
import { motion, AnimatePresence } from 'framer-motion';
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback';
import { BlurUpImage, Skeleton } from '@/components/motion/LoadingStates';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

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

  const OrderCard = ({ order, index }: { order: Order; index: number }) => {
    const [openSupport, setOpenSupport] = useState(false);
    const status = statusConfig[order.status];
    const StatusIcon = status.icon;
    const { success, light, medium, error } = useHapticFeedback();

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
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        layout
        className="mb-6"
      >
        <Card className="overflow-hidden border-rose-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                    Sipariş #{order.orderNumber}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </p>
                </motion.div>
              </div>
              <div className="flex items-center space-x-2 relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Badge className={`${status.color} shadow-sm`}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                </motion.div>
                
                <MicroFeedback
                  onClick={() => setOpenSupport((s) => !s)}
                  hapticType="light"
                  hapticMessage="Destek menüsü"
                  className="relative"
                >
                  <Button variant="outline" size="sm">
                    <MessageCircle className="mr-1 h-4 w-4" />
                    Soru Sor
                  </Button>
                </MicroFeedback>
                
                <AnimatePresence>
                  {openSupport && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white border border-rose-200 rounded-lg shadow-xl z-10 p-1"
                    >
                      {['Kargo durumunu sormak istiyorum','Sipariş sürecinde değişiklik talebi','Fatura/Adres ile ilgili soru','Ürün hakkında soru','Diğer'].map((label, idx) => (
                        <motion.a
                          key={label}
                          href={getWhatsAppHref(SUPPORT_WHATSAPP_PHONE, buildSupportMessage(label))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-rose-50 rounded-md transition-colors"
                          onClick={() => {
                            setOpenSupport(false);
                            light('WhatsApp\'a yönlendiriliyor');
                          }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                        >
                          {label}
                        </motion.a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <MicroFeedback
                  onClick={() => {}}
                  hapticType="light"
                  hapticMessage="Sipariş detayı"
                >
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-4 w-4" />
                      Detay
                    </Button>
                  </Link>
                </MicroFeedback>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {/* Order Items */}
              <div className="space-y-3">
                <AnimatePresence>
                  {order.items.slice(0, 3).map((item, itemIndex) => (
                    <motion.div 
                      key={item.id} 
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: itemIndex * 0.1 }}
                    >
                      <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.product_images && item.product.product_images.length > 0 ? (
                          <BlurUpImage
                            src={item.product.product_images[0]?.url || '/placeholder-product.svg'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-600">
                          {item.quantity} adet × ₺{item.price.toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {order.items.length > 3 && (
                  <motion.p 
                    className="text-sm text-gray-600 text-center py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    +{order.items.length - 3} ürün daha
                  </motion.p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Order Summary */}
              <motion.div 
                className="flex justify-between items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {order.items.length} ürün
                  </p>
                  {order.trackingNumber && (
                    <p className="text-sm text-gray-600">
                      Kargo Takip: <span className="font-mono text-rose-600">{order.trackingNumber}</span>
                    </p>
                  )}
                  {order.estimatedDelivery && (
                    <p className="text-sm text-gray-600">
                      Tahmini Teslimat: {format(new Date(order.estimatedDelivery), 'dd MMMM yyyy', { locale: tr })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <motion.p 
                    className="text-lg font-bold text-rose-600"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    ₺{order.totalAmount?.toLocaleString('tr-TR') || '0'}
                  </motion.p>
                  {order.status === 'PROCESSING' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <MicroFeedback
                        onClick={() => handleCancelOrder(order.id)}
                        hapticType="medium"
                        hapticMessage="Siparişi iptal et"
                        className="mt-2"
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={cancelling === order.id}
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
                      </MicroFeedback>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-[100svh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          </motion.div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-[100svh] bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Siparişlerim
            </h1>
            <p className="text-gray-600">Sipariş geçmişinizi görüntüleyin ve takip edin</p>
          </motion.div>

          {/* Order Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-rose-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-rose-700">
                  <Search className="mr-2 h-5 w-5" />
                  Sipariş Sorgula
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="orderSearch" className="text-gray-700">Sipariş Numarası</Label>
                    <HoverCard
                      shimmer={searching}
                      hapticType="light"
                      hapticMessage="Sipariş numarası girişi"
                      className="mt-1"
                    >
                      <Input
                        id="orderSearch"
                        placeholder="ORD-20240101-123456"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="focus:ring-2 focus:ring-rose-500/40 border-rose-200"
                      />
                    </HoverCard>
                  </div>
                  <div className="flex items-end">
                    <MicroFeedback
                      onClick={handleSearch}
                      hapticType="light"
                      hapticMessage="Sipariş ara"
                    >
                      <Button disabled={searching} className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                        {searching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </MicroFeedback>
                  </div>
                </div>
                
                <AnimatePresence>
                  {searchResult && (
                    <motion.div 
                      className="mt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="font-medium mb-2 text-gray-700">Arama Sonucu:</h3>
                      <OrderCard order={searchResult} index={0} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Orders List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Sipariş Geçmişi</h2>
            
            {orders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border-rose-200/50 shadow-lg">
                  <CardContent className="text-center py-12">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <Package className="mx-auto h-12 w-12 text-rose-400 mb-4" />
                    </motion.div>
                    <motion.h3 
                      className="text-lg font-medium text-gray-900 mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      Henüz siparişiniz yok
                    </motion.h3>
                    <motion.p 
                      className="text-gray-600 mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      İlk siparişinizi vermek için alışverişe başlayın
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <MicroFeedback
                        onClick={() => {}}
                        hapticType="medium"
                        hapticMessage="Alışverişe başla"
                      >
                        <Link href="/products">
                          <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                            Alışverişe Başla
                          </Button>
                        </Link>
                      </MicroFeedback>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <AnimatePresence>
                <div>
                  {orders.map((order, index) => (
                    <OrderCard key={order.id} order={order} index={index} />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
    </CustomerLayout>
  );
}