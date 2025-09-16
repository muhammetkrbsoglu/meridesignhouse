'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { fetchFeaturedProductsForCategory, fetchWeeklyFeaturedProduct } from '@/lib/actions/menu';
import { formatCurrency } from '@/lib/utils';

interface CategoryMegaMenuProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    children: any[];
  };
  isOpen: boolean;
  onClose: () => void;
  onHoverChange: (isHovered: boolean) => void;
}

interface MenuProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  categories: {
    name: string;
    slug: string;
  }[];
}

export default function CategoryMegaMenu({ 
  category, 
  isOpen, 
  onClose, 
  onHoverChange 
}: CategoryMegaMenuProps) {
  const [featuredProducts, setFeaturedProducts] = useState<MenuProduct[]>([]);
  const [weeklyFeaturedProduct, setWeeklyFeaturedProduct] = useState<MenuProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          // Haftanın ürününü yükle
          const weeklyProduct = await fetchWeeklyFeaturedProduct(category.id);
          setWeeklyFeaturedProduct(weeklyProduct);

          // Öne çıkan ürünleri yükle
          const products = await fetchFeaturedProductsForCategory(category.id, 4);
          setFeaturedProducts(products);
        } catch (error) {
          console.error('Ürünler yüklenirken hata:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProducts();
  }, [isOpen, category.id]);

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  if (!isOpen) return null;

  // Kategori hiyerarşisini render et
  const renderCategoryTree = (categories: any[], level: number = 0) => {
    if (!categories || categories.length === 0) return null;

    return (
      <ul className={`space-y-1 ${level > 0 ? 'ml-4' : ''}`}>
        {categories.map((cat, index) => (
          <li key={cat.id} className="animate-fadeInUp" style={{ animationDelay: `${index * 50}ms` }}>
            <Link
              href={`/categories/${cat.slug}`}
              className={`block p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                level === 0 
                  ? 'text-gray-700 hover:text-rose-600 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:shadow-sm font-medium text-sm' 
                  : 'text-gray-600 hover:text-rose-600 hover:bg-rose-50 text-sm font-medium'
              }`}
              onClick={onClose}
            >
              <div className="flex items-center justify-between">
                <span>{cat.name}</span>
                {cat.children && cat.children.length > 0 && (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </Link>
            
            {/* Alt kategorileri recursive olarak render et */}
            {cat.children && cat.children.length > 0 && (
              <div className="mt-2">
                {renderCategoryTree(cat.children, level + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <motion.div 
      className={`sticky top-24 left-0 right-0 bg-white shadow-2xl border-t border-rose-200 transition-all duration-300 ease-in-out transform ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
      style={{ 
        zIndex: 99999999,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      {/* Ok şeklinde çıkıntı */}
      <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-rose-200 transform rotate-45"></div>
      <motion.div
        onMouseEnter={() => {
          if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
          }
          setIsHovered(true);
          onHoverChange(true);
        }}
        onMouseLeave={() => {
          onHoverChange(false);
          const timeout = setTimeout(() => {
            setIsHovered(false);
          }, 800);
          setHoverTimeout(timeout);
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4">
              {/* Kategori Hiyerarşisi */}
              <div className="col-span-6">
                <div className="flex items-center mb-3">
                  {category.image && (
                    <div className="w-6 h-6 rounded-lg overflow-hidden mr-2">
                      <Image
                        src={category.image}
                        alt={category.name}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">{category.name}</h3>
                    {category.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {renderCategoryTree(category.children)}
                </div>
              </div>

              {/* Öne Çıkan Ürünler */}
              <div className="col-span-6">
                <div className="space-y-4">
                  {/* Haftanın Öne Çıkan Ürünü */}
                  {weeklyFeaturedProduct && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                        <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-bold mr-2">
                          ⭐ HAFTANIN SEÇİMİ
                        </span>
                      </h3>
                      <Link
                        href={`/products/${weeklyFeaturedProduct.slug}`}
                        className="group block bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border-2 border-rose-300 hover:border-rose-400 hover:shadow-md transition-all duration-300 card-hover"
                        onClick={onClose}
                      >
                        <div className="flex gap-3 p-3">
                          <div className="w-20 h-20 relative overflow-hidden rounded-lg">
                            {weeklyFeaturedProduct.images.length > 0 ? (
                              <Image
                                src={weeklyFeaturedProduct.images[0]}
                                alt={weeklyFeaturedProduct.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                                <span className="text-gray-400 text-xs">Resim Yok</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-center flex-1">
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-rose-600 transition-colors">
                              {weeklyFeaturedProduct.name}
                            </h4>
                            <p className="text-rose-600 font-bold text-sm mt-1">
                              {formatCurrency(weeklyFeaturedProduct.price)}
                            </p>
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white mt-1 w-fit">
                              Bu Hafta Özel
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Diğer Öne Çıkan Ürünler */}
                  {featuredProducts.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-900 mb-2">
                        {category.name} - Öne Çıkan Ürünler
                      </h3>
                      <div className="grid grid-cols-4 gap-1">
                        {featuredProducts.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="group block bg-white rounded-md border hover:shadow-sm transition-all duration-300 card-hover"
                            onClick={onClose}
                          >
                            <div className="aspect-square relative overflow-hidden rounded-t-md">
                              {product.images.length > 0 ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">Resim Yok</span>
                                </div>
                              )}
                            </div>
                            <div className="p-0.5">
                              <h4 className="font-medium text-gray-900 text-xs line-clamp-1 group-hover:text-rose-600 transition-colors">
                                {product.name}
                              </h4>
                              <p className="text-rose-600 font-semibold text-xs mt-0.5">
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Varsayılan İçerik */}
                  {!weeklyFeaturedProduct && featuredProducts.length === 0 && (
                    <div className="text-center py-12">
                      <div className="gradient-bg rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold gradient-text mb-3">
                        {category.name} Kategorisini Keşfedin
                      </h3>
                      <p className="text-gray-500 text-lg">
                        Bu kategorideki özel ürünleri keşfedin
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
}
