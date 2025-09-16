'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartItem, updateCartItemQuantity, removeFromCart } from '@/lib/actions/cart';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface CartItemsProps {
  items: CartItem[];
}

export function CartItems({ items }: CartItemsProps) {
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});

  const commitQuantity = async (itemId: string, fallbackQuantity: number) => {
    const raw = draftQuantities[itemId];
    const parsed = parseInt(raw ?? '', 10);

    if (Number.isNaN(parsed)) {
      setDraftQuantities(prev => ({ ...prev, [itemId]: String(fallbackQuantity) }));
      return;
    }

    const clamped = Math.max(1, Math.min(999, parsed));

    if (clamped === fallbackQuantity) {
      setDraftQuantities(prev => ({ ...prev, [itemId]: String(clamped) }));
      return;
    }

    await handleQuantityChange(itemId, clamped);
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setLoadingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await updateCartItemQuantity(itemId, newQuantity);
      
      if (result.success) {
        toast.success('Miktar güncellendi');
        setDraftQuantities(prev => ({ ...prev, [itemId]: String(newQuantity) }));
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (_) {
      toast.error('Bir hata oluştu');
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setLoadingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await removeFromCart(itemId);
      
      if (result.success) {
        toast.success('Ürün sepetten çıkarıldı');
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (_) {
      toast.error('Bir hata oluştu');
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Sepetinizdeki Ürünler</h2>
        
        <div className="space-y-6">
          {items.map((item) => {
            const isLoading = loadingItems.has(item.id);
            const displayedQty = draftQuantities[item.id] ?? String(item.quantity);
            const firstImage = item.product.product_images && item.product.product_images.length > 0 ? item.product.product_images[0] : null;
            
            return (
              <div key={item.id} className="flex items-start space-x-4 pb-6 border-b border-gray-200 last:border-b-0 last:pb-0">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <Link href={`/products/${item.product.slug}`}>
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden hover:opacity-75 transition-opacity relative">
                      {firstImage ? (
                        <Image
                          src={firstImage.url}
                          alt={firstImage.alt || item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link 
                        href={`/products/${item.product.slug}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      {item.product.category && (
                        <p className="text-sm text-gray-500 mt-1">
                          {item.product.category.name}
                        </p>
                      )}
                      <p className="text-lg font-semibold text-gray-900 mt-2">
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Sepetten Çıkar"
                      type="button"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center mt-4">
                    <label htmlFor={`quantity-${item.id}`} className="text-sm text-gray-700 mr-3">
                      Adet:
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={isLoading || item.quantity <= 1}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                      >
                        -
                      </button>
                      <input
                        id={`quantity-${item.id}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={displayedQty}
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select()}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                          setDraftQuantities(prev => ({ ...prev, [item.id]: val }));
                        }}
                        onBlur={() => commitQuantity(item.id, item.quantity)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            (e.currentTarget as HTMLInputElement).blur();
                          } else if (e.key === 'Escape') {
                            setDraftQuantities(prev => ({ ...prev, [item.id]: String(item.quantity) }));
                            (e.currentTarget as HTMLInputElement).blur();
                          }
                        }}
                        disabled={isLoading}
                        className="w-16 px-2 py-1 text-center border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 cursor-text"
                        placeholder="1"
                        aria-label="Miktar"
                      />
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      Ara Toplam: <span className="font-semibold text-gray-900">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}