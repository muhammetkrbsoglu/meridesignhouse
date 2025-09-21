'use server';

import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '@/lib/whatsapp';
import { formatPhoneForWhatsApp, isValidTurkishPhone } from '@/lib/whatsapp-utils';
import type { PersonalizationPayload } from '@/types/personalization';

export interface Order {
  id: string;
  order_number: string;
  orderNumber: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  totalAmount: number;
  subtotal: number;
  tax: number;
  taxAmount?: number;
  shipping: number;
  shippingCost?: number;
  
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shipping_name?: string;
  user_email?: string;
  shipping_phone?: string;
  
  // Shipping address
  shippingAddress: string;
  shipping_address?: string;
  shippingCity: string;
  shippingState?: string;
  shippingZip: string;
  shippingCountry: string;
  
  // Billing address (optional)
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: {
    name: string;
    email: string;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  personalization?: PersonalizationPayload | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    product_images: { id: string; url: string }[] | null;
  };
}

export interface CheckoutData {
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    fullName: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  notes?: string;
}

/**
 * Generate unique order number
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `MDH-${year}${month}${day}-${rand}`;
}

/**
 * Create order from cart
 */
export async function createOrderFromCart(checkoutData: CheckoutData) {
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Get cart items using admin client for database operations
    const adminSupabase = getSupabaseAdmin();
    
    const { data: cartItems, error: cartError } = await adminSupabase
      .from('cart_items')
      .select(`
        *,
        product:products (
          id,
          name,
          slug,
          price,
          image
        )
      `)
      .eq('userId', user.id);

    if (cartError) {
      return { 
        success: false, 
        error: `Sepet verileri alınamadı: ${cartError.message}`,
        debug: {
          user_id: user.id,
          error: cartError,
          query: 'cart_items'
        }
      };
    }

    if (!cartItems || cartItems.length === 0) {
      return { 
        success: false, 
        error: 'Sepetiniz boş',
        debug: {
          user_id: user.id,
          cartItems: cartItems,
          count: cartItems?.length
        }
      };
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shipping = subtotal >= 500 ? 0 : 50; // Free shipping over 500 TL
    const tax = subtotal * 0.18; // 18% VAT
    const total = subtotal + shipping + tax;

    const orderNumber = generateOrderNumber();

    // Create order
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .insert({
        id: crypto.randomUUID(),
        orderNumber,
        userId: user.id,
        status: 'PENDING',
        totalAmount: total,
        subtotal: subtotal,
        tax: tax,
        taxAmount: tax,
        shippingCost: shipping,
        customerName: checkoutData.shippingAddress.fullName,
        customerEmail: user.email,
        customerPhone: checkoutData.shippingAddress.phone,
        shippingAddress: JSON.stringify(checkoutData.shippingAddress),
        shippingCity: checkoutData.shippingAddress.city,
        shippingState: checkoutData.shippingAddress.district,
        shippingZip: checkoutData.shippingAddress.postalCode,
        shippingCountry: checkoutData.shippingAddress.country,
        billingAddress: JSON.stringify(checkoutData.billingAddress || checkoutData.shippingAddress),
        billingCity: checkoutData.billingAddress?.city || checkoutData.shippingAddress.city,
        billingState: checkoutData.billingAddress?.district || checkoutData.shippingAddress.district,
        billingZip: checkoutData.billingAddress?.postalCode || checkoutData.shippingAddress.postalCode,
        billingCountry: checkoutData.billingAddress?.country || checkoutData.shippingAddress.country,
        payment_method: checkoutData.paymentMethod,
        payment_status: 'PENDING',
        notes: checkoutData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return { success: false, error: 'Sipariş oluşturulurken hata oluştu' };
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      id: crypto.randomUUID(),
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price,
      personalization: item.personalization ?? null,
    }));

    const { error: itemsError } = await adminSupabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order creation
      await adminSupabase.from('orders').delete().eq('id', order.id);
      return { success: false, error: 'Sipariş ürünleri oluşturulurken hata oluştu' };
    }

    // Clear cart
    const { error: clearCartError } = await adminSupabase
      .from('cart_items')
      .delete()
      .eq('userId', user.id);

    if (clearCartError) {
      console.error('Error clearing cart:', clearCartError);
    }

    revalidatePath('/cart');
    revalidatePath('/orders');
    
    // Send WhatsApp order confirmation if phone number is available
    try {
      if (checkoutData.shippingAddress.phone) {
        const phone = formatPhoneForWhatsApp(checkoutData.shippingAddress.phone);
        if (isValidTurkishPhone(phone)) {
          // Create order object for WhatsApp message
          const orderForWhatsApp = {
            ...order,
            orderNumber: order.orderNumber,
            total: total,
            createdAt: order.createdAt || new Date().toISOString(),
            customerName: checkoutData.shippingAddress.fullName,
            customerPhone: checkoutData.shippingAddress.phone
          };
          await sendOrderConfirmation(orderForWhatsApp, phone);
        }
      }
    } catch (whatsappError) {
      console.error('WhatsApp confirmation error:', whatsappError);
      // Don't fail the main operation if WhatsApp fails
    }
    
    return { 
      success: true, 
      orderId: order.id,
      orderNumber: order.orderNumber
    };
  } catch (error) {
    console.error('Error in createOrderFromCart:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Get user orders
 */
export async function getUserOrders(): Promise<Order[]> {
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return [];
    }

    // Use admin client for database operations
    const adminSupabase = getSupabaseAdmin();
    const { data: orders, error } = await adminSupabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          *,
          product:products (
            id,
            name,
            slug,
            price,
            product_images(id, url)
          )
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }

    // Convert string numbers to actual numbers
    const processedOrders = (orders || []).map(order => ({
      ...order,
      totalAmount: typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount,
      subtotal: typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : order.subtotal,
      tax: typeof order.tax === 'string' ? parseFloat(order.tax) : order.tax,
      taxAmount: typeof order.taxAmount === 'string' ? parseFloat(order.taxAmount) : order.taxAmount,
      shippingCost: typeof order.shippingCost === 'string' ? parseFloat(order.shippingCost) : order.shippingCost,
    }));

    return processedOrders;
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    return [];
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Use admin client for database operations
    const adminSupabase = getSupabaseAdmin();
    const { data: order, error } = await adminSupabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          *,
          product:products (
            id,
            name,
            slug,
            price,
            product_images(id, url)
          )
        ),
        user:users (
          name,
          email
        )
      `)
      .eq('id', orderId)
      .eq('userId', user.id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    if (!order) {
      return null;
    }

    // Transform the data to match the Order interface
    const transformedOrder: Order = {
      ...order,
      // Core fields - use database values directly
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      orderNumber: order.order_number || order.orderNumber,
      totalAmount: order.total_amount || order.totalAmount,
      shippingCost: order.shipping_cost || order.shippingCost,
      taxAmount: order.tax_amount || order.taxAmount,
      customerName: order.customer_name || order.customerName,
      customerEmail: order.customer_email || order.customerEmail,
      customerPhone: order.customer_phone || order.customerPhone,
      shippingAddress: order.shipping_address || order.shippingAddress,
      shippingCity: order.shipping_city || order.shippingCity,
      shippingState: order.shipping_state || order.shippingState,
      shippingZip: order.shipping_zip || order.shippingZip,
      shippingCountry: order.shipping_country || order.shippingCountry,
      billingAddress: order.billing_address || order.billingAddress,
      billingCity: order.billing_city || order.billingCity,
      billingState: order.billing_state || order.billingState,
      billingZip: order.billing_zip || order.billingZip,
      billingCountry: order.billing_country || order.billingCountry,
      trackingNumber: order.tracking_number || order.trackingNumber,
      createdAt: order.createdAt || order.createdAt,
      updatedAt: order.updatedAt || order.updatedAt,
      // Legacy fields for backward compatibility
      total: order.total_amount || order.totalAmount || order.total,
      subtotal: order.subtotal || (order.total_amount - (order.shipping_cost || 0) - (order.tax_amount || 0)),
      tax: order.tax_amount || order.taxAmount || order.tax || 0,
      shipping: order.shipping_cost || order.shippingCost || order.shipping || 0,
      order_number: order.order_number || order.orderNumber,
      shipping_name: order.customer_name || order.customerName,
      user_email: order.customer_email || order.customerEmail,
      shipping_phone: order.customer_phone || order.customerPhone,
      shipping_address: order.shipping_address || order.shippingAddress
    };

    // Debug logs removed

    return transformedOrder;
  } catch (error) {
    console.error('Error in getOrderById:', error);
    return null;
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          *,
          product:products (
            id,
            name,
            slug,
            product_images(id, url)
          )
        ),
        user:users (
          name,
          email
        )
      `)
      .eq('orderNumber', orderNumber)
      .eq('userId', user.id)
      .single();

    if (error) {
      console.error('Error fetching order by number:', error);
      return null;
    }

    if (!order) {
      return null;
    }

    // Transform the data to match the Order interface
    const transformedOrder: Order = {
      ...order,
      // Core fields - use database values directly
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      orderNumber: order.order_number || order.orderNumber,
      totalAmount: order.total_amount || order.totalAmount,
      shippingCost: order.shipping_cost || order.shippingCost,
      taxAmount: order.tax_amount || order.taxAmount,
      customerName: order.customer_name || order.customerName,
      customerEmail: order.customer_email || order.customerEmail,
      customerPhone: order.customer_phone || order.customerPhone,
      shippingAddress: order.shipping_address || order.shippingAddress,
      shippingCity: order.shipping_city || order.shippingCity,
      shippingState: order.shipping_state || order.shippingState,
      shippingZip: order.shipping_zip || order.shippingZip,
      shippingCountry: order.shipping_country || order.shippingCountry,
      billingAddress: order.billing_address || order.billingAddress,
      billingCity: order.billing_city || order.billingCity,
      billingState: order.billing_state || order.billingState,
      billingZip: order.billing_zip || order.billingZip,
      billingCountry: order.billing_country || order.billingCountry,
      trackingNumber: order.tracking_number || order.trackingNumber,
      createdAt: order.createdAt || order.createdAt,
      updatedAt: order.updatedAt || order.updatedAt,
      // Legacy fields for backward compatibility
      total: order.total_amount || order.totalAmount || order.total,
      subtotal: order.subtotal || (order.total_amount - (order.shipping_cost || 0) - (order.tax_amount || 0)),
      tax: order.tax_amount || order.taxAmount || order.tax || 0,
      shipping: order.shipping_cost || order.shippingCost || order.shipping || 0,
      order_number: order.order_number || order.orderNumber,
      shipping_name: order.customer_name || order.customerName,
      user_email: order.customer_email || order.customerEmail,
      shipping_phone: order.customer_phone || order.customerPhone,
      shipping_address: order.shipping_address || order.shippingAddress
    };

    // Debug logs removed

    return transformedOrder;
  } catch (error) {
    console.error('Error in getOrderByNumber:', error);
    return null;
  }
}

