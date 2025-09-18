'use client';

import Link from 'next/link'
import Image from 'next/image'

import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { addToCart, addToFavorites, removeFromFavorites, isProductInFavorites } from '@/lib/api/cartClient'
import { formatCurrency } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { FeaturedProduct } from '@/types/product'
import { motion } from 'framer-motion'
import { useDesktopAnimations } from '@/hooks/useDesktopAnimations'

interface FeaturedProductsProps {
  products: FeaturedProduct[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<{
    favorites: Set<string>;
    cart: Set<string>;
  }>({ favorites: new Set(), cart: new Set() });
  
  const { createCardHoverAnimation, createStaggerAnimation } = useDesktopAnimations();

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

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 shadow-lg">
            ⭐ Öne Çıkan Koleksiyon
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Öne Çıkan Ürünler
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            En popüler ve trend ürünlerimizi keşfedin. Kalite ve şıklığın buluştuğu özel koleksiyonumuz.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
          {...createStaggerAnimation({ contextLevel: 'featured' })}
        >
          {products.map((product, index) => (
            <motion.div 
              key={product.id} 
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ 
                delay: index * 0.1, 
                duration: 0.5, 
                ease: "easeOut" 
              }}
              {...createCardHoverAnimation({ contextLevel: 'featured' })}
            >
              <div className="relative aspect-square overflow-hidden rounded-t-2xl">
                <Link href={`/products/${product.slug}`} aria-label={`Ürün sayfasına git: ${product.name}`}>
                  <Image
                    src={product.imageUrl || '/placeholder-product.svg'}
                    alt={product.name}
                    fill
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                {/* Favorite Button (fixed top-right) */}
                <button 
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  disabled={loadingStates.favorites.has(product.id)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
                  aria-label={favorites.has(product.id) ? `Favorilerden çıkar: ${product.name}` : `Favorilere ekle: ${product.name}`}
                >
                  {favorites.has(product.id) ? (
                    <HeartSolidIcon className="h-5 w-5 text-rose-500" />
                  ) : (
                    <HeartIcon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                
                {/* Overlay Quick View only */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                  <Link
                    href={`/products/${product.slug}`}
                    className="px-4 py-2 bg_white text-gray-900 text-sm font-medium rounded-md shadow-lg hover:bg-gray-50 transition-colors pointer-events-auto"
                    aria-label={`Ürün detaylarını gör: ${product.name}`}
                  >
                    Ürün detaylarını gör
                  </Link>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
                    {product.category.name}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <Link href={`/products/${product.slug}`} aria-label={`Ürünü incele: ${product.name}`}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-rose-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                      {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      %{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)} İndirim
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleAddToCart(product.id)}
                  disabled={loadingStates.cart.has(product.id)}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl"
                  aria-label={`Sepete ekle: ${product.name}`}
                >
                  {loadingStates.cart.has(product.id) ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Ekleniyor...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <ShoppingCartIcon className="h-4 w-4 mr-2" />
                      Sepete Ekle
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-16">
          <Link href="/products" aria-label="Tüm ürünleri keşfet sayfasına git">
            <button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
              <span className="flex items-center justify-center">
                Tüm Ürünleri Keşfet
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

