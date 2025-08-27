'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { Product } from '@shared/types/product';
import { ProductService } from '../../../services/product.service';
import { useCartStore } from '../../../stores/cart.store';
import { useWishlistStore } from '../../../stores/wishlist.store';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { calculatePriceInfo, formatPrice } from '../../../utils/price.utils';
import { useToast, ToastContainer } from '../../../components/ToastNotification';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  // Store hooks
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const toast = useToast();

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const productData = await ProductService.getProduct(productId);
      setProduct(productData);
    } catch (err) {
      setError('Ürün yüklenirken bir hata oluştu.');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const { getToken } = useAuth();

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      setAddingToCart(true);
      let token: string | undefined = undefined;
      try {
        token = (await getToken()) ?? undefined;
      } catch {}
      if (token !== undefined) {
        await addItem({
          productId: product.id,
          quantity,
          designData: undefined,
        }, token as any);
      } else {
        await addItem({
          productId: product.id,
          quantity,
          designData: undefined,
        });
      }
      alert('Ürün sepete eklendi!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Ürün sepete eklenirken bir hata oluştu.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    
    try {
      setAddingToWishlist(true);
      
      // Get token if available
      let token: string | undefined = undefined;
      try {
        token = (await getToken()) ?? undefined;
      } catch {}
      
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id, token as any);
        toast.showSuccess('Favorilerden Çıkarıldı', `${product.name} favorilerden çıkarıldı.`);
      } else {
        await addToWishlist(product, token as any);
        toast.showSuccess('Favorilere Eklendi! ❤️', `${product.name} favorilere başarıyla eklendi.`);
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      alert('Favori işlemi sırasında bir hata oluştu.');
    } finally {
      setAddingToWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Ürün yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error || 'Ürün bulunamadı'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const priceInfo = calculatePriceInfo(
    product.price,
    product.discountPrice,
    product.discountPercentage
  );

  return (
    <>
      <ToastContainer
        notifications={toast.notifications}
        onClose={toast.removeToast}
      />
      <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <button onClick={() => router.push('/')} className="hover:text-gray-700">
                  Ana Sayfa
                </button>
              </li>
              <li>/</li>
              <li>
                <button onClick={() => router.push('/products')} className="hover:text-gray-700">
                  Ürünler
                </button>
              </li>
              {product.category && (
                <>
                  <li>/</li>
                  <li>
                    <button 
                      onClick={() => router.push(`/categories/${product.category!.slug}`)} 
                      className="hover:text-gray-700"
                    >
                      {product.category.name}
                    </button>
                  </li>
                </>
              )}
              <li>/</li>
              <li className="text-gray-900 font-medium">{product.name}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {/* Main Image */}
              <motion.div 
                className="relative h-96 bg-gray-100 rounded-lg overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </motion.div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 ${
                        selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Badges */}
              <div className="flex gap-2">
                {product.isFeatured && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    Öne Çıkan
                  </motion.span>
                )}
                {priceInfo.hasDiscount && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    %{priceInfo.discountPercentage?.toFixed(0)} İndirim
                  </motion.span>
                )}
              </div>

              {/* Product Name */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-3xl font-bold text-gray-900"
              >
                {product.name}
              </motion.h1>

              {/* Category */}
              {product.category && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="text-sm text-gray-500"
                >
                  Kategori: <span className="text-blue-600">{product.category.name}</span>
                </motion.div>
              )}

              {/* Price */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-2"
              >
                {priceInfo.hasDiscount ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-red-600">
                      {formatPrice(priceInfo.finalPrice)}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(priceInfo.originalPrice)}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(priceInfo.finalPrice)}
                  </span>
                )}
              </motion.div>

              {/* Description */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Açıklama</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </motion.div>

              {/* Product Details */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="grid grid-cols-2 gap-4"
              >
                {product.dimensions && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Boyutlar:</span>
                    <p className="text-gray-900">{product.dimensions}</p>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Ağırlık:</span>
                    <p className="text-gray-900">{product.weight}</p>
                  </div>
                )}
                {product.material && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Materyal:</span>
                    <p className="text-gray-900">{product.material}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Stok:</span>
                  <p className="text-gray-900">{product.stockQuantity} adet</p>
                </div>
              </motion.div>

              {/* Care Instructions */}
              {product.careInstructions && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bakım Talimatları</h3>
                  <p className="text-gray-600">{product.careInstructions}</p>
                </motion.div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Etiketler</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 1.3 + index * 0.1 }}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="space-y-4"
              >
                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Adet:</label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800"
                    >
                      -
                    </motion.button>
                    <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800"
                    >
                      +
                    </motion.button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={product.stockQuantity === 0 || addingToCart}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingToCart ? 'Ekleniyor...' : 
                     product.stockQuantity === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleWishlist}
                    disabled={addingToWishlist}
                    className={`p-3 border rounded-lg transition-colors ${
                      isInWishlist(product.id) 
                        ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title={isInWishlist(product.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                  >
                    {addingToWishlist ? '...' : isInWishlist(product.id) ? '❤️' : '🤍'}
                  </motion.button>
                </div>

                {/* Stock Warning */}
                {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.5 }}
                    className="text-orange-600 text-sm"
                  >
                    ⚠️ Sadece {product.stockQuantity} adet kaldı!
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
