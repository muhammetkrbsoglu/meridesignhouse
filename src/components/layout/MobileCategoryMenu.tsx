'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext' // Assuming an AuthContext exists

import { Category } from '@/types/category'

interface FeaturedProduct {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  slug: string
  isWeeklyPick?: boolean
}

interface MobileCategoryMenuProps {
  categories: Category[]
  onCategoryClick: () => void
}

export default function MobileCategoryMenu({ categories, onCategoryClick }: MobileCategoryMenuProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [featuredProducts, setFeaturedProducts] = useState<{ [categoryId: string]: FeaturedProduct[] }>({})
  const [weeklyPicks, setWeeklyPicks] = useState<{ [categoryId: string]: FeaturedProduct }>({})
  const { logout } = useAuth() // Assuming useAuth provides a logout function

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Load featured products for a category
  const loadFeaturedProducts = async (categoryId: string) => {
    try {
      // Simulated API call - replace with actual API
      const response = await fetch(`/api/categories/${categoryId}/featured`)
      if (response.ok) {
        const data = await response.json()
        setFeaturedProducts(prev => ({
          ...prev,
          [categoryId]: data.products || []
        }))
        if (data.weeklyPick) {
          setWeeklyPicks(prev => ({
            ...prev,
            [categoryId]: data.weeklyPick
          }))
        }
      }
    } catch (error) {
      console.error('Error loading featured products:', error)
    }
  }

  // Load featured products when category is expanded
  useEffect(() => {
    expandedCategories.forEach(categoryId => {
      if (!featuredProducts[categoryId]) {
        loadFeaturedProducts(categoryId)
      }
    })
  }, [expandedCategories])

  // Render category recursively
  const renderCategory = (category: Category, depth = 0) => {
    const isExpanded = expandedCategories.has(category.id)
    const hasChildren = category.children && category.children.length > 0
    const categoryFeaturedProducts = featuredProducts[category.id] || []
    const weeklyPick = weeklyPicks[category.id]

    return (
      <div key={category.id} className="w-full">
        {/* Category Header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/categories/${category.slug}`}
            className={`flex-1 flex items-center py-2 px-4 text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 rounded-lg transition-all duration-300 ${
              depth > 0 ? 'ml-4 text-sm' : ''
            }`}
            onClick={onCategoryClick}
            style={{ marginLeft: depth * 16 }}
          >
            🏷️ {category.name}
          </Link>
          
          {hasChildren && (
            <button
              onClick={() => toggleCategory(category.id)}
              className="p-2 text-gray-500 hover:text-purple-600 transition-colors duration-200"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="ml-4 border-l-2 border-purple-100 pl-2">
                {/* Weekly Pick */}
                {weeklyPick && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center mb-2">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-xs font-semibold text-yellow-700">Haftanın Seçimi</span>
                    </div>
                    <Link
                      href={`/products/${weeklyPick.slug}`}
                      onClick={onCategoryClick}
                      className="block"
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={weeklyPick.image}
                          alt={weeklyPick.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {weeklyPick.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-purple-600">
                              ₺{weeklyPick.price}
                            </span>
                            {weeklyPick.originalPrice && (
                              <span className="text-xs text-gray-500 line-through">
                                ₺{weeklyPick.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}

                {/* Featured Products */}
                {categoryFeaturedProducts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-3"
                  >
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Öne Çıkan Ürünler
                    </h4>
                    <div className="space-y-2">
                      {categoryFeaturedProducts.slice(0, 3).map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={onCategoryClick}
                          className="flex items-center space-x-2 p-2 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 truncate">{product.name}</p>
                            <p className="text-xs font-semibold text-purple-600">₺{product.price}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Subcategories */}
                {hasChildren && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-1"
                  >
                    {category.children.map((subCategory) => 
                      renderCategory(subCategory, depth + 1)
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => renderCategory(category))}
      <button
        onClick={() => {
          logout()
          onCategoryClick() // Close the menu after logout
        }}
        className="w-full flex items-center py-2 px-4 text-red-600 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-300 mt-4"
      >
        Çıkış Yap
      </button>
    </div>
  )
}
