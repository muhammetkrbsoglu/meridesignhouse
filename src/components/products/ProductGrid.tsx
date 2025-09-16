'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { ProductWithCategory } from '@/types/product';
import { addToCart, addToFavorites, removeFromFavorites, isProductInFavorites } from '@/lib/actions/cart';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface ProductGridProps {
  products: ProductWithCategory[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<{
    favorites: Set<string>;
    cart: Set<string>;
  }>({ favorites: new Set(), cart: new Set() });

  // Load favorite status for all products
  useEffect(() => {
    const loadFavorites = async () => {
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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6">
      {products.map((product) => (
        <div key={product.id} className="group relative bg-white rounded-lg border hover:shadow-lg transition-shadow duration-300">
          {/* Product Image */}
          <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
            <Link href={`/products/${product.slug}`} aria-label={`Ürün sayfasına git: ${product.name}`}>
              {product.images.length > 0 ? (
                <Image
                  src={product.images[0]?.url || '/placeholder-product.svg'}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center" aria-hidden="true">
                  <span className="text-gray-400 text-sm">Resim Yok</span>
                </div>
              )}
            </Link>
            
            {/* Favorite Button */}
            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              disabled={loadingStates.favorites.has(product.id)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
              aria-label={`${favorites.has(product.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}: ${product.name}`}
            >
              {favorites.has(product.id) ? (
                <HeartSolidIcon className="h-5 w-5 sm:h-5 sm:w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 sm:h-5 sm:w-5 text-gray-400 hover:text-red-500" />
              )}
            </button>
          </div>

          {/* Product Info */}
          <div className="p-2 sm:p-3">
            {/* Category */}
            <Link 
              href={`/categories/${product.category.slug}`}
              className="text-xs text-gray-700 font-medium hover:text-rose-600 transition-colors"
              aria-label={`Kategoriye git: ${product.category.name}`}
            >
              Kategori: {product.category.name}
            </Link>
            
            {/* Product Name */}
            <Link href={`/products/${product.slug}`} aria-label={`Ürünü incele: ${product.name}`}>
              <h3 className="mt-0.5 text-sm sm:text-base font-medium text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                {product.name}
              </h3>
            </Link>
            
            {/* Description */}
            {product.description && (
              <p className="mt-1 text-[11px] sm:text-xs text-gray-500 line-clamp-2">
                {product.description}
              </p>
            )}
            
            {/* Price */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold text-rose-600">
                {formatCurrency(typeof product.price === 'number' ? product.price : product.price.toNumber())}
              </span>
              
              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(product.id)}
                disabled={loadingStates.cart.has(product.id)}
                className="flex items-center space-x-1 px-3 py-2 sm:px-3 sm:py-1.5 bg-rose-600 text-white text-xs font-medium rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50"
                aria-label={`Sepete ekle: ${product.name}`}
              >
                <ShoppingCartIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span>{loadingStates.cart.has(product.id) ? 'Ekleniyor...' : 'Sepete Ekle'}</span>
              </button>
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
        </div>
      ))}
    </div>
  );
}