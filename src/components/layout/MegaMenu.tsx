'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { MenuCategory, MenuProduct } from '@/types/menu';
import { fetchMenuCategories, fetchFeaturedProductsForCategory, fetchWeeklyFeaturedProduct } from '@/lib/api/menuClient';
import { formatCurrency } from '@/lib/utils';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onHoverChange: (isHovered: boolean) => void;
}

export default function MegaMenu({ isOpen, onClose, onHoverChange }: MegaMenuProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<MenuProduct[]>([]);
  const [weeklyFeaturedProduct, setWeeklyFeaturedProduct] = useState<MenuProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchMenuCategories();
        setCategories(data);
      } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      if (hoveredCategory) {
        // Önce haftanın ürününü yükle (daha hızlı)
        try {
          const weeklyProduct = await fetchWeeklyFeaturedProduct(hoveredCategory);
          setWeeklyFeaturedProduct(weeklyProduct);
        } catch (error) {
          console.error('Haftanın ürünü yüklenirken hata:', error);
        }

        // Sonra diğer ürünleri yükle
        try {
          const products = await fetchFeaturedProductsForCategory(hoveredCategory, 3);
          setFeaturedProducts(products);
        } catch (error) {
          console.error('Öne çıkan ürünler yüklenirken hata:', error);
        }
      } else {
        setFeaturedProducts([]);
        setWeeklyFeaturedProduct(null);
      }
    };

    loadFeaturedProducts();
  }, [hoveredCategory]);

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mega Menu */}
      <div 
        className={`absolute top-full left-0 right-0 bg-white shadow-2xl z-[99999] border-t border-gray-100 transition-all duration-300 ease-in-out transform ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
        onMouseEnter={() => {
          if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
          }
          setIsHovered(true);
          onHoverChange(true); // Navbar'a mega menü içinde olduğunu bildir
        }}
        onMouseLeave={() => {
          onHoverChange(false); // Navbar'a mega menüden çıktığını bildir
          const timeout = setTimeout(() => {
            setIsHovered(false);
            setHoveredCategory(null);
          }, 200); // Hızlı kapanma
          setHoverTimeout(timeout);
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-8">
                {/* Ana Kategoriler */}
                <div className="col-span-3">
                  <h3 className="text-lg font-semibold gradient-text mb-6 animate-fadeInUp">Kategoriler</h3>
                  <ul className="space-y-1">
                    {categories.map((category, index) => (
                      <li key={category.id} className="animate-fadeInUp" style={{ animationDelay: `${index * 50}ms` }}>
                        <div
                          className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                            hoveredCategory === category.id 
                              ? 'bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-rose-400 shadow-lg scale-105' 
                              : 'hover:bg-gray-50 hover:shadow-md'
                          }`}
                          onMouseEnter={() => setHoveredCategory(category.id)}
                        >
                          <div className="flex-1">
                            <Link
                              href={`/categories/${category.slug}`}
                              className={`font-medium transition-colors ${
                                hoveredCategory === category.id 
                                  ? 'text-rose-600' 
                                  : 'text-gray-700 text-hover'
                              }`}
                              onClick={onClose}
                            >
                              {category.name}
                            </Link>
                            <div className="text-xs text-gray-500 mt-1">
                              {category.productCount} ürün
                            </div>
                          </div>
                          {category.children.length > 0 && (
                            <ChevronRightIcon className={`h-4 w-4 transition-all duration-300 ${
                              hoveredCategory === category.id 
                                ? 'text-rose-500 transform translate-x-1' 
                                : 'text-gray-400 group-hover:text-rose-500'
                            }`} />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Alt Kategoriler */}
                <div className="col-span-3">
                  {hoveredCategory && (
                    <div className="animate-fadeInLeft">
                      {(() => {
                        const category = categories.find(c => c.id === hoveredCategory);
                        if (!category || category.children.length === 0) return null;
                        
                        return (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center animate-fadeInUp">
                              <span className="w-2 h-2 bg-rose-400 rounded-full mr-3 animate-pulse"></span>
                              {category.name}
                            </h3>
                            <ul className="space-y-1">
                              {category.children.map((child, index) => (
                                <li key={child.id} className="animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }}>
                                  <Link
                                    href={`/categories/${child.slug}`}
                                    className="block p-3 text-gray-600 hover:text-rose-600 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 rounded-xl transition-all duration-300 hover:shadow-md transform hover:scale-105 card-hover"
                                    onClick={onClose}
                                  >
                                    <div className="font-medium">{child.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {child.productCount} ürün
                                    </div>
                                  </Link>
                                  
                                  {/* 3. Seviye Kategoriler */}
                                  {child.children.length > 0 && (
                                    <ul className="ml-4 mt-2 space-y-1">
                                      {child.children.map((grandChild) => (
                                        <li key={grandChild.id}>
                                          <Link
                                            href={`/categories/${grandChild.slug}`}
                                            className="block p-2 text-sm text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-300"
                                            onClick={onClose}
                                          >
                                            <span className="flex items-center">
                                              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                              {grandChild.name} ({grandChild.productCount})
                                            </span>
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Öne Çıkan Ürünler */}
                <div className="col-span-6">
                  {hoveredCategory && (weeklyFeaturedProduct || featuredProducts.length > 0) && (
                    <div className="space-y-6 animate-fadeInRight">
                      {/* Haftanın Öne Çıkan Ürünü */}
                      {weeklyFeaturedProduct && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold mr-3">
                              ⭐ HAFTANIN SEÇİMİ
                            </span>
                          </h3>
                          <Link
                            href={`/products/${weeklyFeaturedProduct.slug}`}
                            className="group block bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border-2 border-rose-200 hover:border-rose-300 hover:shadow-lg transition-all duration-300 card-hover"
                            onClick={onClose}
                          >
                            <div className="grid grid-cols-2 gap-4 p-4">
                              <div className="aspect-square relative overflow-hidden rounded-lg">
                                {weeklyFeaturedProduct.images.length > 0 ? (
                                  <Image
                                    src={weeklyFeaturedProduct.images[0]}
                                    alt={weeklyFeaturedProduct.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                                    <span className="text-gray-400 text-sm">Resim Yok</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col justify-center">
                                <h4 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-rose-600 transition-colors">
                                  {weeklyFeaturedProduct.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-2">
                                  {weeklyFeaturedProduct.categories[0]?.name}
                                </p>
                                <p className="text-rose-600 font-bold text-xl mt-3">
                                  {formatCurrency(weeklyFeaturedProduct.price)}
                                </p>
                                <div className="mt-4">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                    Bu Hafta Özel
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      )}

                      {/* Diğer Öne Çıkan Ürünler */}
                      {featuredProducts.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Öne Çıkan Ürünler</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {featuredProducts.map((product) => (
                              <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                className="group block bg-white rounded-lg border hover:shadow-md transition-all duration-300 card-hover"
                                onClick={onClose}
                              >
                                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                                  {product.images.length > 0 ? (
                                    <Image
                                      src={product.images[0]}
                                      alt={product.name}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-gray-400 text-sm">Resim Yok</span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-2">
                                  <h4 className="font-medium text-gray-900 text-xs line-clamp-2 group-hover:text-rose-600 transition-colors">
                                    {product.name}
                                  </h4>
                                  <p className="text-rose-600 font-semibold text-sm mt-1">
                                    {formatCurrency(product.price)}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Varsayılan İçerik */}
                  {!hoveredCategory && (
                    <div className="text-center py-12 animate-fadeIn">
                      <div className="gradient-bg rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold gradient-text mb-3">Kategorileri Keşfedin</h3>
                      <p className="text-gray-500 text-lg">Bir kategorinin üzerine gelin ve öne çıkan ürünleri görün</p>
                      <div className="mt-6">
                        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-rose-50 to-pink-50 rounded-full text-sm text-rose-600 font-medium">
                          ✨ Özel ürünler ve fırsatlar sizi bekliyor
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


