'use client';

import { useState, useEffect, useCallback } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { getOrderById, cancelOrder, type Order } from '@/lib/actions/orders';
import { supabase } from '@/lib/supabase-browser';
import { 
  Loader2, Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft, Copy, Check, 
  MapPin, CreditCard, Phone, Calendar, User, ShoppingBag, 
  TrendingUp, MessageCircle
} from 'lucide-react';
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
    color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200',
    icon: Clock,
    description: 'Siparişiniz onay bekliyor',
    progress: 25
  },
  CONFIRMED: {
    label: 'Onaylandı',
    color: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    description: 'Siparişiniz onaylandı',
    progress: 50
  },
  PROCESSING: {
    label: 'İşleniyor',
    color: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200',
    icon: Package,
    description: 'Siparişiniz hazırlanıyor',
    progress: 75
  },
  READY_TO_SHIP: {
    label: 'Kargoya Hazır',
    color: 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border-indigo-200',
    icon: Package,
    description: 'Siparişiniz kargoya hazırlanıyor',
    progress: 85
  },
  SHIPPED: {
    label: 'Kargoda',
    color: 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border-indigo-200',
    icon: Truck,
    description: 'Siparişiniz kargo yolunda',
    progress: 90
  },
  DELIVERED: {
    label: 'Teslim Edildi',
    color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Siparişiniz teslim edildi',
    progress: 100
  },
  CANCELLED: {
    label: 'İptal Edildi',
    color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Sipariş iptal edildi',
    progress: 0
  },
  REFUNDED: {
    label: 'İade Edildi',
    color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200',
    icon: XCircle,
    description: 'Sipariş iade edildi',
    progress: 0
  }
};