/**
 * Admin: Get all orders
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          *,
          product:products (
            id,
            name,
            slug,
            product_images(id, url)
          )
        ),
        user:users (
          name,
          email
        )
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching all orders:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    if (!orders) {
      return [];
    }

    // Transform the data to match the Order interface
    const transformedOrders: Order[] = orders.map(order => ({
      ...order,
      orderNumber: order.order_number || order.orderNumber,
      totalAmount: order.total_amount || order.totalAmount,
      shippingCost: order.shipping_cost || order.shippingCost,
      taxAmount: order.tax_amount || order.taxAmount,
      customerName: order.customer_name || order.customerName,
      customerEmail: order.customer_email || order.customerEmail,
      customerPhone: order.customer_phone || order.customerPhone,
      shippingAddress: order.shipping_address || order.shippingAddress,
      shippingCity: order.shipping_city || order.shippingCity,
      shippingState: order.shipping_state || order.shippingState,
      shippingZip: order.shipping_zip || order.shippingZip,
      shippingCountry: order.shipping_country || order.shippingCountry,
      billingAddress: order.billing_address || order.billingAddress,
      billingCity: order.billing_city || order.billingCity,
      billingState: order.billing_state || order.billingState,
      billingZip: order.billing_zip || order.billingZip,
      billingCountry: order.billing_country || order.billingCountry,
      trackingNumber: order.tracking_number || order.trackingNumber,
      createdAt: order.createdAt || order.createdAt,
      updatedAt: order.updatedAt || order.updatedAt,
      // Legacy fields for backward compatibility
      total: order.total_amount || order.totalAmount || order.total,
      subtotal: order.subtotal || (order.total_amount - (order.shipping_cost || 0) - (order.tax_amount || 0)),
      tax: order.tax_amount || order.taxAmount || order.tax || 0,
      shipping: order.shipping_cost || order.shippingCost || order.shipping || 0,
      order_number: order.order_number || order.orderNumber,
      shipping_name: order.customer_name || order.customerName,
      user_email: order.customer_email || order.customerEmail,
      shipping_phone: order.customer_phone || order.customerPhone,
      shipping_address: order.shipping_address || order.shippingAddress
    }));

    return transformedOrders;
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    return [];
  }
}

/**
 * Admin: Update order status
 */
