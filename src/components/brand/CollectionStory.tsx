'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles, Heart, Star, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback'
import { BlurUpImage, Skeleton } from '@/components/motion/LoadingStates'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { cn } from '@/lib/utils'

interface CollectionStoryProps {
  className?: string
  variant?: 'default' | 'timeline' | 'carousel' | 'grid'
  autoPlay?: boolean
  showControls?: boolean
}

const collectionStories = [
  {
    id: 1,
    title: "Geleneksel Teknikler",
    subtitle: "20 Yıllık Deneyim",
    content: "Her ürünümüz, nesiller boyunca aktarılan geleneksel el sanatları teknikleri ile üretilir. Ustalarımızın deneyimi ve titizliği, her detayda kendini gösterir.",
    image: "/placeholder-product.jpg",
    icon: Award,
    color: "from-amber-500 to-orange-500",
    features: ["El Yapımı", "Geleneksel", "Özel"],
    stats: { years: 20, products: 5000, masters: 15 }
  },
  {
    id: 2,
    title: "Modern Tasarım",
    subtitle: "Çağdaş Yaklaşım",
    content: "Geleneksel teknikleri modern tasarım anlayışı ile harmanlayarak, günümüzün ihtiyaçlarına uygun ürünler üretiyoruz.",
    image: "/placeholder-product.jpg",
    icon: Sparkles,
    color: "from-rose-500 to-pink-500",
    features: ["Modern", "Çağdaş", "İnovatif"],
    stats: { years: 15, products: 3000, masters: 12 }
  },
  {
    id: 3,
    title: "Sürdürülebilir Üretim",
    subtitle: "Çevre Dostu",
    content: "Çevre dostu malzemeler kullanarak, gelecek nesillere daha yaşanabilir bir dünya bırakmak için çalışıyoruz.",
    image: "/placeholder-product.jpg",
    icon: Heart,
    color: "from-green-500 to-emerald-500",
    features: ["Ekolojik", "Sürdürülebilir", "Doğal"],
    stats: { years: 10, products: 2000, masters: 8 }
  },
  {
    id: 4,
    title: "Müşteri Memnuniyeti",
    subtitle: "Kalite Odaklı",
    content: "Her müşterimiz bizim için değerlidir. Ürünlerimizi seçerken, sizin mutluluğunuzu ve memnuniyetinizi ön planda tutuyoruz.",
    image: "/placeholder-product.jpg",
    icon: Star,
    color: "from-blue-500 to-cyan-500",
    features: ["Kaliteli", "Güvenilir", "Memnuniyet"],
    stats: { years: 25, products: 8000, masters: 20 }
  }
]

