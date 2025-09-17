'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

import { addToCart, addToFavorites, removeFromFavorites, isProductInFavorites } from '@/lib/actions/cart'
import { toast } from 'sonner'
import { SimpleProduct } from '@/types/product'
import { useDesktopAnimations } from '@/hooks/useDesktopAnimations'

interface NewArrivalsProps {
  products: SimpleProduct[]
}

export function NewArrivals({ products }: NewArrivalsProps) {
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
          toast.success('Ürün favorilerden çıkarıldı');
          // Trigger favorite update event
          window.dispatchEvent(new Event('favoriteUpdated'));
        } else {
          toast.error(result.error || 'Bir hata oluştu');
        }
      } else {
        const result = await addToFavorites(productId);
        if (result.success) {
          setFavorites(prev => new Set([...prev, productId]));
          toast.success('Ürün favorilere eklendi');
          // Trigger favorite update event
          window.dispatchEvent(new Event('favoriteUpdated'));
        } else {
          toast.error(result.error || 'Bir hata oluştu');
        }
      }
    } catch (_) {
      toast.error('Bir hata oluştu');
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
        toast.success('Ürün sepete eklendi');
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (_) {
      toast.error('Bir hata oluştu');
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
      <section className="py-20 bg-gradient-to-b from-rose-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-4">Yeni Gelenler</h2>
            <p className="text-gray-600">Henüz yeni ürün bulunmuyor.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            🆕 Yeni Koleksiyon
          </motion.div>
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Yeni Gelenler
          </motion.h2>
          <motion.p 
            className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            En yeni koleksiyonumuzdan seçkin ürünleri keşfedin
          </motion.p>
        </div>

        {/* Products Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16"
          {...createStaggerAnimation({ contextLevel: 'featured' })}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.2 }}
              {...createCardHoverAnimation({ contextLevel: 'featured' })}
            >
              <div className="relative overflow-hidden rounded-t-2xl aspect-square">
                <Link href={`/products/${product.slug}`}>
                  <Image
                    src={product.images[0] || '/placeholder-product.svg'}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </Link>
                {/* Favorite Button (fixed top-right) */}
                <button
                  type="button"
                  className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
                  onClick={() => toggleFavorite(product.id)}
                  disabled={loadingStates.favorites.has(product.id)}
                  aria-label="Favoriye ekle"
                >
                  {loadingStates.favorites.has(product.id) ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : favorites.has(product.id) ? (
                    <HeartSolidIcon className="w-5 h-5 text-rose-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {/* Overlay Quick View only */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
                  <Link
                    href={`/products/${product.slug}`}
                    className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-md shadow-lg hover:bg-gray-50 transition-colors"
                  >
                    Ürün detaylarını gör
                  </Link>
                </div>

                {/* New Badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg animate-pulse">
                    ✨ Yeni
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3">
                  <span className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">
                    {product.category.name}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg group-hover:text-rose-600 transition-colors duration-300">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                      ₺{product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="/products">
              <button className="group bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
                Tüm Yeni Ürünleri Keşfet
                <svg className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 inline-block group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}