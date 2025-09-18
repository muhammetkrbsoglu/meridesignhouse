'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, Sparkles, Wand2, Package, Palette, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback'
import { BlurUpImage, Skeleton } from '@/components/motion/LoadingStates'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface BundleWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (bundle: BundleData) => void
  eventTypes: EventType[]
  themeStyles: ThemeStyle[]
  categories: Category[]
  products: Product[]
}

interface BundleData {
  name: string
  description: string
  eventTypeId: string
  themeStyleId: string
  categoryId: string
  items: BundleItem[]
  bundlePrice?: number
}

interface BundleItem {
  productId: string
  quantity: number
  sortOrder: number
}

interface EventType {
  id: string
  name: string
  description?: string
}

interface ThemeStyle {
  id: string
  name: string
  description?: string
  colors?: string[]
}

interface Category {
  id: string
  name: string
  description?: string
}

interface Product {
  id: string
  name: string
  price: number
  description?: string
  product_images?: Array<{ url: string; alt?: string }>
  category?: { name: string }
}

const STEPS = [
  { id: 'event', title: 'Etkinlik Türü', icon: Star, description: 'Hangi etkinlik için set oluşturuyorsunuz?' },
  { id: 'theme', title: 'Tema Stili', icon: Palette, description: 'Hangi tema ve renk paletini tercih ediyorsunuz?' },
  { id: 'category', title: 'Kategori', icon: Package, description: 'Hangi kategorideki ürünleri dahil etmek istiyorsunuz?' },
  { id: 'products', title: 'Ürün Seçimi', icon: Wand2, description: 'Setinize dahil etmek istediğiniz ürünleri seçin' },
  { id: 'review', title: 'Önizleme', icon: Check, description: 'Setinizi gözden geçirin ve tamamlayın' }
]

