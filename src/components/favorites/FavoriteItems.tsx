'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FavoriteItem, removeFromFavorites, addToCart, addToFavorites } from '@/lib/actions/cart';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback';
import { BlurUpImage, Skeleton } from '@/components/motion/LoadingStates';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface FavoriteItemsProps {
  items: FavoriteItem[];
}

export function FavoriteItems({ items }: FavoriteItemsProps) {
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const { success, light, medium, error } = useHapticFeedback();

  const handleRemoveFromFavorites = async (productId: string) => {
    setLoadingItems(prev => new Set(prev).add(productId));
    medium('Favorilerden çıkarılıyor');
    
    try {
      const result = await removeFromFavorites(productId);
      
      if (result.success) {
        success('Ürün favorilerden çıkarıldı');
        toast({ intent: 'success', description: 'Ürün favorilerden çıkarıldı', action: (
          <ToastAction altText="Geri Al" onClick={async () => {
            await addToFavorites(productId)
            success('Ürün geri alındı')
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
        error('Favorilerden çıkarma hatası');
      }
    } catch (error) {
      console.error('[FavoriteItems] Remove error:', error);
      toast({ intent: 'error', description: 'Bir hata oluştu' });
      error('Favorilerden çıkarma hatası');
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
    light('Sepete ekleniyor');
    
    try {
      const result = await addToCart(productId, 1);
      
      if (result.success) {
        success(`${productName} sepete eklendi`);
        toast({ intent: 'success', description: `${productName} sepete eklendi` });
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' });
        error('Sepete ekleme hatası');
      }
    } catch (_) {
      toast({ intent: 'error', description: 'Bir hata oluştu' });
      error('Sepete ekleme hatası');
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
      <AnimatePresence>
        {items.map((item, index) => {
        const isLoading = loadingItems.has(item.productId);
        
        return (
          <motion.div 
            key={item.id} 
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            layout
          >
            <div className="relative">
              {/* Product Image */}
              <Link href={`/products/${item.product.slug}`} aria-label={`Ürün sayfasına git: ${item.product.name}`}>
                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden group">
                  {item.product.product_images && item.product.product_images.length > 0 ? (
                    <BlurUpImage
                      src={item.product.product_images[0].url}
                      alt={item.product.product_images[0].alt || item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      width={300}
                      height={300}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
              <MicroFeedback
                onClick={() => handleRemoveFromFavorites(item.productId)}
                hapticType="medium"
                hapticMessage="Favorilerden çıkar"
                className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <button
                  disabled={isLoading}
                  title="Favorilerden Çıkar"
                  className="w-full h-full"
                >
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </MicroFeedback>
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
                <MicroFeedback
                  onClick={() => handleAddToCart(item.productId, item.product.name)}
                  hapticType="light"
                  hapticMessage="Sepete ekle"
                  className="w-full"
                >
                  <button
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:from-rose-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Ekleniyor...
                      </div>
                    ) : (
                      'Sepete Ekle'
                    )}
                  </button>
                </MicroFeedback>
                
                <MicroFeedback
                  onClick={() => {}}
                  hapticType="light"
                  hapticMessage="Ürünü incele"
                  className="block w-full"
                >
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium text-center hover:bg-gray-200 transition-colors"
                    aria-label={`Ürünü incele: ${item.product.name}`}
                  >
                    Ürünü İncele
                  </Link>
                </MicroFeedback>
              </div>

              {/* Added Date */}
              <p className="text-xs text-gray-500 mt-3">
                Favorilere eklendi: {new Date(item.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>
    </div>
  );
}