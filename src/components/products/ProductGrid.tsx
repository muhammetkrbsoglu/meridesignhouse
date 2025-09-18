'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { ProductWithCategory } from '@/types/product';
import { addToCart, addToFavorites, removeFromFavorites, isProductInFavorites } from '@/lib/api/cartClient';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { ProductGridSkeleton } from '@/components/ui/SkeletonLoader';
import { useMicroAnimations } from '@/hooks/useMicroAnimations';
import { LazyImage, ProductImage } from '@/components/ui/LazyImage';
import { responsiveTypography, responsiveGrid, responsiveSpacing } from '@/lib/responsive-typography';
import { useDesktopAnimations } from '@/hooks/useDesktopAnimations';
import { useProductInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: ProductWithCategory[];
  loading?: boolean;
  skeletonCount?: number;
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => Promise<void>;
}

export function ProductGrid({ products, loading = false, skeletonCount = 8, enableInfiniteScroll = false, onLoadMore }: ProductGridProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [featuredCount, setFeaturedCount] = useState<number>(6);
  const [loadingStates, setLoadingStates] = useState<{
    favorites: Set<string>;
    cart: Set<string>;
  }>({ favorites: new Set(), cart: new Set() });
  
  const { createCardAnimation, createButtonAnimation } = useMicroAnimations();
  const { createCardHoverAnimation, createStaggerAnimation } = useDesktopAnimations();
  
  // Infinite scroll setup
  const {
    containerRef,
    triggerRef,
    isLoading: infiniteLoading,
    hasMore,
    error,
    retry,
    displayedProducts,
    totalProducts
  } = useProductInfiniteScroll(
    products,
    onLoadMore,
    {
      enabled: enableInfiniteScroll,
      batchSize: 12,
      threshold: 0.1,
      rootMargin: '200px'
    }
  );

  const displayProducts = enableInfiniteScroll ? displayedProducts : products;

  // Load favorite status for displayed products
  useEffect(() => {
    const loadFavorites = async () => {
      const favoriteStatuses = await Promise.all(
        displayProducts.map(async (product) => {
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
    };

    if (displayProducts.length > 0) {
      loadFavorites();
    }
  }, [displayProducts]);

  // Dynamically compute featuredCount by viewport width
  useEffect(() => {
    const compute = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      // md: 768px, lg: 1024px, xl: 1280px; tune featured threshold by width
      if (w >= 1536) setFeaturedCount(10); // 2 rows featured on very large
      else if (w >= 1280) setFeaturedCount(8);
      else if (w >= 1024) setFeaturedCount(6);
      else if (w >= 768) setFeaturedCount(4);
      else setFeaturedCount(3); // mobile minimal, though hover applies only desktop
    };
    compute();
    window.addEventListener('resize', compute, { passive: true } as any);
    return () => window.removeEventListener('resize', compute as any);
  }, []);

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
          toast({ intent: 'success', description: 'Ürün favorilerden çıkarıldı' });
          // Trigger favorite update event
          window.dispatchEvent(new Event('favoriteUpdated'));
        } else {
          toast({ intent: 'error', description: result.error || 'Bir hata oluştu' });
        }
      } else {
        const result = await addToFavorites(productId);
        if (result.success) {
          setFavorites(prev => new Set([...prev, productId]));
          toast({ intent: 'success', description: 'Ürün favorilere eklendi' });
          // Trigger favorite update event
          window.dispatchEvent(new Event('favoriteUpdated'));
        } else {
          toast({ intent: 'error', description: result.error || 'Bir hata oluştu' });
        }
      }
    } catch (_) {
      toast({ intent: 'error', description: 'Bir hata oluştu' });
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
        toast({ intent: 'success', description: 'Ürün sepete eklendi' });
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' });
      }
    } catch (_) {
      toast({ intent: 'error', description: 'Bir hata oluştu' });
    } finally {
      setLoadingStates(prev => {
        const newCart = new Set(prev.cart);
        newCart.delete(productId);
        return { ...prev, cart: newCart };
      });
    }
  };

  // Show skeleton loader while loading
  if (loading) {
    return <ProductGridSkeleton count={skeletonCount} />;
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
    <div ref={containerRef} className={cn(responsiveGrid.productGrid, responsiveSpacing.grid)}>
      {displayProducts.map((product, index) => (
        <motion.div 
          key={product.id} 
          className="group relative bg-white rounded-lg border hover:shadow-lg transition-shadow duration-300"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: index < featuredCount ? index * 0.08 : 0, duration: index < featuredCount ? 0.5 : 0.3, ease: "easeOut" }}
          whileHover={{ scale: index < featuredCount ? 1.03 : 1.01, y: index < featuredCount ? -4 : -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            // Haptic feedback for card tap
            if (navigator.vibrate) {
              navigator.vibrate(50)
            }
          }}
        >
          {/* Product Image */}
          <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
            <Link href={`/products/${product.slug}`} aria-label={`Ürün sayfasına git: ${product.name}`}>
              {product.images.length > 0 ? (
                <ProductImage
                  src={product.images[0]?.url || '/placeholder-product.svg'}
                  alt={product.name}
                  className="group-hover:scale-105 transition-transform duration-300"
                  sizes="(min-width: 1280px) 33vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center" aria-hidden="true">
                  <span className="text-gray-400 text-sm">Resim Yok</span>
                </div>
              )}
            </Link>
            
            {/* Favorite Button */}
            <motion.button
              type="button"
              disabled={loadingStates.favorites.has(product.id)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
              aria-label={`${favorites.has(product.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}: ${product.name}`}
              {...createButtonAnimation({
                hapticType: 'success',
                hapticMessage: `${favorites.has(product.id) ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi'}: ${product.name}`
              })}
              onClick={() => toggleFavorite(product.id)}
            >
              {favorites.has(product.id) ? (
                <HeartSolidIcon className="h-5 w-5 sm:h-5 sm:w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 sm:h-5 sm:w-5 text-gray-400 hover:text-red-500" />
              )}
            </motion.button>
          </div>

          {/* Product Info */}
          <div className={cn(responsiveSpacing.card, 'p-2 sm:p-3')}>
            {/* Category */}
            <Link 
              href={`/categories/${product.category.slug}`}
              className={cn(responsiveTypography.caption, 'text-gray-700 font-medium hover:text-rose-600 transition-colors')}
              aria-label={`Kategoriye git: ${product.category.name}`}
            >
              Kategori: {product.category.name}
            </Link>
            
            {/* Product Name */}
            <Link href={`/products/${product.slug}`} aria-label={`Ürünü incele: ${product.name}`}>
              <h3 className={cn(responsiveTypography.h5, 'mt-0.5 text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors')}>
                {product.name}
              </h3>
            </Link>
            
            {/* Description */}
            {product.description && (
              <p className={cn(responsiveTypography.caption, 'mt-1 text-gray-500 line-clamp-2')}>
                {product.description}
              </p>
            )}
            
            {/* Price */}
            <div className="mt-3 flex items-center justify-between">
              <span className={cn(responsiveTypography.h4, 'font-semibold text-rose-600')}>
                {formatCurrency(typeof product.price === 'number' ? product.price : product.price.toNumber())}
              </span>
              
              {/* Add to Cart Button */}
              <motion.button
                disabled={loadingStates.cart.has(product.id)}
                className="flex items-center space-x-1 px-3 py-2 sm:px-3 sm:py-1.5 bg-rose-600 text-white text-xs font-medium rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50"
                aria-label={`Sepete ekle: ${product.name}`}
                {...createButtonAnimation({
                  hapticType: 'success',
                  hapticMessage: `Sepete eklendi: ${product.name}`
                })}
                onClick={() => handleAddToCart(product.id)}
              >
                <ShoppingCartIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span>{loadingStates.cart.has(product.id) ? 'Ekleniyor...' : 'Sepete Ekle'}</span>
              </motion.button>
            </div>
          </div>
          
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg hidden sm:flex items-start justify-center pt-18 opacity-0 group-hover:opacity-100 pointer-events-none">
            <Link
              href={`/products/${product.slug}`}
              className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-md shadow-lg hover:bg-gray-50 transition-transform duration-300 pointer-events-auto"
              aria-label={`Ürün detaylarını gör: ${product.name}`}
            >
              Ürün detaylarını gör
            </Link>
          </div>
        </motion.div>
      ))}
      
      {/* Infinite scroll trigger and loading states */}
      {enableInfiniteScroll && (
        <>
          {/* Loading trigger element */}
          <div ref={triggerRef} className="col-span-full flex justify-center py-8">
            {infiniteLoading && (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
                <span className="text-sm">Daha fazla ürün yükleniyor...</span>
              </div>
            )}
          </div>
          
          {/* Error state */}
          {error && (
            <div className="col-span-full text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={retry}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          )}
          
          {/* End of results */}
          {!hasMore && displayProducts.length > 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 text-sm">Tüm ürünler yüklendi ({displayProducts.length} ürün)</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