export function BundleWizard({
  isOpen,
  onClose,
  onComplete,
  eventTypes,
  themeStyles,
  categories,
  products
}: BundleWizardProps) {
  const { light, medium, success } = useHapticFeedback()
  const [currentStep, setCurrentStep] = useState(0)
  const [bundleData, setBundleData] = useState<BundleData>({
    name: '',
    description: '',
    eventTypeId: '',
    themeStyleId: '',
    categoryId: '',
    items: []
  })
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({})

  const dragControls = useDragControls()

  // Reset wizard when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setBundleData({
        name: '',
        description: '',
        eventTypeId: '',
        themeStyleId: '',
        categoryId: '',
        items: []
      })
      setSelectedProducts(new Set())
      setProductQuantities({})
    }
  }, [isOpen])

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
      medium('Sonraki adım')
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      light('Önceki adım')
    }
  }

  const handleEventTypeSelect = (eventTypeId: string) => {
    setBundleData(prev => ({ ...prev, eventTypeId }))
    light('Etkinlik türü seçildi')
  }

  const handleThemeSelect = (themeStyleId: string) => {
    setBundleData(prev => ({ ...prev, themeStyleId }))
    light('Tema stili seçildi')
  }

  const handleCategorySelect = (categoryId: string) => {
    setBundleData(prev => ({ ...prev, categoryId }))
    light('Kategori seçildi')
  }

  const handleProductToggle = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
      setProductQuantities(prev => {
        const newQuantities = { ...prev }
        delete newQuantities[productId]
        return newQuantities
      })
    } else {
      newSelected.add(productId)
      setProductQuantities(prev => ({ ...prev, [productId]: 1 }))
    }
    setSelectedProducts(newSelected)
    light('Ürün seçimi değiştirildi')
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    setProductQuantities(prev => ({ ...prev, [productId]: Math.max(1, quantity) }))
    light('Miktar değiştirildi')
  }

  const handleComplete = () => {
    const items: BundleItem[] = Array.from(selectedProducts).map((productId, index) => ({
      productId,
      quantity: productQuantities[productId] || 1,
      sortOrder: index
    }))

    const finalBundle: BundleData = {
      ...bundleData,
      items,
      name: bundleData.name || `${eventTypes.find(et => et.id === bundleData.eventTypeId)?.name} Seti`
    }

    success('Set oluşturuldu')
    onComplete(finalBundle)
    onClose()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return bundleData.eventTypeId
      case 1: return bundleData.themeStyleId
      case 2: return bundleData.categoryId
      case 3: return selectedProducts.size > 0
      case 4: return true
      default: return false
    }
  }

  const getFilteredProducts = () => {
    return products.filter(product => 
      !bundleData.categoryId || product.category?.id === bundleData.categoryId
    )
  }

  const calculateTotalPrice = () => {
    return Array.from(selectedProducts).reduce((total, productId) => {
      const product = products.find(p => p.id === productId)
      const quantity = productQuantities[productId] || 1
      return total + (product ? product.price * quantity : 0)
    }, 0)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Bundle oluşturma sihirbazı"
      >
        <motion.div
          drag="y"
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[95vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="bundle-wizard-title"
          aria-describedby="bundle-wizard-description"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-2 bg-rose-100 rounded-full"
                >
                  <Wand2 className="w-5 h-5 text-rose-600" />
                </motion.div>
                <div>
                  <h2 id="bundle-wizard-title" className="text-lg font-semibold text-gray-900">Set Oluştur</h2>
                  <p id="bundle-wizard-description" className="text-sm text-gray-500">
                    {STEPS[currentStep].description}
                  </p>
                </div>
              </div>
              
              <MicroFeedback
                onClick={onClose}
                hapticType="light"
                hapticMessage="Set oluşturmayı kapat"
                aria-label="Set oluşturmayı kapat"
              >
                <Button variant="ghost" size="sm" className="p-2" aria-label="Set oluşturmayı kapat">
                  ×
                </Button>
              </MicroFeedback>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <motion.div
                className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between">
              {STEPS.map((step, index) => {
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                const StepIcon = step.icon

                return (
                  <motion.div
                    key={step.id}
                    className="flex flex-col items-center gap-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-rose-500 text-white' 
                        : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${
                      isActive ? 'text-rose-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-200px)] p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <EventTypeStep
                    eventTypes={eventTypes}
                    selectedId={bundleData.eventTypeId}
                    onSelect={handleEventTypeSelect}
                  />
                )}
                
                {currentStep === 1 && (
                  <ThemeStep
                    themeStyles={themeStyles}
                    selectedId={bundleData.themeStyleId}
                    onSelect={handleThemeSelect}
                  />
                )}
                
                {currentStep === 2 && (
                  <CategoryStep
                    categories={categories}
                    selectedId={bundleData.categoryId}
                    onSelect={handleCategorySelect}
                  />
                )}
                
                {currentStep === 3 && (
                  <ProductStep
                    products={getFilteredProducts()}
                    selectedProducts={selectedProducts}
                    productQuantities={productQuantities}
                    onProductToggle={handleProductToggle}
                    onQuantityChange={handleQuantityChange}
                  />
                )}
                
                {currentStep === 4 && (
                  <ReviewStep
                    bundleData={bundleData}
                    selectedProducts={selectedProducts}
                    productQuantities={productQuantities}
                    products={products}
                    totalPrice={calculateTotalPrice()}
                    eventTypes={eventTypes}
                    themeStyles={themeStyles}
                    categories={categories}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
            <div className="flex gap-3">
              {currentStep > 0 && (
                <MicroFeedback
                  onClick={prevStep}
                  hapticType="light"
                  hapticMessage="Önceki adım"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Geri
                  </Button>
                </MicroFeedback>
              )}
              
              <MicroFeedback
                onClick={currentStep === STEPS.length - 1 ? handleComplete : nextStep}
                hapticType={currentStep === STEPS.length - 1 ? "success" : "medium"}
                hapticMessage={currentStep === STEPS.length - 1 ? "Seti tamamla" : "Sonraki adım"}
                className="flex-1"
                disabled={!canProceed()}
              >
                <Button 
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:opacity-50"
                  disabled={!canProceed()}
                >
                  {currentStep === STEPS.length - 1 ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Seti Tamamla
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4 mr-2" />
                      İleri
                    </>
                  )}
                </Button>
              </MicroFeedback>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Step Components
function EventTypeStep({ eventTypes, selectedId, onSelect }: {
  eventTypes: EventType[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Etkinlik Türü Seçin</h3>
      <div className="grid grid-cols-1 gap-3">
        {eventTypes.map((eventType, index) => (
          <motion.div
            key={eventType.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <HoverCard
              shimmer={false}
              hapticType="light"
              hapticMessage={`${eventType.name} etkinlik türü`}
              className="w-full"
            >
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  selectedId === eventType.id
                    ? 'ring-2 ring-rose-500 bg-rose-50 border-rose-200'
                    : 'hover:shadow-md border-gray-200'
                }`}
                onClick={() => onSelect(eventType.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedId === eventType.id ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Star className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{eventType.name}</h4>
                      {eventType.description && (
                        <p className="text-sm text-gray-600 mt-1">{eventType.description}</p>
                      )}
                    </div>
                    {selectedId === eventType.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </HoverCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ThemeStep({ themeStyles, selectedId, onSelect }: {
  themeStyles: ThemeStyle[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tema Stili Seçin</h3>
      <div className="grid grid-cols-1 gap-3">
        {themeStyles.map((theme, index) => (
          <motion.div
            key={theme.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <HoverCard
              shimmer={false}
              hapticType="light"
              hapticMessage={`${theme.name} tema stili`}
              className="w-full"
            >
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  selectedId === theme.id
                    ? 'ring-2 ring-rose-500 bg-rose-50 border-rose-200'
                    : 'hover:shadow-md border-gray-200'
                }`}
                onClick={() => onSelect(theme.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedId === theme.id ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Palette className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{theme.name}</h4>
                      {theme.description && (
                        <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                      )}
                      {theme.colors && theme.colors.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {theme.colors.slice(0, 5).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedId === theme.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </HoverCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function CategoryStep({ categories, selectedId, onSelect }: {
  categories: Category[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori Seçin</h3>
      <div className="grid grid-cols-1 gap-3">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <HoverCard
              shimmer={false}
              hapticType="light"
              hapticMessage={`${category.name} kategorisi`}
              className="w-full"
            >
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  selectedId === category.id
                    ? 'ring-2 ring-rose-500 bg-rose-50 border-rose-200'
                    : 'hover:shadow-md border-gray-200'
                }`}
                onClick={() => onSelect(category.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedId === category.id ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                    </div>
                    {selectedId === category.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </HoverCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ProductStep({ products, selectedProducts, productQuantities, onProductToggle, onQuantityChange }: {
  products: Product[]
  selectedProducts: Set<string>
  productQuantities: Record<string, number>
  onProductToggle: (id: string) => void
  onQuantityChange: (id: string, quantity: number) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ürün Seçin</h3>
        <Badge variant="secondary" className="bg-rose-100 text-rose-700">
          {selectedProducts.size} seçili
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {products.map((product, index) => {
          const isSelected = selectedProducts.has(product.id)
          const quantity = productQuantities[product.id] || 1

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <HoverCard
                shimmer={false}
                hapticType="light"
                hapticMessage={`${product.name} ürünü`}
                className="w-full"
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-rose-500 bg-rose-50 border-rose-200'
                      : 'hover:shadow-md border-gray-200'
                  }`}
                  onClick={() => onProductToggle(product.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Product Image */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        {product.product_images && product.product_images.length > 0 ? (
                          <BlurUpImage
                            src={product.product_images[0].url}
                            alt={product.product_images[0].alt || product.name}
                            className="w-full h-full object-cover"
                            width={64}
                            height={64}
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-sm text-gray-600">₺{product.price.toLocaleString('tr-TR')}</p>
                        {product.category && (
                          <p className="text-xs text-gray-500">{product.category.name}</p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onQuantityChange(product.id, quantity - 1)}
                            disabled={quantity <= 1}
                            className="w-8 h-8 p-0"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onQuantityChange(product.id, quantity + 1)}
                            className="w-8 h-8 p-0"
                          >
                            +
                          </Button>
                        </motion.div>
                      )}

                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </HoverCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function ReviewStep({ bundleData, selectedProducts, productQuantities, products, totalPrice, eventTypes, themeStyles, categories }: {
  bundleData: BundleData
  selectedProducts: Set<string>
  productQuantities: Record<string, number>
  products: Product[]
  totalPrice: number
  eventTypes: EventType[]
  themeStyles: ThemeStyle[]
  categories: Category[]
}) {
  const selectedEventType = eventTypes.find(et => et.id === bundleData.eventTypeId)
  const selectedTheme = themeStyles.find(ts => ts.id === bundleData.themeStyleId)
  const selectedCategory = categories.find(c => c.id === bundleData.categoryId)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Önizlemesi</h3>
      
      {/* Bundle Summary */}
      <Card className="border-rose-200 bg-rose-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-700">
            <Sparkles className="w-5 h-5" />
            Set Özeti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Etkinlik Türü</p>
              <p className="font-medium">{selectedEventType?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tema Stili</p>
              <p className="font-medium">{selectedTheme?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Kategori</p>
              <p className="font-medium">{selectedCategory?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Products */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Seçilen Ürünler ({selectedProducts.size})</h4>
        <div className="space-y-2">
          {Array.from(selectedProducts).map((productId, index) => {
            const product = products.find(p => p.id === productId)
            const quantity = productQuantities[productId] || 1
            if (!product) return null

            return (
              <motion.div
                key={productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                  {product.product_images && product.product_images.length > 0 ? (
                    <BlurUpImage
                      src={product.product_images[0].url}
                      alt={product.product_images[0].alt || product.name}
                      className="w-full h-full object-cover"
                      width={48}
                      height={48}
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    {quantity} adet × ₺{product.price.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-rose-600">
                    ₺{(product.price * quantity).toLocaleString('tr-TR')}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Total Price */}
      <Card className="border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Toplam Fiyat</span>
            <span className="text-2xl font-bold text-rose-600">
              ₺{totalPrice.toLocaleString('tr-TR')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

