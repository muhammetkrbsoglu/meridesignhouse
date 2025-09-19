'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CartItem } from '@/types/cart';
import { updateCartItemQuantity, removeFromCart } from '@/lib/api/cartClient';
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
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                {/* Product Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Ürün</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">x{item.quantity}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 p-1"
                    title="Sepetten Çıkar"
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Product Content */}
                <div className="flex gap-4">
                  {/* Product Image - Larger and Square */}
                  <div className="flex-shrink-0">
                    <Link href={`/products/${item.product.slug}`}>
                      <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden hover:opacity-75 transition-opacity relative shadow-sm">
                        {firstImage ? (
                          <Image
                            src={firstImage.url}
                            alt={firstImage.alt || item.product.name}
                            fill
                            className="object-cover"
                            sizes="96px"
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
                    <Link 
                      href={`/products/${item.product.slug}`}
                      className="block group"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2 mb-1">
                        {item.product.name}
                      </h3>
                      {item.product.category && (
                        <p className="text-xs text-gray-500 mb-2">
                          {item.product.category.name}
                        </p>
                      )}
                    </Link>
                    
                    {/* Price */}
                    <div className="text-base font-bold text-rose-600 mb-3">
                      {formatCurrency(item.product.price)}
                    </div>

                    {/* Quantity Controls - Compact Design */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Adet:</span>
                      <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={isLoading || item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
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
                          className="w-12 px-2 py-1 text-center border-0 bg-transparent font-medium text-sm focus:outline-none disabled:opacity-50 cursor-text"
                          placeholder="1"
                          aria-label="Miktar"
                        />
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={isLoading}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ara Toplam:</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
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



