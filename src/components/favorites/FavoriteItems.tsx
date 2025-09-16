'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FavoriteItem, removeFromFavorites, addToCart, addToFavorites } from '@/lib/actions/cart';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface FavoriteItemsProps {
  items: FavoriteItem[];
}

export function FavoriteItems({ items }: FavoriteItemsProps) {
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const handleRemoveFromFavorites = async (productId: string) => {
    setLoadingItems(prev => new Set(prev).add(productId));
    
    try {
      const result = await removeFromFavorites(productId);
      
      if (result.success) {
        toast({ intent: 'success', description: 'Ürün favorilerden çıkarıldı', action: (
          <ToastAction altText="Geri Al" onClick={async () => {
            await addToFavorites(productId)
            window.dispatchEvent(new Event('favoriteUpdated'))
            window.location.reload()
          }}>Geri Al</ToastAction>
        )});
        // Trigger favorite update event
        window.dispatchEvent(new Event('favoriteUpdated'));
        // Reload the page to refresh the list
        window.location.reload();
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' });
      }
    } catch (error) {
      console.error('[FavoriteItems] Remove error:', error);
      toast({ intent: 'error', description: 'Bir hata oluştu' });
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToCart = async (productId: string, productName: string) => {
    setLoadingItems(prev => new Set(prev).add(productId));
    
    try {
      const result = await addToCart(productId, 1);
      
      if (result.success) {
        toast({ intent: 'success', description: `${productName} sepete eklendi` });
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' });
      }
    } catch (_) {
      toast({ intent: 'error', description: 'Bir hata oluştu' });
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => {
        const isLoading = loadingItems.has(item.productId);
        
        return (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="relative">
              {/* Product Image */}
              <Link href={`/products/${item.product.slug}`} aria-label={`Ürün sayfasına git: ${item.product.name}`}>
                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden group">
                  {item.product.product_images && item.product.product_images.length > 0 ? (
                    <Image
                      src={item.product.product_images[0].url}
                      alt={item.product.product_images[0].alt || item.product.name}
                      width={800}
                      height={800}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
                      <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>

              {/* Remove from Favorites Button */}
              <button
                onClick={() => handleRemoveFromFavorites(item.productId)}
                disabled={isLoading}
                className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Favorilerden Çıkar"
              >
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Product Details */}
            <div className="p-4">
              {/* Category */}
              {item.product.category && (
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  {item.product.category.name}
                </p>
              )}

              {/* Product Name */}
              <Link 
                href={`/products/${item.product.slug}`}
                className="block"
              >
                <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                  {item.product.name}
                </h3>
              </Link>

              {/* Price */}
              <p className="text-lg font-bold text-gray-900 mb-4">
                {formatCurrency(item.product.price)}
              </p>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleAddToCart(item.productId, item.product.name)}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Ekleniyor...' : 'Sepete Ekle'}
                </button>
                
                <Link
                  href={`/products/${item.product.slug}`}
                  className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium text-center hover:bg-gray-200 transition-colors"
                  aria-label={`Ürünü incele: ${item.product.name}`}
                >
                  Ürünü İncele
                </Link>
              </div>

              {/* Added Date */}
              <p className="text-xs text-gray-500 mt-3">
                Favorilere eklendi: {new Date(item.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}