export async function updateOrderStatus(
  orderId: string, 
  status: Order['status'],
  trackingNumber?: string,
  estimatedDelivery?: string
) {
  try {
    const supabase = getSupabaseAdmin();
    
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (estimatedDelivery) {
      updateData.estimatedDelivery = estimatedDelivery;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: 'Sipariş durumu güncellenirken hata oluştu' };
    }

    revalidatePath('/admin/orders');
    revalidatePath('/orders');
    
    // Send WhatsApp notification if phone number is available
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, customerPhone, shippingAddress')
        .eq('id', orderId)
        .single();

      if (orderData?.customerPhone) {
        const phone = formatPhoneForWhatsApp(orderData.customerPhone);
        if (isValidTurkishPhone(phone)) {
          await sendOrderStatusUpdate(orderData, phone, status);
        }
      }
    } catch (whatsappError) {
      console.error('WhatsApp notification error:', whatsappError);
      // Don't fail the main operation if WhatsApp fails
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}



/**
 * Get order statistics for admin dashboard
 */
export async function getOrderStatistics() {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, totalAmount, createdAt');

    if (error) {
      console.error('Error fetching order statistics:', error);
      return {
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0
      };
    }

    if (!orders) {
      return {
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'PENDING').length,
      processingOrders: orders.filter(o => o.status === 'PROCESSING').length,
      shippedOrders: orders.filter(o => o.status === 'SHIPPED').length,
      deliveredOrders: orders.filter(o => o.status === 'DELIVERED').length,
      cancelledOrders: orders.filter(o => ['CANCELLED', 'REFUNDED'].includes(o.status)).length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      monthlyRevenue: orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    };

    return stats;
  } catch (error) {
    console.error('Error in getOrderStatistics:', error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      monthlyRevenue: 0
    };
  }
}

