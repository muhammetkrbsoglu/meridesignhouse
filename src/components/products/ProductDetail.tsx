'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HeartIcon, ShoppingCartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { ProductWithCategory } from '@/types/product';
import { addToCart, addToFavorites, removeFromFavorites, isProductInFavorites } from '@/lib/api/cartClient';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { MicroFeedback } from '@/components/motion/MicroFeedback';
import { LoadingSpinner } from '@/components/motion/LoadingStates';
import { ProductMediaCarousel, type ProductMediaItem } from '@/components/products/ProductMediaCarousel';

interface ProductDetailProps {
  product: ProductWithCategory;
}

export function ProductDetail({ product }: ProductDetailProps) {


  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const mediaItems = useMemo<ProductMediaItem[]>(() => (
    (product.product_images ?? []).map((image, index) => ({
      id: image?.id ?? index,
      url: image?.url || '/placeholder-product.svg',
      alt: image?.alt ?? product.name,
      sortOrder: image?.sortOrder ?? index,
    }))
  ), [product.product_images, product.name])




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
          toast.success('�r�n favorilerden ��kar�ld�');
          // Trigger favorite update event
          window.dispatchEvent(new Event('favoriteUpdated'));
        } else {
          toast.error(result.error || 'Bir hata olu�tu');
        }
      } else {
        const result = await addToFavorites(product.id);
        if (result.success) {
          setIsFavorite(true);
          toast.success('�r�n favorilere eklendi');
          // Trigger favorite update event
          window.dispatchEvent(new Event('favoriteUpdated'));
        } else {
          toast.error(result.error || 'Bir hata olu�tu');
        }
      }
    } catch (_) {
      toast.error('Bir hata olu�tu');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    try {
      const result = await addToCart(product.id, quantity);
      if (result.success) {
        toast.success('�r�n sepete eklendi');
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error(result.error || 'Bir hata olu�tu');
      }
    } catch (_) {
      toast.error('Bir hata olu�tu');
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
        console.log('Payla��m iptal edildi');
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
      <ProductMediaCarousel items={mediaItems} />

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
          <MicroFeedback
            hapticType="success"
            hapticMessage="�r�n sepete eklendi"
            disabled={isLoading}
            onClick={handleAddToCart}
            className="w-full"
          >
            <Button
              disabled={isLoading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 text-lg font-medium disabled:opacity-50"
              size="lg"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Ekleniyor...
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Sepete Ekle
                </>
              )}
            </Button>
          </MicroFeedback>

          {/* Secondary Actions */}
          <div className="flex space-x-3">
            <MicroFeedback
              hapticType={isFavorite ? "warning" : "success"}
              hapticMessage={isFavorite ? "Favorilerden ��kar�ld�" : "Favorilere eklendi"}
              disabled={isFavoriteLoading}
              onClick={toggleFavorite}
              className="flex-1"
            >
              <Button
                disabled={isFavoriteLoading}
                variant="outline"
                className="flex-1 disabled:opacity-50"
              >
                {isFavoriteLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="gray" className="mr-2" />
                    ��leniyor...
                  </>
                ) : (
                  <>
                    {isFavorite ? (
                      <HeartSolidIcon className="h-5 w-5 mr-2 text-red-500" />
                    ) : (
                      <HeartIcon className="h-5 w-5 mr-2" />
                    )}
                    {isFavorite ? 'Favorilerden ��kar' : 'Favorilere Ekle'}
                  </>
                )}
              </Button>
            </MicroFeedback>
            
            <Button
              onClick={shareProduct}
              variant="outline"
              className="flex-1"
            >
              <ShareIcon className="h-5 w-5 mr-2" />
              Payla�
            </Button>
          </div>
        </div>

        {/* Product Features */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            �r�n �zellikleri
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
              �cretsiz kargo (150 TL �zeri)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
              30 g�n iade garantisi
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
              G�venli �deme
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
              H�zl� teslimat
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
                aria-label="Adet art�r"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <MicroFeedback
              hapticType={isFavorite ? "warning" : "success"}
              hapticMessage={isFavorite ? "Favorilerden ��kar�ld�" : "Favorilere eklendi"}
              disabled={isFavoriteLoading}
              onClick={toggleFavorite}
              className="shrink-0"
            >
              <button
                disabled={isFavoriteLoading}
                className="shrink-0 w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center disabled:opacity-50"
                aria-label={isFavorite ? 'Favorilerden ��kar' : 'Favorilere ekle'}
              >
                {isFavoriteLoading ? (
                  <LoadingSpinner size="sm" color="gray" />
                ) : isFavorite ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6" />
                )}
              </button>
            </MicroFeedback>
            <MicroFeedback
              hapticType="success"
              hapticMessage="�r�n sepete eklendi"
              disabled={isLoading}
              onClick={handleAddToCart}
              className="flex-1"
            >
              <button
                disabled={isLoading}
                className="flex-1 h-12 rounded-lg bg-rose-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center"
                aria-label="Sepete ekle"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Ekleniyor...
                  </>
                ) : (
                  'Sepete Ekle'
                )}
              </button>
            </MicroFeedback>
          </div>
        </div>
      </div>
    </div>
  );
}



