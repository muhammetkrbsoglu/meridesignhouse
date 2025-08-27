'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number | string; // Can be Decimal from Prisma
  designData?: any;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

interface Address {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number | string; // Can be Decimal from Prisma
  customerNote?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[]; // Backend'de orderItems olarak döndürülüyor
  shippingAddress: Address;
  billingAddress: Address;
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const getStatusText = (status: string) => {
    const statusMap = {
      'PENDING': 'Beklemede',
      'CONFIRMED': 'Onaylandı',
      'PROCESSING': 'Hazırlanıyor',
      'SHIPPED': 'Kargoda',
      'DELIVERED': 'Teslim Edildi',
      'CANCELLED': 'İptal Edildi'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-purple-100 text-purple-800',
      'SHIPPED': 'bg-indigo-100 text-indigo-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const trackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch(`http://localhost:3001/api/orders/guest/${orderId}?phoneNumber=${encodeURIComponent(phoneNumber)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sipariş bulunamadı. Lütfen sipariş numarasını ve telefon numarasını kontrol edin.');
        }
        throw new Error('Sipariş bilgileri alınamadı.');
      }

             const orderData = await response.json();
       
       // Phone number verification is now handled by backend
       console.log('Order data received:', orderData);
       console.log('Order items:', orderData.orderItems);
 
       setOrder(orderData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Sipariş Takibi</h1>
            <p className="text-gray-600 mt-2">
              Sipariş numaranız ve telefon numaranız ile siparişinizi takip edin
            </p>
          </div>

          {/* Tracking Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={trackOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sipariş Numarası *
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: ORD-123456"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon Numarası *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5XX XXX XX XX"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Sipariş Aranıyor...' : 'Siparişi Takip Et'}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sipariş #{order.id}</h2>
                    <p className="text-gray-600 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Ürünleri</h3>
                                 <div className="space-y-4">
                   {order.orderItems && order.orderItems.length > 0 ? (
                     order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                                                 <div className="flex-1">
                           <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                           <p className="text-gray-600">Adet: {item.quantity}</p>
                           <p className="text-gray-600">
                             Fiyat: ₺{typeof item.price === 'number' 
                               ? item.price.toFixed(2) 
                               : parseFloat(item.price.toString()).toFixed(2)
                             }
                           </p>
                         </div>
                         <div className="text-right">
                           <p className="font-semibold text-gray-900">
                             ₺{(() => {
                               const price = typeof item.price === 'number' 
                                 ? item.price 
                                 : parseFloat(item.price.toString());
                               return (price * item.quantity).toFixed(2);
                             })()}
                           </p>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Sipariş ürünleri yüklenemedi.</p>
                    </div>
                  )}
                </div>
                
                                 <div className="border-t border-gray-200 pt-4 mt-4">
                   <div className="flex justify-between items-center">
                     <span className="text-lg font-semibold text-gray-900">Toplam</span>
                     <span className="text-2xl font-bold text-gray-900">
                       ₺{typeof order.totalAmount === 'number' 
                         ? order.totalAmount.toFixed(2) 
                         : parseFloat(order.totalAmount.toString()).toFixed(2)
                       }
                     </span>
                   </div>
                 </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teslimat Adresi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Ad Soyad</p>
                    <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefon</p>
                    <p className="font-medium">{order.shippingAddress.phoneNumber}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Adres</p>
                    <p className="font-medium">
                      {order.shippingAddress.addressLine1}
                      {order.shippingAddress.addressLine2 && <br />}
                      {order.shippingAddress.addressLine2}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Şehir/İl</p>
                    <p className="font-medium">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Posta Kodu</p>
                    <p className="font-medium">{order.shippingAddress.postalCode}</p>
                  </div>
                </div>
              </div>

              {/* Customer Note */}
              {order.customerNote && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Notu</h3>
                  <p className="text-gray-700">{order.customerNote}</p>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Soru veya Yardım mı Gerekiyor?</h3>
                <p className="text-blue-700 mb-4">
                  Siparişinizle ilgili herhangi bir sorunuz varsa WhatsApp üzerinden bizimle iletişime geçebilirsiniz.
                </p>
                <button
                  onClick={() => router.push('/contact')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  İletişime Geç
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
