'use server';

import { Order } from '@/lib/actions/orders';

// WhatsApp Business API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const BUSINESS_PHONE_NUMBER = process.env.BUSINESS_PHONE_NUMBER || '+905329876543';

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Record<string, unknown>[];
  };
}

// Send WhatsApp message
export async function sendWhatsAppMessage(message: WhatsAppMessage) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.warn('WhatsApp API credentials not configured');
    return { success: false, error: 'WhatsApp API not configured' };
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        ...message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return { success: false, error: data.error?.message || 'Failed to send message' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('WhatsApp message send error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Send order confirmation message
export async function sendOrderConfirmation(order: Order, customerPhone: string) {
  const message: WhatsAppMessage = {
    to: customerPhone,
    type: 'text',
    text: {
      body: `🎉 Siparişiniz Onaylandı!

📦 Sipariş No: ${order.orderNumber}
💰 Toplam: ₺${order.total.toLocaleString('tr-TR')}
📅 Tarih: ${new Date(order.createdAt).toLocaleDateString('tr-TR')}

✅ Siparişiniz başarıyla alındı ve hazırlanmaya başlandı.

📱 Sipariş durumunuzu takip etmek için: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}

Teşekkür ederiz! 🙏

- Meri Design House`
    }
  };

  return await sendWhatsAppMessage(message);
}

// Send order status update
export async function sendOrderStatusUpdate(order: Order, customerPhone: string, newStatus: string) {
  const statusMessages = {
    PROCESSING: '⏳ Siparişiniz hazırlanıyor',
    SHIPPED: '🚚 Siparişiniz kargoya verildi',
    DELIVERED: '✅ Siparişiniz teslim edildi',
    CANCELLED: '❌ Siparişiniz iptal edildi',
    REFUNDED: '💰 Siparişiniz iade edildi'
  };

  const statusMessage = statusMessages[newStatus as keyof typeof statusMessages] || 'Sipariş durumu güncellendi';

  let messageBody = `📦 Sipariş Durumu Güncellendi

🔢 Sipariş No: ${order.orderNumber}
📊 Durum: ${statusMessage}
📅 Güncelleme: ${new Date().toLocaleDateString('tr-TR')}`;

  if (order.trackingNumber && newStatus === 'SHIPPED') {
    messageBody += `\n🚛 Kargo Takip No: ${order.trackingNumber}`;
  }

  if (order.estimatedDelivery && newStatus === 'SHIPPED') {
    messageBody += `\n📅 Tahmini Teslimat: ${new Date(order.estimatedDelivery).toLocaleDateString('tr-TR')}`;
  }

  messageBody += `\n\n📱 Detaylar için: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}\n\n- Meri Design House`;

  const message: WhatsAppMessage = {
    to: customerPhone,
    type: 'text',
    text: {
      body: messageBody
    }
  };

  return await sendWhatsAppMessage(message);
}

// Send customer support message
export async function sendCustomerSupportMessage(customerPhone: string, supportMessage: string) {
  const message: WhatsAppMessage = {
    to: customerPhone,
    type: 'text',
    text: {
      body: `💬 Müşteri Desteği

${supportMessage}

📞 Daha fazla yardım için bize ulaşın: ${BUSINESS_PHONE_NUMBER}

- Meri Design House`
    }
  };

  return await sendWhatsAppMessage(message);
}

// Send contact form response
export async function sendContactFormResponse(customerPhone: string, customerName: string, responseMessage: string) {
  const message: WhatsAppMessage = {
    to: customerPhone,
    type: 'text',
    text: {
      body: `Merhaba ${customerName},

📝 İletişim formunuzla ilgili yanıtımız:

${responseMessage}

📞 Daha fazla bilgi için: ${BUSINESS_PHONE_NUMBER}

Teşekkür ederiz! 🙏

- Meri Design House`
    }
  };

  return await sendWhatsAppMessage(message);
}
