'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useWishlistStore } from '../../stores/wishlist.store';
import { useCartStore } from '../../stores/cart.store';
import { useToast, ToastContainer } from '../../components/ToastNotification';
import type { Product } from '@shared/types/product';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { calculatePriceInfo, formatPrice } from '../../utils/price.utils';

export default function FavoritesPage() {
  const { isSignedIn, getToken } = useAuth();
  const { items, loading, error, loadWishlist, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const toast = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      loadWishlist();
    }
  }, [isSignedIn, loadWishlist]);

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const token = await getToken();
      if (token) {
        await removeItem(productId, token);
        toast.showSuccess('Favorilerden Çıkarıldı', 'Ürün favorilerden başarıyla çıkarıldı.');
      } else {
        toast.showError('Hata', 'Kimlik doğrulama token\'ı bulunamadı.');
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast.showError('Hata', 'Ürün favorilerden çıkarılırken bir hata oluştu.');
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      setIsAddingToCart(product.id);
      const token = await getToken();
      
      if (token) {
        await addItem({
          productId: product.id,
          quantity: 1,
          designData: undefined,
        }, token);
      } else {
        await addItem({
          productId: product.id,
          quantity: 1,
          designData: undefined,
        });
      }
      
      toast.showSuccess('Sepete Eklendi! 🛒', `${product.name} sepete başarıyla eklendi.`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.showError('Sepet Hatası', 'Ürün sepete eklenirken bir hata oluştu.');
    } finally {
      setIsAddingToCart(null);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p className="text-lg">Favorilerinizi görmek için giriş yapmanız gerekiyor.</p>
              <p className="text-sm mt-2">Giriş yaptıktan sonra favori ürünlerinizi buradan görüntüleyebilirsiniz.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Favoriler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>Hata: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        notifications={toast.notifications}
        onClose={toast.removeToast}
      />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Favorilerim ❤️</h1>
              <p className="text-lg text-gray-600">
                {items.length > 0 
                  ? `${items.length} ürün favorilerinizde bulunuyor`
                  : 'Henüz favori ürününüz bulunmuyor'
                }
              </p>
            </motion.div>

            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center py-16"
              >
                <div className="text-gray-400 mb-4">
                  <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Favori Ürününüz Yok</h3>
                <p className="text-gray-500 mb-6">Beğendiğiniz ürünleri favorilere ekleyerek buradan kolayca erişebilirsiniz.</p>
                <a
                  href="/products"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Ürünleri Keşfet
                </a>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {items.map((item, index) => {
                  const product = item.product;
                  const priceInfo = calculatePriceInfo(
                    product.price,
                    product.discountPrice,
                    product.discountPercentage
                  );

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Product Image */}
                      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Remove from favorites button */}
                        <button
                          onClick={() => handleRemoveFromWishlist(product.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          title="Favorilerden Çıkar"
                        >
                          ❌
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        {/* Category */}
                        {product.category && (
                          <div className="text-sm text-gray-500 mb-2">
                            {product.category.name}
                          </div>
                        )}

                        {/* Product Name */}
                        <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
                          {product.name}
                        </h3>

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-4">
                          {priceInfo.hasDiscount ? (
                            <>
                              <span className="text-lg font-bold text-red-600">
                                {formatPrice(priceInfo.finalPrice)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(priceInfo.originalPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-800">
                              {formatPrice(priceInfo.finalPrice)}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={isAddingToCart === product.id || product.stockQuantity === 0}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded text-sm font-semibold transition-colors"
                          >
                            {isAddingToCart === product.id ? 'Ekleniyor...' : 
                             product.stockQuantity === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
                          </button>
                        </div>

                        {/* Stock Status */}
                        <div className="mt-3 text-sm text-gray-500">
                          Stok: {product.stockQuantity} adet
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
