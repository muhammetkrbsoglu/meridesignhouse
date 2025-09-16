'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon, ShoppingCartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { ProductWithCategory } from '@/types/product';
import { addToCart, addToFavorites, removeFromFavorites, isProductInFavorites } from '@/lib/actions/cart';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRef } from 'react';

interface ProductDetailProps {
  product: ProductWithCategory;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 40;

  // Check if product is in favorites on component mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const favoriteStatus = await isProductInFavorites(product.id);
        setIsFavorite(favoriteStatus);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [product.id]);

  const toggleFavorite = async () => {
    setIsFavoriteLoading(true);
    
    try {
      if (isFavorite) {
        const result = await removeFromFavorites(product.id);
        if (result.success) {
          setIsFavorite(false);
          toast.success('Ürün favorilerden çıkarıldı');
          // Trigger favorite update event
          window.dispatchEvent(new Event('favoriteUpdated'));
        } else {
          toast.error(result.error || 'Bir hata oluştu');
        }
      } else {
        const result = await addToFavorites(product.id);
        if (result.success) {
          setIsFavorite(true);
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
      setIsFavoriteLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    try {
      const result = await addToCart(product.id, quantity);
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
      setIsLoading(false);
    }
  };

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || product.name,
          url: window.location.href,
        });
      } catch (_) {
        console.log('Paylaşım iptal edildi');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
      {/* Product Images */}
      <div className="space-y-3 lg:space-y-4">
        {/* Main Image */}
        <div
          className="aspect-square relative overflow-hidden rounded-lg bg-gray-100"
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
          onTouchStart={(e) => {
            const t = e.touches[0];
            touchStartX.current = t.clientX;
            touchStartY.current = t.clientY;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null || touchStartY.current === null) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartX.current;
            const dy = t.clientY - touchStartY.current;
            // Horizontal swipe with minimal vertical movement
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
              const total = product.product_images?.length || 0;
              if (total > 1) {
                if (dx < 0) {
                  setSelectedImageIndex((prev) => (prev + 1) % total);
                } else {
                  setSelectedImageIndex((prev) => (prev - 1 + total) % total);
                }
              }
            }
            touchStartX.current = null;
            touchStartY.current = null;
          }}
        >
          {product.product_images && product.product_images.length > 0 ? (
            <Image
              src={product.product_images[selectedImageIndex]?.url || '/placeholder-product.svg'}
              alt={product.product_images[selectedImageIndex]?.alt || product.name}
              fill
              className="object-cover transition-transform duration-300"
              sizes="(min-width:1024px) 50vw, 100vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">Resim Yok</span>
            </div>
          )}

          {/* Left/Right arrows on hover */}
          {product.product_images && product.product_images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImageIndex((prev) => (prev - 1 + (product.product_images?.length || 0)) % (product.product_images?.length || 1))}
                className={`hidden lg:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white items-center justify-center transition-all duration-300 ${isHover ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                aria-label="Önceki görsel"
              >
                ‹
              </button>
              <button
                onClick={() => setSelectedImageIndex((prev) => (prev + 1) % (product.product_images?.length || 1))}
                className={`hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white items-center justify-center transition-all duration-300 ${isHover ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}
                aria-label="Sonraki görsel"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Image Thumbnails */}
        {product.product_images && product.product_images.length > 1 && (
          <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2">
            {((product.product_images as Array<{ id?: string; url: string; alt?: string; sortOrder?: number }>) ?? [])
              .slice()
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
              .map((image, index: number) => (
              <button
                key={image.id || index}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-square relative overflow-hidden rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  selectedImageIndex === index
                    ? 'border-rose-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={image.url || '/placeholder-product.svg'}
                  alt={image.alt || `${product.name} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-5 pb-28 lg:pb-0">
        {/* Category */}
        <Link 
          href={`/categories/${product.category.slug}`}
          className="text-sm text-rose-600 hover:text-rose-700 font-medium"
        >
          {product.category.name}
        </Link>

        {/* Product Name */}
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {product.name}
        </h1>

        {/* Price */}
        <div className="text-2xl lg:text-3xl font-bold text-rose-600">
          {formatCurrency(typeof product.price === 'number' ? product.price : product.price.toNumber())}
        </div>

        {/* Description */}
        {product.description && (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="space-y-3 hidden lg:block">
          <label className="text-sm font-medium text-gray-900">
            Adet
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              -
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 hidden lg:block">
          {/* Add to Cart */}
          <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 text-lg font-medium disabled:opacity-50"
            size="lg"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-2" />
            {isLoading ? 'Ekleniyor...' : 'Sepete Ekle'}
          </Button>

          {/* Secondary Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={toggleFavorite}
              disabled={isFavoriteLoading}
              variant="outline"
              className="flex-1 disabled:opacity-50"
            >
              {isFavorite ? (
                <HeartSolidIcon className="h-5 w-5 mr-2 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 mr-2" />
              )}
              {isFavoriteLoading ? 'İşleniyor...' : (isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle')}
            </Button>
            
            <Button
              onClick={shareProduct}
              variant="outline"
              className="flex-1"
            >
              <ShareIcon className="h-5 w-5 mr-2" />
              Paylaş
            </Button>
          </div>
        </div>

        {/* Product Features */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ürün Özellikleri
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
              Ücretsiz kargo (150 TL üzeri)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
              30 gün iade garantisi
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
              Güvenli ödeme
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
              Hızlı teslimat
            </li>
          </ul>
        </div>
      </div>

      {/* Sticky Bottom CTA (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[999] bg-white/95 backdrop-blur supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)] border-t">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-rose-600">
              {formatCurrency(typeof product.price === 'number' ? product.price : product.price.toNumber())}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center"
                aria-label="Adet azalt"
              >
                -
              </button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center"
                aria-label="Adet artır"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleFavorite}
              disabled={isFavoriteLoading}
              className="shrink-0 w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center disabled:opacity-50"
              aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            >
              {isFavorite ? (
                <HeartSolidIcon className="h-6 w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="flex-1 h-12 rounded-lg bg-rose-600 text-white font-semibold disabled:opacity-50"
              aria-label="Sepete ekle"
            >
              {isLoading ? 'Ekleniyor...' : 'Sepete Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}