'use client';

import type { Product } from '@shared/types/product';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '../stores/cart.store';
import { useWishlistStore } from '../stores/wishlist.store';
import { useToast, ToastContainer } from './ToastNotification';
import { useState } from 'react';
import { calculatePriceInfo, formatPrice } from '../utils/price.utils';
import { useAuth } from '@clerk/nextjs';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const toast = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const handleClick = () => {
    router.push(`/products/${product.id}`);
  };

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
      <div 
        className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer ${className}`}
        onClick={handleClick}
      >
      {/* Product Image */}
      <div className="relative h-64 bg-gray-100 rounded-t-lg overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
            Öne Çıkan
          </div>
        )}
        
        {/* Discount Badge */}
        {priceInfo.hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            %{priceInfo.discountPercentage?.toFixed(0)} İndirim
          </div>
        )}
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

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
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

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stock Status */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Stok: {product.stockQuantity} adet
          </div>
          
                           {/* Quick Actions */}
                 <div className="flex gap-2">
                   <button 
                     onClick={async (e) => {
                       e.stopPropagation();
                       try {
                         setIsAddingToCart(true);
                         const token = (await getToken()) ?? undefined;
                         if (token) {
                           await addItem({
                             productId: product.id,
                             quantity: 1
                           }, token);
                         } else {
                           await addItem({
                             productId: product.id,
                             quantity: 1
                           });
                         }
                         toast.showSuccess('Ürün Sepete Eklendi! 🛒', `${product.name} sepete başarıyla eklendi.`);
                       } catch (error) {
                         console.error('Failed to add to cart:', error);
                         toast.showError('Sepet Hatası', 'Ürün sepete eklenirken bir hata oluştu.');
                       } finally {
                         setIsAddingToCart(false);
                       }
                     }}
                     disabled={isAddingToCart || product.stockQuantity === 0}
                     className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
                   >
                     {isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}
                   </button>
                   <button 
                     onClick={async (e) => {
                       e.stopPropagation();
                       try {
                         setIsTogglingWishlist(true);
                         const token = await getToken();
                         
                         if (isInWishlist(product.id)) {
                           await removeFromWishlist(product.id, token as any);
                           toast.showSuccess('Favorilerden Çıkarıldı', `${product.name} favorilerden çıkarıldı.`);
                         } else {
                           await addToWishlist(product, token as any);
                           toast.showSuccess('Favorilere Eklendi! ❤️', `${product.name} favorilere başarıyla eklendi.`);
                         }
                       } catch (error) {
                         console.error('Failed to toggle wishlist:', error);
                         toast.showError('Favori Hatası', 'Favori işlemi sırasında bir hata oluştu.');
                       } finally {
                         setIsTogglingWishlist(false);
                       }
                     }}
                     disabled={isTogglingWishlist}
                     className={`p-2 rounded text-sm transition-colors ${
                       isInWishlist(product.id)
                         ? 'bg-red-100 hover:bg-red-200 text-red-600 border border-red-300'
                         : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                     }`}
                     title={isInWishlist(product.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                   >
                     {isTogglingWishlist ? '...' : isInWishlist(product.id) ? '❤️' : '🤍'}
                   </button>
                 </div>
        </div>
      </div>
    </div>
    </>
  );
}
