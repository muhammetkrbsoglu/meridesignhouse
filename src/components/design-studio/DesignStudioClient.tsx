'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Sparkles, Palette, Star, Package, ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BundleWizard } from '@/components/bundles/BundleWizard'
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback'
import { BlurUpImage, Skeleton } from '@/components/motion/LoadingStates'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface DesignStudioClientProps {
  eventTypes: any[]
  themeStyles: any[]
  categories: any[]
  products: any[]
}

interface BundleData {
  name: string
  description: string
  eventTypeId: string
  themeStyleId: string
  categoryId: string
  items: Array<{
    productId: string
    quantity: number
    sortOrder: number
  }>
  bundlePrice?: number
}

export function DesignStudioClient({
  eventTypes,
  themeStyles,
  categories,
  products
}: DesignStudioClientProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [createdBundles, setCreatedBundles] = useState<BundleData[]>([])
  const { light, medium, success } = useHapticFeedback()

  const handleWizardOpen = () => {
    setIsWizardOpen(true)
    medium('Set oluşturma başlatılıyor')
  }

  const handleWizardClose = () => {
    setIsWizardOpen(false)
    light('Set oluşturma kapatıldı')
  }

  const handleBundleComplete = (bundle: BundleData) => {
    setCreatedBundles(prev => [bundle, ...prev])
    success('Set başarıyla oluşturuldu')
  }

  const getEventTypeName = (eventTypeId: string) => {
    return eventTypes.find(et => et.id === eventTypeId)?.name || 'Bilinmeyen'
  }

  const getThemeName = (themeId: string) => {
    return themeStyles.find(ts => ts.id === themeId)?.name || 'Bilinmeyen'
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Bilinmeyen'
  }

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Bilinmeyen'
  }

  const calculateBundlePrice = (bundle: BundleData) => {
    return bundle.items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId)
      return total + (product ? product.price * item.quantity : 0)
    }, 0)
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 hidden md:block" aria-hidden="true">
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-rose-200/20 rounded-full blur-xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-24 h-24 bg-pink-200/20 rounded-full blur-xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div
            className="absolute bottom-20 left-1/3 w-20 h-20 bg-purple-200/20 rounded-full blur-xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Title */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100/80 backdrop-blur-sm rounded-full border border-rose-200/50 mb-6">
                <Wand2 className="w-5 h-5 text-rose-600" />
                <span className="text-sm font-medium text-rose-700">Tasarım Atölyesi</span>
                <Sparkles className="w-4 h-4 text-rose-500" />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Kendi Setinizi Oluşturun
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
                Etkinlik türü, tema stili ve ürünlerinizi seçerek özel setler tasarlayın
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <MicroFeedback
                onClick={handleWizardOpen}
                hapticType="success"
                hapticMessage="Set oluşturmaya başla"
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Set Oluşturmaya Başla
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </MicroFeedback>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nasıl Çalışır?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sadece birkaç adımda hayalinizdeki seti oluşturun
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Star,
              title: 'Etkinlik Türü',
              description: 'Hangi etkinlik için set oluşturduğunuzu seçin',
              color: 'from-rose-500 to-pink-500'
            },
            {
              icon: Palette,
              title: 'Tema Stili',
              description: 'Renk paleti ve tema stilinizi belirleyin',
              color: 'from-pink-500 to-purple-500'
            },
            {
              icon: Package,
              title: 'Kategori',
              description: 'Hangi kategorideki ürünleri dahil edeceğinizi seçin',
              color: 'from-purple-500 to-indigo-500'
            },
            {
              icon: Wand2,
              title: 'Ürün Seçimi',
              description: 'Setinize dahil etmek istediğiniz ürünleri seçin',
              color: 'from-indigo-500 to-blue-500'
            }
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <HoverCard
                  shimmer={false}
                  hapticType="light"
                  hapticMessage={feature.title}
                  className="h-full"
                >
                  <Card className="h-full text-center hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <motion.div
                        className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white shadow-lg`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-8 h-8" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Created Bundles Section */}
      {createdBundles.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Oluşturduğunuz Setler
            </h2>
            <p className="text-lg text-gray-600">
              Başarıyla oluşturduğunuz özel setleriniz
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdBundles.map((bundle, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <HoverCard
                  shimmer={false}
                  hapticType="light"
                  hapticMessage={`${bundle.name} seti`}
                  className="h-full"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-rose-200/50 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Wand2 className="w-4 h-4 text-white" />
                        </div>
                        <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                          Özel Set
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {bundle.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Etkinlik:</span>
                          <span className="font-medium">{getEventTypeName(bundle.eventTypeId)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tema:</span>
                          <span className="font-medium">{getThemeName(bundle.themeStyleId)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Kategori:</span>
                          <span className="font-medium">{getCategoryName(bundle.categoryId)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ürün Sayısı:</span>
                          <span className="font-medium">{bundle.items.length} ürün</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Toplam Fiyat:</span>
                          <span className="text-lg font-bold text-rose-600">
                            ₺{calculateBundlePrice(bundle).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            // TODO: Implement bundle view/edit functionality
                            light('Set detayları')
                          }}
                        >
                          Seti Görüntüle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </HoverCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Bundle Wizard */}
      <BundleWizard
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        onComplete={handleBundleComplete}
        eventTypes={eventTypes}
        themeStyles={themeStyles}
        categories={categories}
        products={products}
      />
    </div>
  )
}