export function CollectionStory({
  className,
  variant = 'default',
  autoPlay = false,
  showControls = true
}: CollectionStoryProps) {
  const [currentStory, setCurrentStory] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isExpanded, setIsExpanded] = useState(false)
  const { light, medium, success } = useHapticFeedback()

  const currentData = collectionStories[currentStory]
  const IconComponent = currentData.icon

  const handleNext = () => {
    setCurrentStory((prev) => (prev + 1) % collectionStories.length)
    medium('Sonraki hikaye')
  }

  const handlePrev = () => {
    setCurrentStory((prev) => (prev - 1 + collectionStories.length) % collectionStories.length)
    medium('Önceki hikaye')
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    light(isPlaying ? 'Duraklatıldı' : 'Oynatıldı')
  }

  const handleStorySelect = (index: number) => {
    setCurrentStory(index)
    medium('Hikaye seçildi')
  }

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
    light('Hikaye genişletildi')
  }

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentStory((prev) => (prev + 1) % collectionStories.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPlaying])

  if (variant === 'timeline') {
    return (
      <section className={cn('py-16 bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-purple-50/50', className)}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Koleksiyon Hikayesi
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Üretim sürecimizin her aşamasında kalite ve güvenilirlik
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-rose-500 to-pink-500 rounded-full" />
            
            {collectionStories.map((story, index) => {
              const StoryIcon = story.icon
              const isLeft = index % 2 === 0
              
              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={cn(
                    'relative flex items-center mb-16',
                    isLeft ? 'flex-row' : 'flex-row-reverse'
                  )}
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    'absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-r',
                    story.color,
                    'shadow-lg z-10'
                  )}>
                    <StoryIcon className="w-4 h-4 text-white m-1" />
                  </div>

                  {/* Content card */}
                  <div className={cn(
                    'w-5/12',
                    isLeft ? 'pr-8 text-right' : 'pl-8 text-left'
                  )}>
                    <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn(
                            'p-2 rounded-full bg-gradient-to-r',
                            story.color
                          )}>
                            <StoryIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900">
                              {story.title}
                            </CardTitle>
                            <p className="text-sm text-gray-500">{story.subtitle}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{story.content}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {story.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{story.stats.years} yıl deneyim</span>
                          <span>{story.stats.products.toLocaleString('tr-TR')} ürün</span>
                          <span>{story.stats.masters} usta</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'carousel') {
    return (
      <section className={cn('py-16 bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-purple-50/50', className)}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Koleksiyon Hikayesi
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Üretim sürecimizin her aşamasında kalite ve güvenilirlik
            </p>
          </motion.div>

          <div className="relative">
            {/* Main story display */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="relative">
                  <BlurUpImage
                    src={currentData.image}
                    alt={currentData.title}
                    className="w-full h-64 lg:h-full object-cover"
                    width={600}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  
                  {/* Story number */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-gray-900">
                    {currentStory + 1} / {collectionStories.length}
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      'p-3 rounded-full bg-gradient-to-r',
                      currentData.color
                    )}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {currentData.title}
                      </h3>
                      <p className="text-gray-500">{currentData.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {currentData.content}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentData.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-sm">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {currentData.stats.years}
                      </div>
                      <div className="text-sm text-gray-500">Yıl Deneyim</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {currentData.stats.products.toLocaleString('tr-TR')}
                      </div>
                      <div className="text-sm text-gray-500">Ürün</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {currentData.stats.masters}
                      </div>
                      <div className="text-sm text-gray-500">Usta</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Controls */}
            {showControls && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <MicroFeedback
                  onClick={handlePrev}
                  hapticType="light"
                  hapticMessage="Önceki hikaye"
                >
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </MicroFeedback>

                <MicroFeedback
                  onClick={handlePlayPause}
                  hapticType="light"
                  hapticMessage={isPlaying ? 'Duraklat' : 'Oynat'}
                >
                  <Button variant="outline" size="icon">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                </MicroFeedback>

                <MicroFeedback
                  onClick={handleNext}
                  hapticType="light"
                  hapticMessage="Sonraki hikaye"
                >
                  <Button variant="outline" size="icon">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </MicroFeedback>
              </div>
            )}

            {/* Story indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {collectionStories.map((_, index) => (
                <MicroFeedback
                  key={index}
                  onClick={() => handleStorySelect(index)}
                  hapticType="light"
                  hapticMessage={`Hikaye ${index + 1}`}
                >
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full transition-all duration-300 cursor-pointer',
                      index === currentStory
                        ? 'bg-rose-500 scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                    )}
                  />
                </MicroFeedback>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Default grid variant
  return (
    <section className={cn('py-16 bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-purple-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Koleksiyon Hikayesi
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Üretim sürecimizin her aşamasında kalite ve güvenilirlik
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collectionStories.map((story, index) => {
            const StoryIcon = story.icon
            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <MicroFeedback
                  onClick={() => handleStorySelect(index)}
                  hapticType="light"
                  hapticMessage={`${story.title} seçildi`}
                  className="h-full"
                >
                  <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl group dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          'p-2 rounded-full bg-gradient-to-r',
                          story.color
                        )}>
                          <StoryIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {story.title}
                          </CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{story.subtitle}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                        {story.content}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {story.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{story.stats.years}y</span>
                        <span>{story.stats.products.toLocaleString('tr-TR')} ürün</span>
                        <span>{story.stats.masters} usta</span>
                      </div>
                    </CardContent>
                  </Card>
                </MicroFeedback>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
