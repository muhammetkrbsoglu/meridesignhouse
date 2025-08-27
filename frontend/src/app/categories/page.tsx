'use client';

import { useState, useEffect } from 'react';
import { Category } from '../../../../shared/types/category';
import { CategoryService } from '../../services/category.service';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categoriesData = await CategoryService.getCategoryTree();
      setCategories(categoriesData);
    } catch (err) {
      setError('Kategoriler yüklenirken bir hata oluştu.');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryCard = (category: Category, level: number = 0, index: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    
    return (
      <motion.div 
        key={category.id} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className={`${level > 0 ? 'ml-8' : ''}`}
      >
        <motion.div 
          whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
          className="bg-white rounded-lg shadow-md p-6 mb-4 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            {/* Category Image */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
            >
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </motion.div>

            {/* Category Info */}
            <div className="flex-1">
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl font-semibold text-gray-900 mb-2"
              >
                {category.name}
              </motion.h3>
              {category.description && (
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-gray-600 mb-3"
                >
                  {category.description}
                </motion.p>
              )}
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-4 text-sm text-gray-500"
              >
                <span>Sıra: {category.order}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  category.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {category.isActive ? 'Aktif' : 'Pasif'}
                </span>
                {/* Ürün sayısı gösterimi - placeholder olarak */}
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {Math.floor(Math.random() * 50) + 5} Ürün
                </span>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col gap-2"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={`/categories/${category.id}`}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-center block"
                >
                  Görüntüle
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={`/products?categoryId=${category.id}`}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-center block"
                >
                  Ürünleri Gör
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Children Categories */}
          {hasChildren && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <h4 className="text-lg font-medium text-gray-900 mb-4">Alt Kategoriler</h4>
              <div className="space-y-2">
                {category.children!.map((child, childIndex) => 
                  renderCategoryCard(child, level + 1, index + childIndex + 1)
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-4 text-gray-600"
            >
              Kategoriler yükleniyor...
            </motion.p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-red-500 text-xl mb-4"
            >
              ❌
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-red-600"
            >
              {error}
            </motion.p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadCategories}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tekrar Dene
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategoriler</h1>
          <p className="text-gray-600">Ürün kategorilerimizi keşfedin</p>
        </motion.div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="space-y-4">
            {categories.map((category, index) => renderCategoryCard(category, 0, index))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kategori Bulunamadı</h3>
            <p className="text-gray-600">Henüz kategori eklenmemiş.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
