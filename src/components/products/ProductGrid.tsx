'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { ProductWithCategory } from '@/types/product';
import { addToCart, addToFavorites, removeFromFavorites, isProductInFavorites } from '@/lib/actions/cart';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MicroFeedback, FavoriteButton, AddToCartButton, HoverCard } from '@/components/motion/MicroFeedback';
import { BlurUpImage, Skeleton } from '@/components/motion/LoadingStates';
import { BrandedLoader } from '@/components/motion/BrandedLoader';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useToast } from '@/contexts/ToastContext';

interface ProductGridProps {
  products: ProductWithCategory[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<{
    favorites: Set<string>;
    cart: Set<string>;
  }>({ favorites: new Set(), cart: new Set() });
  const [isLoading, setIsLoading] = useState(true);
  const { success, light } = useHapticFeedback();
  const { success: toastSuccess, error: toastError, undoAction } = useToast();

  // Load favorite status for all products
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      const favoriteStatuses = await Promise.all(
        products.map(async (product) => {
          try {
            const isFavorite = await isProductInFavorites(product.id);
            return { productId: product.id, isFavorite };
          } catch (_) {
            return { productId: product.id, isFavorite: false };
          }
        })
      );

      const newFavorites = new Set<string>();
      favoriteStatuses.forEach(({ productId, isFavorite }) => {
        if (isFavorite) {
          newFavorites.add(productId);
        }
      });
      setFavorites(newFavorites);
      setIsLoading(false);
    };

    if (products.length > 0) {
      loadFavorites();
    }
  }, [products]);

  const toggleFavorite = async (productId: string) => {
    setLoadingStates(prev => ({
      ...prev,
      favorites: new Set([...prev.favorites, productId])
    }));

    try {
      const isFavorite = favorites.has(productId);
      
      if (isFavorite) {
        const result = await removeFromFavorites(productId);
        if (result.success) {
          setFavorites(prev => {
            const newFavorites = new Set(prev);
            newFavorites.delete(productId);
            return newFavorites;
          });
          success('Ürün favorilerden çıkarıldı');
          toastSuccess('Favorilerden çıkarıldı', 'Ürün favorilerden kaldırıldı');
          // Trigger favorite update event
          window.dispatchEvent(new Event('favoriteUpdated'));
        } else {
          toastError('Hata', result.error || 'Bir hata oluştu');
        }
      } else {
        const result = await addToFavorites(productId);
        if (result.success) {
          setFavorites(prev => new Set([...prev, productId]));
          success('Ürün favorilere eklendi');
          toastSuccess('Favorilere eklendi', 'Ürün favorilere eklendi');
          // Trigger favorite update event
          window.dispatchEvent(new Event('favoriteUpdated'));
        } else {
          toastError('Hata', result.error || 'Bir hata oluştu');
        }
      }
    } catch (_) {
      toastError('Hata', 'Bir hata oluştu');
    } finally {
      setLoadingStates(prev => {
        const newFavorites = new Set(prev.favorites);
        newFavorites.delete(productId);
        return { ...prev, favorites: newFavorites };
      });
    }
  };

  const handleAddToCart = async (productId: string) => {
    setLoadingStates(prev => ({
      ...prev,
      cart: new Set([...prev.cart, productId])
    }));

    try {
      const result = await addToCart(productId, 1);
      if (result.success) {
        success('Ürün sepete eklendi');
        toastSuccess('Sepete eklendi', 'Ürün sepete eklendi');
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toastError('Hata', result.error || 'Bir hata oluştu');
      }
    } catch (_) {
      toastError('Hata', 'Bir hata oluştu');
    } finally {
      setLoadingStates(prev => {
        const newCart = new Set(prev.cart);
        newCart.delete(productId);
        return { ...prev, cart: newCart };
      });
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
            <Skeleton className="h-48 w-full rounded-lg mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m16 0l-2-2m2 2l-2 2M4 13l2-2m-2 2l2 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ürün bulunamadı</h3>
        <p className="text-gray-500">Bu kategoride henüz ürün bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
      {products.map((product, index) => (
        <HoverCard
          key={product.id}
          className="group relative bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 overflow-hidden"
          shimmer={true}
          hapticType="light"
          hapticMessage="Ürün kartına tıklandı"
        >
          {/* Product Image - Fixed 3:4 aspect ratio with BlurUp */}
          <div className="aspect-[3/4] relative overflow-hidden">
            <Link href={`/products/${product.slug}`} aria-label={`Ürün sayfasına git: ${product.name}`}>
              {product.images.length > 0 ? (
                <BlurUpImage
                  src={product.images[0]?.url || '/placeholder-product.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  priority={index < 4} // LCP optimization for first 4 products
                  width={300}
                  height={400}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center" aria-hidden="true">
                  <span className="text-gray-400 text-sm font-medium">Resim Yok</span>
                </div>
              )}
            </Link>
            
            {/* Favorite Button with Micro Feedback */}
            <FavoriteButton
              isFavorite={favorites.has(product.id)}
              onToggle={() => toggleFavorite(product.id)}
              className="absolute top-3 right-3 z-10 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
              disabled={loadingStates.favorites.has(product.id)}
            >
              {favorites.has(product.id) ? (
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
              )}
            </FavoriteButton>
          </div>

          {/* Product Info - Premium typography */}
          <div className="p-3 sm:p-4">
            {/* Category - Micro typography */}
            <Link 
              href={`/categories/${product.category.slug}`}
              className="text-xs text-gray-600 font-medium hover:text-rose-600 transition-colors duration-200"
              aria-label={`Kategoriye git: ${product.category.name}`}
            >
              {product.category.name}
            </Link>
            
            {/* Product Name - Big type moment */}
            <Link href={`/products/${product.slug}`} aria-label={`Ürünü incele: ${product.name}`}>
              <h3 className="mt-1 text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors duration-200 leading-tight">
                {product.name}
              </h3>
            </Link>
            
            {/* Description - Micro typography */}
            {product.description && (
              <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
            
            {/* Price & CTA - Premium spacing */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-rose-600">
                  {formatCurrency(typeof product.price === 'number' ? product.price : product.price.toNumber())}
                </span>
                <span className="text-xs text-gray-500">KDV dahil</span>
              </div>
              
              {/* Add to Cart Button with Micro Feedback */}
              <AddToCartButton
                onAdd={() => handleAddToCart(product.id)}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 min-h-[44px] shadow-lg hover:shadow-xl"
                disabled={loadingStates.cart.has(product.id)}
              >
                <ShoppingCartIcon className="h-4 w-4" />
                {loadingStates.cart.has(product.id) ? (
                  <BrandedLoader 
                    variant="mini" 
                    size="sm" 
                    color="gradient" 
                    showIcon={false}
                    showShimmer={true}
                    className="p-0"
                  />
                ) : (
                  <>
                    <span className="hidden sm:inline">Sepete Ekle</span>
                    <span className="sm:hidden">Ekle</span>
                  </>
                )}
              </AddToCartButton>
            </div>
          </div>
          
          {/* Quick View Overlay - Hidden on mobile for cleaner UX */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-xl hidden lg:flex items-start justify-center pt-20 opacity-0 group-hover:opacity-100 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={`/products/${product.slug}`}
                className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200 pointer-events-auto"
                aria-label={`Ürün detaylarını gör: ${product.name}`}
              >
                Ürün detaylarını gör
              </Link>
            </motion.div>
          </div>
        </HoverCard>
      ))}
    </div>
  );
}