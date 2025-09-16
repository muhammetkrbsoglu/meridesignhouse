'use client';

import { Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Order } from '@/lib/actions/orders';

interface OrderTimelineProps {
  order: Order;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'current' | 'pending';
  icon: React.ReactNode;
}

const getTimelineEvents = (order: Order): TimelineEvent[] => {
  const events: TimelineEvent[] = [
    {
      id: 'created',
      title: 'Sipariş Oluşturuldu',
      description: `Sipariş #${order.orderNumber} başarıyla oluşturuldu`,
      timestamp: typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt,
      status: 'completed',
      icon: <Package className="h-4 w-4" />
    }
  ];

  // Add payment event if paid
  if (order.paymentStatus === 'PAID') {
    events.push({
      id: 'payment',
      title: 'Ödeme Alındı',
      description: 'Ödeme başarıyla işlendi',
      timestamp: typeof order.updatedAt === 'string' ? new Date(order.updatedAt) : order.updatedAt,
      status: 'completed',
      icon: <CheckCircle className="h-4 w-4" />
    });
  }

  // Add processing event
  if (['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
    events.push({
      id: 'processing',
      title: 'Sipariş Hazırlanıyor',
      description: 'Siparişiniz hazırlanmaya başlandı',
      timestamp: typeof order.updatedAt === 'string' ? new Date(order.updatedAt) : order.updatedAt,
      status: order.status === 'PROCESSING' ? 'current' : 'completed',
      icon: <Clock className="h-4 w-4" />
    });
  }

  // Add shipped event
  if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
    events.push({
      id: 'shipped',
      title: 'Kargoya Verildi',
      description: order.trackingNumber 
        ? `Kargo takip numarası: ${order.trackingNumber}`
        : 'Siparişiniz kargoya verildi',
      timestamp: typeof order.updatedAt === 'string' ? new Date(order.updatedAt) : order.updatedAt,
      status: order.status === 'SHIPPED' ? 'current' : 'completed',
      icon: <Truck className="h-4 w-4" />
    });
  }

  // Add delivered event
  if (order.status === 'DELIVERED') {
    events.push({
      id: 'delivered',
      title: 'Teslim Edildi',
      description: 'Siparişiniz başarıyla teslim edildi',
      timestamp: typeof order.updatedAt === 'string' ? new Date(order.updatedAt) : order.updatedAt,
      status: 'completed',
      icon: <CheckCircle className="h-4 w-4" />
    });
  }

  // Add cancelled event
  if (order.status === 'CANCELLED') {
    events.push({
      id: 'cancelled',
      title: 'Sipariş İptal Edildi',
      description: 'Sipariş iptal edildi',
      timestamp: typeof order.updatedAt === 'string' ? new Date(order.updatedAt) : order.updatedAt,
      status: 'completed',
      icon: <XCircle className="h-4 w-4" />
    });
  }

  // Add pending events for future steps
  if (order.status === 'PROCESSING') {
    events.push(
      {
        id: 'ship-pending',
        title: 'Kargoya Verilecek',
        description: 'Sipariş kargoya verilmeyi bekliyor',
        timestamp: new Date(),
        status: 'pending',
        icon: <Truck className="h-4 w-4" />
      },
      {
        id: 'delivery-pending',
        title: 'Teslim Edilecek',
        description: 'Sipariş teslim edilmeyi bekliyor',
        timestamp: new Date(),
        status: 'pending',
        icon: <CheckCircle className="h-4 w-4" />
      }
    );
  } else if (order.status === 'SHIPPED') {
    events.push({
      id: 'delivery-pending',
      title: 'Teslim Edilecek',
      description: 'Sipariş teslim edilmeyi bekliyor',
      timestamp: new Date(),
      status: 'pending',
      icon: <CheckCircle className="h-4 w-4" />
    });
  }

  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

const getStatusColor = (status: 'completed' | 'current' | 'pending') => {
  switch (status) {
    case 'completed':
      return 'bg-green-500 border-green-500';
    case 'current':
      return 'bg-blue-500 border-blue-500';
    case 'pending':
      return 'bg-gray-300 border-gray-300';
    default:
      return 'bg-gray-300 border-gray-300';
  }
};

const getTextColor = (status: 'completed' | 'current' | 'pending') => {
  switch (status) {
    case 'completed':
      return 'text-green-700';
    case 'current':
      return 'text-blue-700';
    case 'pending':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};

const getIconColor = (status: 'completed' | 'current' | 'pending') => {
  switch (status) {
    case 'completed':
      return 'text-white';
    case 'current':
      return 'text-white';
    case 'pending':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

export function OrderTimeline({ order }: OrderTimelineProps) {
  const events = getTimelineEvents(order);

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <div key={event.id} className="flex items-start space-x-4">
          {/* Timeline Icon */}
          <div className="flex flex-col items-center">
            <div className={`
              w-10 h-10 rounded-full border-2 flex items-center justify-center
              ${getStatusColor(event.status)}
            `}>
              <div className={getIconColor(event.status)}>
                {event.icon}
              </div>
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-12 bg-gray-200 mt-2" />
            )}
          </div>

          {/* Timeline Content */}
          <div className="flex-1 pb-8">
            <div className="flex items-center justify-between">
              <h4 className={`font-medium ${getTextColor(event.status)}`}>
                {event.title}
              </h4>
              <span className="text-sm text-gray-500">
                {event.timestamp.toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <p className={`text-sm mt-1 ${getTextColor(event.status)}`}>
              {event.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}