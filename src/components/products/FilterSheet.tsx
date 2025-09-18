'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform } from 'framer-motion'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { X, Filter, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { getOptimalGlassConfig } from '@/lib/glassmorphism'
import { cn } from '@/lib/utils'
import { ColorFilter } from './ColorFilter'
import { SortDropdown } from './SortDropdown'

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
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
}

const SNAP_POINTS = {
  closed: 0,
  peek: 120,
  half: 0.5,
  full: 0.9
}

export function FilterSheet({
  isOpen,
  onClose,
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
  totalResults
}: FilterSheetProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { light, medium, success } = useHapticFeedback()
  
  const [localFilters, setLocalFilters] = useState({
    categoryId,
    minPrice: minPrice?.toString() || '',
    maxPrice: maxPrice?.toString() || '',
    sort,
    query,
    inStockOnly,
    selectedColors
  })
  
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    colors: true,
    sort: false
  })

  const dragControls = useDragControls()
  const y = useMotionValue(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Calculate active filter count
  const activeFilterCount = [
    localFilters.categoryId,
    localFilters.minPrice,
    localFilters.maxPrice,
    localFilters.selectedColors.length > 0,
    localFilters.inStockOnly,
    localFilters.query
  ].filter(Boolean).length

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters({
      categoryId,
      minPrice: minPrice?.toString() || '',
      maxPrice: maxPrice?.toString() || '',
      sort,
      query,
      inStockOnly,
      selectedColors
    })
  }, [categoryId, minPrice, maxPrice, sort, query, inStockOnly, selectedColors])

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Clear existing filters
    params.delete('category')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('colors')
    params.delete('query')
    params.delete('stock')
    params.delete('sort')
    params.delete('page')

    // Apply new filters
    if (localFilters.categoryId) params.set('category', localFilters.categoryId)
    if (localFilters.minPrice) params.set('minPrice', localFilters.minPrice)
    if (localFilters.maxPrice) params.set('maxPrice', localFilters.maxPrice)
    if (localFilters.selectedColors.length > 0) params.set('colors', localFilters.selectedColors.join(','))
    if (localFilters.query) params.set('query', localFilters.query)
    if (localFilters.inStockOnly) params.set('stock', '1')
    if (localFilters.sort && localFilters.sort !== 'popularity') params.set('sort', localFilters.sort)

    router.push(`${pathname}?${params.toString()}`)
    success('Filtreler uygulandı')
    onClose()
  }

  const resetFilters = () => {
    setLocalFilters({
      categoryId: undefined,
      minPrice: '',
      maxPrice: '',
      sort: 'popularity',
      query: '',
      inStockOnly: false,
      selectedColors: []
    })
    medium('Filtreler sıfırlandı')
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
    light('Bölüm açıldı/kapatıldı')
  }

  const handleColorToggle = (colorValue: string) => {
    const current = new Set(localFilters.selectedColors)
    if (current.has(colorValue)) {
      current.delete(colorValue)
    } else {
      current.add(colorValue)
    }
    setLocalFilters(prev => ({
      ...prev,
      selectedColors: Array.from(current)
    }))
    light('Renk filtresi değiştirildi')
  }

  const buildCategoryTree = (categories: any[]) => {
    const categoryMap = new Map()
    const rootCategories: any[] = []

    // First pass: create map
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build tree
    categories.forEach(cat => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(categoryMap.get(cat.id))
      } else {
        rootCategories.push(categoryMap.get(cat.id))
      }
    })

    return rootCategories
  }

  const categoryTree = buildCategoryTree(categories)

  const renderCategoryItem = (category: any, level = 0) => {
    const isSelected = localFilters.categoryId === category.id
    const hasChildren = category.children && category.children.length > 0
    const indent = level * 16

    return (
      <div key={category.id}>
        <motion.button
          onClick={() => {
            setLocalFilters(prev => ({
              ...prev,
              categoryId: isSelected ? undefined : category.id
            }))
            light('Kategori seçildi')
          }}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            isSelected 
              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
          style={{ paddingLeft: `${indent + 12}px` }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{category.name}</span>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-rose-500 rounded-full"
              />
            )}
          </div>
        </motion.button>
        
        {hasChildren && expandedSections.category && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-2"
          >
            {category.children.map((child: any) => renderCategoryItem(child, level + 1))}
          </motion.div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'fixed inset-0 z-50',
          getOptimalGlassConfig('modal')
        )}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Filtre paneli"
      >
        <motion.div
          ref={sheetRef}
          drag="y"
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            'absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden',
            getOptimalGlassConfig('card')
          )}
          style={{ y }}
          role="dialog"
          aria-labelledby="filter-title"
          aria-describedby="filter-description"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-4 pt-[env(safe-area-inset-top)] supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-2 bg-rose-100 rounded-full"
                >
                  <Filter className="w-5 h-5 text-rose-600" />
                </motion.div>
                <div>
                  <h2 id="filter-title" className="text-lg font-semibold text-gray-900">Filtreler</h2>
                  <p id="filter-description" className="text-sm text-gray-500">
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
                
                <MicroFeedback
                  onClick={onClose}
                  hapticType="light"
                  hapticMessage="Filtreleri kapat"
                  aria-label="Filtreleri kapat"
                >
                  <Button variant="ghost" size="sm" className="p-2" aria-label="Filtreleri kapat">
                    <X className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </MicroFeedback>
              </div>
            </div>

            {/* Drag Handle */}
            <div className="flex justify-center">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4 space-y-6">
            {/* Search */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Arama</Label>
              </div>
              <HoverCard
                shimmer={false}
                hapticType="light"
                hapticMessage="Ürün arama"
                className="w-full"
              >
                <Input
                  placeholder="Ürün, kategori veya set ara..."
                  value={localFilters.query}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, query: e.target.value }))}
                  className="w-full"
                />
              </HoverCard>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <motion.button
                onClick={() => toggleSection('category')}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Kategoriler</span>
                  {localFilters.categoryId && (
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                      Seçili
                    </Badge>
                  )}
                </div>
                {expandedSections.category ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </motion.button>
              
              <AnimatePresence>
                {expandedSections.category && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 max-h-64 overflow-y-auto"
                  >
                    <motion.button
                      onClick={() => {
                        setLocalFilters(prev => ({ ...prev, categoryId: undefined }))
                        light('Tüm kategoriler seçildi')
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        !localFilters.categoryId 
                          ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tüm kategoriler</span>
                        {!localFilters.categoryId && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-rose-500 rounded-full"
                          />
                        )}
                      </div>
                    </motion.button>
                    {categoryTree.map(category => renderCategoryItem(category))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <motion.button
                onClick={() => toggleSection('price')}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Fiyat Aralığı</span>
                  {(localFilters.minPrice || localFilters.maxPrice) && (
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                      Seçili
                    </Badge>
                  )}
                </div>
                {expandedSections.price ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </motion.button>
              
              <AnimatePresence>
                {expandedSections.price && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600 mb-1">Min Fiyat</Label>
                        <HoverCard
                          shimmer={false}
                          hapticType="light"
                          hapticMessage="Minimum fiyat girişi"
                          className="w-full"
                        >
                          <Input
                            type="number"
                            placeholder="0"
                            value={localFilters.minPrice}
                            onChange={(e) => setLocalFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                            className="w-full"
                          />
                        </HoverCard>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1">Max Fiyat</Label>
                        <HoverCard
                          shimmer={false}
                          hapticType="light"
                          hapticMessage="Maksimum fiyat girişi"
                          className="w-full"
                        >
                          <Input
                            type="number"
                            placeholder="∞"
                            value={localFilters.maxPrice}
                            onChange={(e) => setLocalFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                            className="w-full"
                          />
                        </HoverCard>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <motion.button
                onClick={() => toggleSection('colors')}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Renkler</span>
                  {localFilters.selectedColors.length > 0 && (
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                      {localFilters.selectedColors.length} seçili
                    </Badge>
                  )}
                </div>
                {expandedSections.colors ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </motion.button>
              
              <AnimatePresence>
                {expandedSections.colors && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      {colorSuggestions.slice(0, 12).map((color) => {
                        const isSelected = localFilters.selectedColors.includes(color.toLowerCase())
                        return (
                          <motion.button
                            key={color}
                            onClick={() => handleColorToggle(color.toLowerCase())}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-colors ${
                              isSelected 
                                ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span 
                              className="w-4 h-4 rounded-full border border-gray-200" 
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs">
                              {hexToName[color.toLowerCase()] || color}
                            </span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort */}
            <div className="space-y-3">
              <motion.button
                onClick={() => toggleSection('sort')}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Sıralama</span>
                  {localFilters.sort !== 'popularity' && (
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                      Seçili
                    </Badge>
                  )}
                </div>
                {expandedSections.sort ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </motion.button>
              
              <AnimatePresence>
                {expandedSections.sort && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {[
                      { value: 'popularity', label: 'Popülerlik' },
                      { value: 'newest', label: 'En yeni' },
                      { value: 'oldest', label: 'En eski' },
                      { value: 'price-asc', label: 'Fiyat artan' },
                      { value: 'price-desc', label: 'Fiyat azalan' },
                      { value: 'name', label: 'İsme göre' }
                    ].map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => {
                          setLocalFilters(prev => ({ ...prev, sort: option.value }))
                          light('Sıralama değiştirildi')
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          localFilters.sort === option.value 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{option.label}</span>
                          {localFilters.sort === option.value && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-rose-500 rounded-full"
                            />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stock Filter */}
            <div className="space-y-3">
              <motion.button
                onClick={() => {
                  setLocalFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly }))
                  light('Stok filtresi değiştirildi')
                }}
                className={`w-full p-3 rounded-lg transition-colors ${
                  localFilters.inStockOnly 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Sadece stokta olanlar</span>
                  {localFilters.inStockOnly && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-rose-500 rounded-full"
                    />
                  )}
                </div>
              </motion.button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-[env(safe-area-inset-bottom)] supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
            <div className="flex gap-3">
              <MicroFeedback
                onClick={resetFilters}
                hapticType="medium"
                hapticMessage="Filtreleri sıfırla"
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  Sıfırla
                </Button>
              </MicroFeedback>
              
              <MicroFeedback
                onClick={applyFilters}
                hapticType="success"
                hapticMessage="Filtreleri uygula"
                className="flex-1"
              >
                <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                  Filtreleri Uygula
                </Button>
              </MicroFeedback>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