/**
 * Cancel order (only if status is PROCESSING)
 */
export async function cancelOrder(orderId: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Giriş yapmanız gerekiyor' };
    }

    // Check if order exists and belongs to user
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .eq('userId', user.id)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Sipariş bulunamadı' };
    }

    if (order.status !== 'PROCESSING') {
      return { success: false, error: 'Bu sipariş iptal edilemez' };
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'CANCELLED',
        updatedAt: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: 'Sipariş iptal edilirken hata oluştu' };
    }

    revalidatePath('/orders');
    
    return { success: true };
  } catch (error) {
    console.error('Error in cancelOrder:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Admin: Update payment status
 */
export async function updatePaymentStatus(
  orderId: string, 
  paymentStatus: Order['paymentStatus']
) {
  try {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        updatedAt: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating payment status:', error);
      return { success: false, error: 'Ödeme durumu güncellenirken hata oluştu' };
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    revalidatePath('/orders');
    
    return { success: true };
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

export async function updateOrderStatusAction(orderId: string, newStatus: Order['status']) {
  'use server';
  await updateOrderStatus(orderId, newStatus);
}

export async function updatePaymentStatusAction(orderId: string, newStatus: Order['paymentStatus']) {
  'use server';
  await updatePaymentStatus(orderId, newStatus);
}

// Admin: Update internal admin notes for an order
export async function saveAdminNotesAction(formData: FormData) {
  'use server';
  try {
    const orderId = String(formData.get('orderId') || '');
    const adminNotes = String(formData.get('admin_notes') || '');
    if (!orderId) {
      return { success: false, error: 'orderId gerekli' };
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('orders')
      .update({ admin_notes: adminNotes, updatedAt: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating admin notes:', error);
      return { success: false, error: 'İç notlar güncellenirken hata oluştu' };
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Error in saveAdminNotesAction:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

// Admin: Delete order (and related items)
export async function deleteOrder(orderId: string) {
  try {
    const supabase = getSupabaseAdmin();

    // Best-effort: delete items first (in case FK isn't cascading)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('orderId', orderId);

    if (itemsError) {
      console.error('Error deleting order items:', itemsError);
      // continue; parent delete might cascade depending on FK
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting order:', error);
      return { success: false, error: 'Sipariş silinirken hata oluştu' };
    }

    revalidatePath('/admin/orders');
    revalidatePath('/orders');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteOrder:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

export async function deleteOrderAction(formData: FormData) {
  'use server';
  const orderId = String(formData.get('orderId') || '');
  if (!orderId) return { success: false, error: 'orderId gerekli' };
  return await deleteOrder(orderId);
}
