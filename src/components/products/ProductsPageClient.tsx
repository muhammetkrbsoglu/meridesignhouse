'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Filter, SlidersHorizontal, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'
import { ProductGrid } from './ProductGrid'
const FilterSheet = dynamic(() => import('./FilterSheet').then(m => ({ default: m.FilterSheet })), { ssr: false })
const PullToRefresh = dynamic(() => import('@/components/motion/PullToRefresh').then(m => ({ default: m.PullToRefresh })), { ssr: false })
import { MicroFeedback } from '@/components/motion/MicroFeedback'
import { PullRefreshHint, FilterSheetHint } from '@/components/motion/GestureHint'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { usePerformanceMeasurement } from '@/hooks/usePerformanceMeasurement'

interface ProductsPageClientProps {
  products: any[]
  bundles: any[]
  categories: any[]
  activeColors: string[]
  colorSuggestions: string[]
  hexToName: Record<string, string>
  selectedColors: string[]
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  sort: string
  query: string
  inStockOnly: boolean
  totalResults: number
  bundleFilter: string
  eventId?: string
  themeId?: string
}

export function ProductsPageClient({
  products,
  bundles,
  categories,
  activeColors,
  colorSuggestions,
  hexToName,
  selectedColors,
  categoryId,
  minPrice,
  maxPrice,
  sort,
  query,
  inStockOnly,
  totalResults,
  bundleFilter,
  eventId,
  themeId
}: ProductsPageClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { light, medium, success, error } = useHapticFeedback()
  const { measureAsync } = usePerformanceMeasurement()

  // Calculate active filter count
  const activeFilterCount = [
    categoryId,
    minPrice,
    maxPrice,
    selectedColors.length > 0,
    inStockOnly,
    query,
    sort !== 'popularity'
  ].filter(Boolean).length

  const handleFilterOpen = () => {
    setIsFilterOpen(true)
    light('Filtreler açılıyor')
  }

  const handleFilterClose = () => {
    setIsFilterOpen(false)
    light('Filtreler kapatılıyor')
  }

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    
    try {
      await measureAsync('products-refresh', async () => {
        // Simulate refresh delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // In a real app, you would refetch data here
        // For now, we'll just update the refresh key to trigger re-renders
        setRefreshKey(prev => prev + 1)
        
        // Simulate potential errors (5% chance)
        if (Math.random() < 0.05) {
          throw new Error('Refresh failed')
        }
      })
      
      success('Ürünler yenilendi')
    } catch (err) {
      error('Yenileme sırasında hata oluştu')
      console.error('Products refresh error:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, measureAsync, success, error])

  return (
    <PullRefreshHint showOnMount={true} delay={1500}>
      <PullToRefresh
        onRefresh={handleRefresh}
        disabled={isRefreshing}
        refreshText="Ürünleri yenilemek için çekin"
        releaseText="Bırakın"
        refreshingText="Yenileniyor..."
        successText="Ürünler yenilendi!"
        errorText="Yenileme hatası"
      >
      <div className="min-h-[100svh] bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/30">
      {/* Mobile Filter Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-rose-200/30 p-4 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-2 bg-rose-100 rounded-full"
            >
              <SlidersHorizontal className="w-5 h-5 text-rose-600" />
            </motion.div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Ürünler</h1>
              <p className="text-sm text-gray-500">
                {totalResults.toLocaleString('tr-TR')} ürün bulundu
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1"
              >
                <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                  {activeFilterCount} aktif
                </Badge>
                <Sparkles className="w-4 h-4 text-rose-500" />
              </motion.div>
            )}
            
            <FilterSheetHint showOnInteraction={true} triggerElement={null}>
              <MicroFeedback
                onClick={handleFilterOpen}
                hapticType="medium"
                hapticMessage="Filtreleri aç"
              >
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtreler
                </Button>
              </MicroFeedback>
            </FilterSheetHint>
          </div>
        </div>
      </div>

      {/* Desktop Filter Header */}
      <div className="hidden md:block bg-white border-b border-rose-200/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Ürünler
              </h1>
              <p className="text-gray-600 mt-1">
                {totalResults.toLocaleString('tr-TR')} ürün bulundu
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                    {activeFilterCount} aktif filtre
                  </Badge>
                  <Sparkles className="w-5 h-5 text-rose-500" />
                </motion.div>
              )}
              
              <MicroFeedback
                onClick={handleFilterOpen}
                hapticType="medium"
                hapticMessage="Filtreleri aç"
              >
                <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtreler
                </Button>
              </MicroFeedback>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ProductGrid 
            products={products}
            bundles={bundles}
            bundleFilter={bundleFilter}
            eventId={eventId}
            themeId={themeId}
          />
        </motion.div>
      </div>

      {/* Filter Sheet */}
      <FilterSheet
        isOpen={isFilterOpen}
        onClose={handleFilterClose}
        categories={categories}
        activeColors={activeColors}
        colorSuggestions={colorSuggestions}
        hexToName={hexToName}
        selectedColors={selectedColors}
        categoryId={categoryId}
        minPrice={minPrice}
        maxPrice={maxPrice}
        sort={sort}
        query={query}
        inStockOnly={inStockOnly}
        totalResults={totalResults}
      />
      </div>
    </PullToRefresh>
    </PullRefreshHint>
  )
}
