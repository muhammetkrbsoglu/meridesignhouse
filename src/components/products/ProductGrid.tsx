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
    <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
      {displayProducts.map((product, index) => (
        <motion.div 
          key={product.id} 
          className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-out overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ 
            delay: index * 0.05, 
            duration: 0.4, 
            ease: "easeOut" 
          }}
          whileHover={{ 
            scale: 1.02, 
            y: -8,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
          whileTap={{ 
            scale: 0.98,
            transition: { duration: 0.1 }
          }}
          style={{
            willChange: 'transform, box-shadow'
          }}
          onClick={() => {
            // Haptic feedback for card tap
            if (navigator.vibrate) {
              navigator.vibrate(50)
            }
          }}
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-t-2xl">
            <Link href={`/products/${product.slug}`} aria-label={`Ürün sayfasına git: ${product.name}`}>
              {product.images.length > 0 ? (
                <ProductImage
                  src={product.images[0]?.url || '/placeholder-product.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center" aria-hidden="true">
                  <span className="text-gray-400 text-sm font-medium">Resim Yok</span>
                </div>
              )}
            </Link>
            
            {/* Favorite Button */}
            <motion.button
              type="button"
              disabled={loadingStates.favorites.has(product.id)}
              className="absolute top-3 right-3 z-10 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
              aria-label={`${favorites.has(product.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}: ${product.name}`}
              {...createButtonAnimation({
                hapticType: 'success',
                hapticMessage: `${favorites.has(product.id) ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi'}: ${product.name}`
              })}
              onClick={() => toggleFavorite(product.id)}
            >
              {favorites.has(product.id) ? (
                <HeartSolidIcon className="h-5 w-5 text-rose-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-600 hover:text-rose-500" />
              )}
            </motion.button>

            {/* Overlay Quick View */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
              <Link
                href={`/products/${product.slug}`}
                className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-md shadow-lg hover:bg-gray-50 transition-colors pointer-events-auto"
                aria-label={`Ürün detaylarını gör: ${product.name}`}
              >
                Ürün detaylarını gör
              </Link>
            </div>

            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <span className="inline-block max-w-[70%] truncate bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
                {product.category.name}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-6">
            {/* Product Name */}
            <Link href={`/products/${product.slug}`} aria-label={`Ürünü incele: ${product.name}`}>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 hover:text-rose-600 transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>
            
            {/* Description */}
            {product.description && (
              <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
            
            {/* Price and Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                  {formatCurrency(typeof product.price === 'number' ? product.price : product.price.toNumber())}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs sm:text-sm text-gray-500 line-through">
                    {formatCurrency(typeof product.originalPrice === 'number' ? product.originalPrice : product.originalPrice.toNumber())}
                  </span>
                )}
              </div>
              
              {/* Add to Cart Button */}
              <motion.button
                type="button"
                disabled={loadingStates.cart.has(product.id)}
                className="p-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Sepete ekle: ${product.name}`}
                {...createButtonAnimation({
                  hapticType: 'success',
                  hapticMessage: `Sepete eklendi: ${product.name}`
                })}
                onClick={() => handleAddToCart(product.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loadingStates.cart.has(product.id) ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingCartIcon className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            {/* Stock Status */}
            <div className="flex items-center justify-between text-xs">
              <span className={`px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                product.stock > 10 
                  ? 'bg-green-100 text-green-800' 
                  : product.stock > 0 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 10 ? 'Stokta' : product.stock > 0 ? 'Az Stokta' : 'Stokta Yok'}
              </span>
              {product.stock > 0 && (
                <span className="text-gray-500 whitespace-nowrap">
                  {product.stock} adet
                </span>
              )}
            </div>
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

