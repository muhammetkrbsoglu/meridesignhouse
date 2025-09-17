'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Search, 
  Filter, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  MapPinIcon
} from 'lucide-react';
import { updateOrderStatus, deleteOrderAction } from '@/lib/actions/orders';
import Link from 'next/link';
import { Order } from '@/lib/actions/orders';
import { getWhatsAppHref } from '@/lib/whatsapp-utils';
import { supabase } from '@/lib/supabase-browser';
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
      return 'Kargoya Verildi';
    case 'DELIVERED':
      return 'Teslim Edildi';
    case 'CANCELLED':
      return 'İptal Edildi';
    case 'REFUNDED':
      return 'İade Edildi';
    default:
      return 'Bilinmeyen';
  }
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { light, medium, success } = useHapticFeedback();

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsLoading(orderId);
    try {
      const result = await updateOrderStatus(orderId, newStatus as any);
      if (result.success) {
        success('Sipariş durumu güncellendi');
      } else {
        console.error('Status update failed:', result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
      try {
        const result = await deleteOrderAction(orderId as any);
        if (result.success) {
          success('Sipariş silindi');
        } else {
          console.error('Delete failed:', result.error);
        }
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const handleWhatsAppMessage = (order: Order) => {
    const message = `Merhaba ${order.customerName},\n\nSiparişiniz hakkında bilgi vermek istiyorum.\n\nSipariş No: ${order.id}\nDurum: ${getStatusText(order.status)}\n\nSize nasıl yardımcı olabilirim?`;
    const href = getWhatsAppHref(order.customerPhone || '', message);
    window.open(href, '_blank');
    medium('WhatsApp\'a yönlendiriliyor');
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Sipariş Ara
            </label>
            <div className="relative">
              <Input
                placeholder="Sipariş no, müşteri adı veya email ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Durum Filtresi
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="PROCESSING">İşleniyor</SelectItem>
                <SelectItem value="SHIPPED">Kargoya Verildi</SelectItem>
                <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
                <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                <SelectItem value="REFUNDED">İade Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile Cards / Desktop Table */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border p-12 text-center"
          >
            <div className="text-gray-400">
              <Package className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sipariş bulunamadı
              </h3>
              <p className="text-gray-500">
                Arama kriterlerinize uygun sipariş bulunamadı.
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              <AnimatePresence>
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <HoverCard
                      shimmer={false}
                      hapticType="light"
                      hapticMessage={`Sipariş ${order.id}`}
                      className="w-full"
                    >
                      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              Sipariş #{order.id}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {order.customerName || 'İsimsiz Müşteri'}
                            </p>
                          </div>
                          
                          {/* 3-dots Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <MicroFeedback
                                onClick={() => {}}
                                hapticType="light"
                                hapticMessage="Sipariş menüsü"
                              >
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <EllipsisVerticalIcon className="h-4 w-4" />
                                </Button>
                              </MicroFeedback>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/orders/${order.id}`} className="flex items-center">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detayları Görüntüle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/orders/${order.id}/edit`} className="flex items-center">
                                  <PencilIcon className="mr-2 h-4 w-4" />
                                  Düzenle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleWhatsAppMessage(order)}
                                className="flex items-center"
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                WhatsApp Mesaj
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteOrder(order.id)}
                                className="text-red-600"
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                          {/* Customer Info */}
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <UserIcon className="h-3 w-3" />
                            <span>{order.customerEmail}</span>
                          </div>

                          {/* Order Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <Package className="h-3 w-3" />
                              <span>{order.items?.length || 0} ürün</span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <CreditCardIcon className="h-3 w-3" />
                              <span>₺{order.totalAmount?.toLocaleString('tr-TR')}</span>
                            </div>
                          </div>

                          {/* Status & Date */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <Badge 
                              className={`text-xs ${getStatusColor(order.status)}`}
                            >
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(order.status)}
                                <span>{getStatusText(order.status)}</span>
                              </div>
                            </Badge>
                            
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>

                          {/* Address */}
                          {order.shipping_address && (
                            <div className="flex items-start space-x-2 text-xs text-gray-600">
                              <MapPinIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="truncate">{order.shipping_address}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </HoverCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
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
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.customerName || 'İsimsiz Müşteri'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customerEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span>{getStatusText(order.status)}</span>
                            </div>
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {order.items?.length || 0}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          ₺{order.totalAmount?.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWhatsAppMessage(order)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}