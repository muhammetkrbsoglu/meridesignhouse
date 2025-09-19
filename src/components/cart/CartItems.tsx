'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CartItem } from '@/types/cart';
import { updateCartItemQuantity, removeFromCart } from '@/lib/api/cartClient';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

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
    <div className="space-y-4">
      {items.map((item) => {
        const isLoading = loadingItems.has(item.id);
        const displayedQty = draftQuantities[item.id] ?? String(item.quantity);
        const firstImage = item.product.product_images && item.product.product_images.length > 0 ? item.product.product_images[0] : null;
        
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className={`p-4 sm:p-6 ${isLoading ? 'opacity-80' : ''}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                    {firstImage ? (
                      <Image
                        src={firstImage.url}
                        alt={firstImage.alt || item.product.name}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        placeholder="blur"
                        blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-2xl">🛍️</span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="block transition-opacity hover:opacity-80"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 transition-colors hover:text-blue-600 sm:text-lg">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 sm:text-sm">
                    {item.product.category?.name}
                  </p>
                  <p className="text-base font-semibold text-rose-600 sm:text-lg">
                    {formatCurrency(item.product.price)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col gap-3 sm:min-w-[210px] sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/70 px-3 py-2 shadow-sm sm:justify-start sm:gap-2 sm:border-transparent sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={isLoading || item.quantity <= 1}
                      type="button"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </Button>

                    <input
                      id={`quantity-${item.id}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-16 rounded-md border border-gray-300 py-1.5 text-center text-base font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/40 sm:w-14 sm:text-sm"
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
                      placeholder="1"
                      aria-label="Miktar"
                    />

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={isLoading}
                      type="button"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>

                    {isLoading && (
                      <span className="inline-flex h-4 w-4 items-center justify-center sm:ml-1">
                        <span className="block h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" aria-label="Yükleniyor" />
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={isLoading}
                    className="self-start text-red-600 hover:text-red-700 hover:bg-red-50 sm:self-auto"
                  >
                    {isLoading ? (
                      <span className="inline-flex h-4 w-4 items-center justify-center">
                        <span className="block h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                      </span>
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </Button>
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}



