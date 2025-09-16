'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  CreditCard,
  User,
  Phone
} from 'lucide-react';
import { OrderTimeline } from '@/components/admin/OrderTimeline';
import { supabase } from '@/lib/supabase-browser';
import Image from 'next/image';
import { WhatsAppTemplateSelector } from '@/components/admin/WhatsAppTemplateSelector';
import { 
  getOrderById,
  updateOrderStatusAction,
  updatePaymentStatusAction,
  saveAdminNotesAction,
  deleteOrderAction,
  Order,
  OrderItem
} from '@/lib/actions/orders';
import { createShipmentAction } from '@/lib/actions/shipping';

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800';
    case 'READY_TO_SHIP':
      return 'bg-indigo-100 text-indigo-800';
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
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />;
    case 'CONFIRMED':
      return <CheckCircle className="h-4 w-4" />;
    case 'PROCESSING':
      return <Package className="h-4 w-4" />;
    case 'READY_TO_SHIP':
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
}

function getStatusText(status: string) {
  switch (status) {
    case 'PENDING':
      return 'Onay Sürecinde';
    case 'CONFIRMED':
      return 'Onaylandı';
    case 'PROCESSING':
      return 'İşleniyor';
    case 'READY_TO_SHIP':
      return 'Kargoya Hazır';
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
}

function getNextStatusOptions(current: string): { value: string; label: string }[] {
  switch (current) {
    case 'PENDING':
      return [
        { value: 'CONFIRMED', label: 'Onayla' },
        { value: 'CANCELLED', label: 'İptal Et' }
      ];
    case 'CONFIRMED':
      return [
        { value: 'PROCESSING', label: 'İşleme Al' },
        { value: 'CANCELLED', label: 'İptal Et' }
      ];
    case 'PROCESSING':
      return [
        { value: 'READY_TO_SHIP', label: 'Kargoya Hazır' },
        { value: 'CANCELLED', label: 'İptal Et' }
      ];
    case 'READY_TO_SHIP':
      return [
        { value: 'SHIPPED', label: 'Kargoya Ver' }
      ];
    case 'SHIPPED':
      return [
        { value: 'DELIVERED', label: 'Teslim Edildi' }
      ];
    default:
      return [];
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPaymentStatusText(status: string) {
  switch (status) {
    case 'PAID':
      return 'Ödendi';
    case 'PENDING':
      return 'Beklemede';
    case 'FAILED':
      return 'Başarısız';
    case 'REFUNDED':
      return 'İade Edildi';
    default:
      return status;
  }
}

function LoadingOrderDetail() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
      } catch (_error) {
        console.error('Error loading order:', _error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
    const channel = supabase
      .channel('orders-admin-detail')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
        setOrder((prev) => (prev ? { ...prev, ...(payload.new as any) } : prev));
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [orderId]);
  
  if (loading) {
    return <LoadingOrderDetail />;
  }
  
  if (!order) {
    return <div className="p-4 text-sm text-muted-foreground">Sipariş bulunamadı.</div>;
  }

  const estimateOnly = typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SHIPPING_ESTIMATE_ONLY || 'true').toLowerCase() !== 'false';
  const hasShipment = Boolean((order as any).shipmentId || (order as any).shipment_id);

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    try {
      await updateOrderStatusAction(orderId, newStatus);
      const updatedOrder = await getOrderById(orderId);
      setOrder(updatedOrder);
    } catch (_error) {
      console.error('Error updating status:', _error);
    }
  };

  const handlePaymentStatusUpdate = async (newStatus: Order['paymentStatus']) => {
    try {
      await updatePaymentStatusAction(orderId, newStatus);
      const updatedOrder = await getOrderById(orderId);
      setOrder(updatedOrder);
    } catch (_error) {
      console.error('Error updating payment status:', _error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sipariş #{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(order.status)}>
            {getStatusIcon(order.status)}
            <span className="ml-1">{getStatusText(order.status)}</span>
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Sipariş Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sipariş Numarası:</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Durum:</span>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{getStatusText(order.status)}</span>
                </Badge>
                {getNextStatusOptions(order.status).length > 0 && (
                  <Select onValueChange={(value) => handleStatusUpdate(value as Order['status'])}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Durumu Güncelle" />
                    </SelectTrigger>
                    <SelectContent>
                      {getNextStatusOptions(order.status).map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Toplam Ürün:</span>
              <span className="font-medium">{order.items?.length || 0} ürün</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Toplam Tutar:</span>
              <span className="font-bold text-lg">{Number(order.totalAmount || 0).toLocaleString('tr-TR')} ₺</span>
            </div>
            {order.trackingNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kargo Takip No:</span>
                <span className="font-medium">{order.trackingNumber}</span>
              </div>
            )}

            {/* Sipariş Ürünleri (Birleştirilmiş) */}
            <div className="border-t pt-3 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Sipariş Ürünleri</span>
                <Badge variant="secondary">{order.items?.length || 0} ürün</Badge>
              </div>
              <div className="space-y-3">
                {order.items?.map((item: OrderItem, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {item.product?.product_images && item.product.product_images.length > 0 ? (
                          <Image
                            src={item.product.product_images[0]?.url || '/placeholder-product.svg'}
                            alt={item.product?.name || 'Ürün görseli'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{item.product?.name || `Ürün #${item.productId}`}</h4>
                        <p className="text-xs text-muted-foreground">Adet: {item.quantity} • Birim: {item.price.toLocaleString('tr-TR')} ₺</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{(item.quantity * item.price).toLocaleString('tr-TR')} ₺</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kargo / Gönderi Yönetimi */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Kargo / Gönderi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kargo Firması</span>
                  <span className="font-medium">{(order as any).carrier || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Servis Kodu</span>
                  <span className="font-medium">{(order as any).serviceCode || (order as any).service_code || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Takip No</span>
                  <span className="font-medium">{(order as any).trackingNumber || (order as any).tracking_number || '-'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Etiket Formatı</span>
                  <span className="font-medium">{(order as any).labelFormat || (order as any).label_format || 'PDF'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Etiket</span>
                  <span className="font-medium">
                    {((order as any).labelUrl || (order as any).label_url) ? (
                      <Link className="text-blue-600 hover:underline" href={(order as any).labelUrl || (order as any).label_url} target="_blank">İndir (PDF)</Link>
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {/* Not: Şimdilik gönderi oluşturma backend entegrasyonu bekliyor */}
              <Button
                variant="default"
                size="sm"
                disabled={estimateOnly || hasShipment}
                onClick={async () => {
                  if (hasShipment) {
                    alert('Bu sipariş için gönderi zaten oluşturulmuş.');
                    return;
                  }
                  const fd = new FormData();
                  fd.set('orderId', orderId);
                  const res = await createShipmentAction(fd);
                  if (!(res as any).ok && (res as any).error === 'estimate_only') {
                    alert('Şu anda sadece tahmini kargo hesaplama etkin. Gönderi oluşturma kapalı.');
                    return;
                  }
                  if ((res as any).ok) {
                    alert('Gönderi oluşturuldu. (mock)');
                    const updatedOrder = await getOrderById(orderId);
                    setOrder(updatedOrder);
                  } else {
                    alert('Gönderi oluşturulamadı.');
                  }
                }}
              >
                Kargoya Ver (Etiket Oluştur)
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!((order as any).labelUrl || (order as any).label_url)}
                onClick={() => {
                  const url = (order as any).labelUrl || (order as any).label_url
                  if (url) window.open(url, '_blank')
                }}
              >
                Etiketi İndir (PDF)
              </Button>
            </div>

            {(estimateOnly || hasShipment) && (
              <div className="mt-2 text-xs text-muted-foreground">
                {estimateOnly && (
                  <div className="rounded-md border p-2 bg-amber-50 border-amber-200 text-amber-900">
                    Şu anda sistem <strong>yalnızca tahmini kargo hesaplama</strong> modunda. Gönderi oluşturma devre dışı.
                  </div>
                )}
                {hasShipment && (
                  <div className="rounded-md border p-2 bg-blue-50 border-blue-200 text-blue-900 mt-2">
                    Bu sipariş için bir gönderi zaten mevcut. Tekrarlı oluşturma engellendi.
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 rounded-md border p-3 text-sm bg-amber-50 border-amber-200">
              <div className="font-medium text-amber-900">Pickup (Kurye) Bilgisi</div>
              <div className="text-amber-800 mt-1">
                Kurye çağırma <strong>manuel</strong> yapılacaktır. Hazır bulundurma saatleri: <strong>14:00–17:00</strong>.
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Teslimat Adresi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* Etiketli ve düzenli bilgi alanları */}
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground min-w-[110px]">Ad Soyad:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
            
            {(() => {
              let addressData: any = {};
              try {
                addressData = typeof order.shippingAddress === 'string'
                  ? JSON.parse(order.shippingAddress)
                  : (order as any).shippingAddress || {};
              } catch {
                addressData = { address: order.shippingAddress };
              }
              return (
                <>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground min-w-[110px]">Adres:</span>
                    <span className="text-foreground leading-relaxed">{addressData.address || ''}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[110px]">İlçe:</span>
                      <span className="text-foreground">{addressData.district || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[110px]">İl:</span>
                      <span className="text-foreground">{addressData.city || order.shippingCity || '-'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[110px]">Posta Kodu:</span>
                      <span className="text-foreground">{addressData.postalCode || order.shippingZip || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[110px]">Ülke:</span>
                      <span className="text-foreground">{addressData.country || order.shippingCountry || '-'}</span>
                    </div>
                  </div>
                </>
              );
            })()}
            {order.customerPhone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground min-w-[110px]">Telefon:</span>
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1">
                  <Phone className="h-4 w-4" />{order.customerPhone}
                </span>
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Ödeme Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ödeme Durumu:</span>
              <div>
                {order.paymentStatus === 'PENDING' ? (
                  <Select defaultValue={order.paymentStatus} onValueChange={(value) => handlePaymentStatusUpdate(value as Order['paymentStatus'])}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Beklemede</SelectItem>
                      <SelectItem value="PAID">Ödendi</SelectItem>
                      <SelectItem value="FAILED">Başarısız</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getPaymentStatusColor(order.paymentStatus || 'PENDING')}>
                    {getPaymentStatusText(order.paymentStatus || 'PENDING')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ödeme Yöntemi:</span>
              <span className="font-medium">{order.paymentMethod || 'Kredi Kartı'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ara Toplam:</span>
              <span className="font-medium">{(order.subtotal || 0).toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Kargo:</span>
              <span className="font-medium">{(order.shippingCost || order.shipping || 0).toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vergi:</span>
              <span className="font-medium">{(order.taxAmount || order.tax || 0).toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-medium">Toplam:</span>
                <span className="font-bold text-lg">{Number(order.totalAmount || 0).toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ayrı ürünler kartı kaldırıldı; ürünler sipariş bilgilerine taşındı */}

      {/* WhatsApp Mesaj Gönder */}
      {order.customerPhone && (
        <WhatsAppTemplateSelector
          orderContext={{
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            status: order.status,
            totalAmount: order.totalAmount,
            trackingNumber: (order as any).trackingNumber,
            estimatedDelivery: (order as any).estimatedDelivery,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            shippingAddressText: (() => {
              try {
                const a = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order as any).shippingAddress;
                return a?.address ? `${a.address} ${a.district || ''} ${a.city || ''} ${a.postalCode || ''} ${a.country || ''}`.trim() : 'Adres bilgisi yok';
              } catch {
                return 'Adres bilgisi yok';
              }
            })(),
            billingAddressText: (() => {
              try {
                const a = typeof order.billingAddress === 'string' ? JSON.parse(order.billingAddress) : (order as any).billingAddress;
                return a?.address ? `${a.address} ${a.district || ''} ${a.city || ''} ${a.postalCode || ''} ${a.country || ''}`.trim() : 'Fatura adresi yok';
              } catch {
                return 'Fatura adresi yok';
              }
            })(),
            createdAt: order.createdAt
          }}
          context="ORDER"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>İç Notlar (Sadece Admin)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!confirm('Bu siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
              return;
            }
            const formData = new FormData();
            formData.append('orderId', orderId);
            await deleteOrderAction(formData);
          }}>
            <Button variant="destructive" size="sm">Siparişi Sil</Button>
          </form>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await saveAdminNotesAction(formData);
          }} className="space-y-3">
            <input type="hidden" name="orderId" value={orderId} />
            <textarea name="admin_notes" defaultValue={(order as any).admin_notes || ''} className="w-full min-h-[120px] border rounded p-2" />
            <Button type="submit" variant="outline">Kaydet</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sipariş Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline order={order} />
        </CardContent>
      </Card>
    </div>
  );
}