const paymentStatusConfig = {
  PENDING: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Ödendi', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Başarısız', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'İade Edildi', color: 'bg-gray-100 text-gray-800' }
};

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const isSuccess = searchParams.get('success') === 'true';
  const orderNumberFromQuery = searchParams.get('orderNumber');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [_cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const orderData = await getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Sipariş yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const setupRealtimeSubscription = useCallback(() => {
    const subscription = supabase
      .channel(`order-updates-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrder(prev => {
            if (!prev) return null;
            const updatedOrder = { ...prev, ...payload.new };
            return updatedOrder;
          });
          toast.success('Sipariş durumu güncellendi!');
        }
      )
      .on('system', {}, () => {})
      .subscribe(() => {});

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      setupRealtimeSubscription();
    }
  }, [orderId, loadOrder, setupRealtimeSubscription]);

  useEffect(() => {
    if (isSuccess && (order?.orderNumber || orderNumberFromQuery)) {
      toast.custom((t) => (
        <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 text-center border border-rose-100">
          <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-3">
            <CheckCircle className="h-7 w-7 text-rose-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Siparişiniz Alındı</h3>
          <p className="text-sm text-gray-600 mt-1">Siparişiniz onay sürecinde. En kısa sürede WhatsApp üzerinden iletişime geçilecektir.</p>
          <div className="mt-4 text-left bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Sipariş Takip Numarası</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-sm">{order?.orderNumber || orderNumberFromQuery}</span>
              <Button size="sm" variant="outline" onClick={async () => {
                await navigator.clipboard.writeText(order?.orderNumber || orderNumberFromQuery || '');
                toast.success('Takip numarası kopyalandı');
              }}>
                Kopyala
              </Button>
            </div>
          </div>
          <div className="mt-5">
            <Button onClick={() => toast.dismiss(t)} className="w-full">Tamam</Button>
          </div>
        </div>
      ), { duration: Infinity, position: 'top-center' });
    }
  }, [isSuccess, order?.orderNumber, orderNumberFromQuery]);

  const _handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const result = await cancelOrder(orderId);
      if (result.success) {
        toast.success('Sipariş başarıyla iptal edildi');
        loadOrder();
      } else {
        toast.error(result.error || 'Sipariş iptal edilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setCancelling(false);
    }
  };

  const copyOrderNumber = async () => {
    if (order) {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast.success('Sipariş numarası kopyalandı');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-rose-600 mx-auto mb-4" />
            <p className="text-gray-600">Sipariş detayları yükleniyor...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Sipariş Bulunamadı</h1>
            <p className="text-gray-600 mb-8 max-w-md">Aradığınız sipariş bulunamadı veya erişim yetkiniz yok.</p>
            <Link href="/orders">
              <Button size="lg" className="bg-rose-600 hover:bg-rose-700">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Siparişlerime Dön
              </Button>
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const status = statusConfig[order.status];
  const paymentStatus = paymentStatusConfig[order.paymentStatus || 'PENDING'];
  const StatusIcon = status.icon;

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Link href="/orders" className="inline-flex items-center text-sm text-gray-600 hover:text-rose-600 transition-colors mb-6 group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Siparişlerime Dön
            </Link>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Sipariş Detayı</h1>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-lg font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">#{order.orderNumber}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyOrderNumber}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Sipariş Durumu</span>
                      <span>{status.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-rose-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${status.progress}%` }}
                      ></div>
                    </div>
                    
                  </div>
                </div>
                
                <div className="text-center lg:text-right relative">
                  <Badge className={`${status.color} px-4 py-2 text-sm font-medium border-2 mb-3`}>
                    <StatusIcon className="mr-2 h-4 w-4" />
                    {status.label}
                  </Badge>
                  <p className="text-sm text-gray-600">{status.description}</p>
                  <SupportMenu order={order} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-8">
              {/* Order Items */}
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100/50">
                  <CardTitle className="flex items-center text-xl">
                    <Package className="mr-3 h-6 w-6 text-rose-600" />
                    Sipariş Ürünleri
                    <Badge variant="secondary" className="ml-auto">
                      {order.items.length} ürün
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="relative w-20 h-20 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                          {item.product.product_images && item.product.product_images.length > 0 ? (
                            <Image
                              src={item.product.product_images[0]?.url || '/placeholder-product.svg'}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.product.slug}`} className="hover:text-rose-600 transition-colors">
                            <h4 className="font-semibold text-gray-900 truncate">{item.product.name}</h4>
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-4 w-4" />
                              {item.quantity} adet
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              ₺{item.price.toLocaleString('tr-TR')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100/50">
                  <CardTitle className="flex items-center text-xl">
                    <MapPin className="mr-3 h-6 w-6 text-blue-600" />
                    Teslimat Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <p className="font-semibold text-gray-900">{order.customerName}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          {(() => {
                            // Parse shipping address if it's a JSON string
                            let addressData;
                            try {
                              addressData = typeof order.shippingAddress === 'string' 
                                ? JSON.parse(order.shippingAddress) 
                                : order.shippingAddress;
                            } catch {
                              addressData = { address: order.shippingAddress };
                            }
                            
                            return (
                              <>
                                <p className="text-gray-900 font-medium">{addressData.address || order.shippingAddress}</p>
                                <p className="text-gray-600">
                                  {addressData.district && `${addressData.district}, `}
                                  {addressData.city || order.shippingCity}
                                  {addressData.postalCode && ` ${addressData.postalCode}`}
                                </p>
                                <p className="text-gray-600">{addressData.country || order.shippingCountry}</p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">{order.customerPhone}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              {order.billingAddress && (
                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50">
                    <CardTitle className="flex items-center text-xl">
                      <CreditCard className="mr-3 h-6 w-6 text-purple-600" />
                      Fatura Adresi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-100">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <p className="font-semibold text-gray-900">{order.customerName}</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            {(() => {
                              // Parse billing address if it's a JSON string
                              let addressData;
                              try {
                                addressData = typeof order.billingAddress === 'string' 
                                  ? JSON.parse(order.billingAddress) 
                                  : order.billingAddress;
                              } catch {
                                addressData = { address: order.billingAddress };
                              }
                              
                              return (
                                <>
                                  <p className="text-gray-900 font-medium">{addressData.address || order.billingAddress}</p>
                                  <p className="text-gray-600">
                                    {addressData.district && `${addressData.district}, `}
                                    {addressData.city || order.billingCity}
                                    {addressData.postalCode && ` ${addressData.postalCode}`}
                                  </p>
                                  <p className="text-gray-600">{addressData.country || order.billingCountry}</p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900">{order.customerPhone}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tracking Information */}
              {(order.trackingNumber || order.estimatedDelivery) && (
                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100/50">
                    <CardTitle className="flex items-center text-xl">
                      <Truck className="mr-3 h-6 w-6 text-indigo-600" />
                      Kargo Bilgileri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {order.trackingNumber && (
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Takip Numarası</Label>
                          <div className="flex items-center gap-3">
                            <code className="font-mono text-sm bg-gray-100 px-3 py-2 rounded-lg flex-1">
                              {order.trackingNumber}
                            </code>
                            <Button size="sm" variant="outline">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {order.estimatedDelivery && (
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Tahmini Teslimat</Label>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-900">
                              {format(typeof order.estimatedDelivery === 'string' ? new Date(order.estimatedDelivery) : order.estimatedDelivery, 'dd MMMM yyyy', { locale: tr })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/50">
                  <CardTitle className="flex items-center text-xl">
                    <TrendingUp className="mr-3 h-6 w-6 text-green-600" />
                    Sipariş Özeti
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ara Toplam</span>
                        <span className="font-medium">₺{order.subtotal?.toLocaleString('tr-TR') || '0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Kargo</span>
                        <span className="font-medium">
                          {order.shipping === 0 ? (
                            <span className="text-green-600 font-semibold">Ücretsiz</span>
                          ) : (
                            `₺${order.shipping?.toLocaleString('tr-TR') || '0'}`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">KDV</span>
                        <span className="font-medium">₺{order.tax?.toLocaleString('tr-TR') || '0'}</span>
                      </div>
                      <Separator className="my-4" />
                      <div className="flex justify-between text-xl font-bold text-gray-900">
                        <span>Toplam</span>
                        <span>₺{order.totalAmount?.toLocaleString('tr-TR') || '0'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50">
                  <CardTitle className="flex items-center text-xl">
                    <CreditCard className="mr-3 h-6 w-6 text-purple-600" />
                    Ödeme Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Ödeme Yöntemi</Label>
                      <p className="text-sm capitalize text-gray-900">
                        {order.paymentMethod?.replace('_', ' ') || 'WhatsApp Onay'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Ödeme Durumu</Label>
                      <div className="flex items-center gap-2">
                        <Badge className={paymentStatus.color}>
                          {paymentStatus.label}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          
                        </span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Sipariş Durumu</Label>
                      <div className="flex items-center gap-2">
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              

              {/* Order Timeline */}
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/50">
                  <CardTitle className="flex items-center text-xl">
                    <Clock className="mr-3 h-6 w-6 text-amber-600" />
                    Sipariş Geçmişi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Sipariş Oluşturuldu */}
                    <div className="flex items-start space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Sipariş Oluşturuldu</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {(() => {
                            const createdDate = typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt;
                            return format(createdDate, 'dd MMMM yyyy, HH:mm', { locale: tr });
                          })()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Sipariş #{order.orderNumber}
                        </p>
                      </div>
                    </div>
                    
                    {/* Durum Güncellemeleri */}
                    {order.status !== 'PENDING' && (
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Durum Güncellendi</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {(() => {
                              const updatedDate = typeof order.updatedAt === 'string' ? new Date(order.updatedAt) : order.updatedAt;
                              return format(updatedDate, 'dd MMMM yyyy, HH:mm', { locale: tr });
                            })()}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Yeni durum: {status.label}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Ödeme Durumu */}
                    {order.paymentStatus && order.paymentStatus !== 'PENDING' && (
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Ödeme Durumu</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {paymentStatusConfig[order.paymentStatus]?.label || 'Bilinmiyor'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Kargo Bilgileri */}
                    {order.trackingNumber && (
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Kargo Bilgileri</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Takip No: {order.trackingNumber}
                          </p>
                          {order.estimatedDelivery && (
                            <p className="text-xs text-gray-600 mt-1">
                              Tahmini Teslimat: {format(new Date(order.estimatedDelivery), 'dd MMMM yyyy', { locale: tr })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

function SupportMenu({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
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
    <div className="mt-3 inline-block relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((s) => !s)}>
        <MessageCircle className="mr-1 h-4 w-4" />
        Soru Sor
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border rounded-md shadow-lg z-10 p-1">
          {['Kargo durumunu sormak istiyorum','Sipariş sürecinde değişiklik talebi','Fatura/Adres ile ilgili soru','Ürün hakkında soru','Diğer'].map((label) => (
            <a
              key={label}
              href={getWhatsAppHref(SUPPORT_WHATSAPP_PHONE, buildSupportMessage(label))}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}