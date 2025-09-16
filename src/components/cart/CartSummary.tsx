'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CartItem, clearCart } from '@/lib/actions/cart';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface CartSummaryProps {
  items: CartItem[];
}

export function CartSummary({ items }: CartSummaryProps) {
  const [isClearing, setIsClearing] = useState(false);

  // Calculate totals
  const subtotal = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over 500 TL
  const tax = subtotal * 0.18; // 18% VAT
  const total = subtotal + shipping + tax;

  const handleClearCart = async () => {
    if (!confirm('Sepetinizdeki tüm ürünleri silmek istediğinizden emin misiniz?')) {
      return;
    }

    setIsClearing(true);
    
    try {
      const result = await clearCart();
      
      if (result.success) {
        toast.success('Sepet temizlendi');
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (_) {
      toast.error('Bir hata oluştu');
    } finally {
      setIsClearing(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border sticky top-8">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Sipariş Özeti</h2>
        
        {/* Order Summary */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ara Toplam ({items.length} ürün)</span>
            <span className="text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Kargo</span>
            <span className="text-gray-900">
              {shipping === 0 ? (
                <span className="text-green-600 font-medium">Ücretsiz</span>
              ) : (
                formatCurrency(shipping)
              )}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">KDV (%18)</span>
            <span className="text-gray-900">{formatCurrency(tax)}</span>
          </div>
          
          {subtotal < 500 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{formatCurrency(500 - subtotal)}</span> daha alışveriş yapın, 
                <span className="font-medium"> ücretsiz kargo</span> kazanın!
              </p>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <span className="text-base font-semibold text-gray-900">Toplam</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
          >
            Siparişi Tamamla
          </Link>
          
          <button 
            onClick={handleClearCart}
            disabled={isClearing}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? 'Temizleniyor...' : 'Sepeti Temizle'}
          </button>
        </div>

        {/* Security Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Güvenli ödeme garantisi</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 mt-2">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>30 gün iade garantisi</span>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="mt-6">
          <Link
            href="/products"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            ← Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  );
}