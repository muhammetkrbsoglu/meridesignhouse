'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Star, 
  Sparkles, 
  Calendar, 
  Flower2,
  Cake,
  Leaf,
  Crown,
  Gem,
  Shapes
} from 'lucide-react'
import { fetchEventTypes, fetchThemeStyles } from '@/lib/api/eventsClient'
import type { EventType, ThemeStyle } from '@/types/event'
// Icon mapping for event types
const eventIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'doğum günü': Cake,
  'yıldönümü': Star,
  'kız isteme': Heart,
  'sevgililer günü': Heart,
  'anneler günü': Flower2,
  'öğretmenler günü': Sparkles
}

// Color mapping for event types
const eventColors: { [key: string]: string } = {
  'doğum günü': 'bg-pink-500',
  'yıldönümü': 'bg-yellow-500',
  'kız isteme': 'bg-rose-500',
  'sevgililer günü': 'bg-red-500',
  'anneler günü': 'bg-purple-500',
  'öğretmenler günü': 'bg-green-500'
}

// Icon mapping for theme styles
const themeIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'romantik': Heart,
  'modern': Sparkles,
  'doğal': Leaf,
  'klasik': Crown,
  'minimalist': Shapes,
  'vintage': Gem
}

// Background color mapping for theme style icons
const themeIconBg: { [key: string]: string } = {
  'romantik': 'bg-rose-500',
  'modern': 'bg-indigo-500',
  'doğal': 'bg-green-500',
  'klasik': 'bg-amber-600',
  'minimalist': 'bg-gray-700',
  'vintage': 'bg-purple-500'
}

export function EventConceptDesigner() {
  const [selectedEventType, setSelectedEventType] = useState<string>('')
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [currentStep, setCurrentStep] = useState(1)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [themeStyles, setThemeStyles] = useState<ThemeStyle[]>([])
  const [loading, setLoading] = useState(true)

  const [isMobileView, setIsMobileView] = useState(false)
  const prefersReducedMotionRef = useRef(false)
  const stepIndicatorRef = useRef<HTMLDivElement | null>(null)
  const themeStepRef = useRef<HTMLDivElement | null>(null)
  const resultStepRef = useRef<HTMLDivElement | null>(null)


  const scrollToElement = (element: HTMLElement | null, offset: number) => {
    if (!element || typeof window === 'undefined') return

    const targetTop = Math.max(element.getBoundingClientRect().top + window.scrollY - offset, 0)

    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotionRef.current ? 'auto' : 'smooth',
    })
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [events, themes] = await Promise.all([
          fetchEventTypes(),
          fetchThemeStyles()
        ])

        setEventTypes(events)
        setThemeStyles(themes)
      } catch (_error) {
        console.error('Veri yüklenirken hata:', _error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768)
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionChange = () => {
      prefersReducedMotionRef.current = mediaQuery.matches
    }

    handleResize()
    handleMotionChange()

    window.addEventListener('resize', handleResize)
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMotionChange)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleMotionChange)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMotionChange)
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleMotionChange)
      }
    }
  }, [])

  useEffect(() => {
    if (!isMobileView) return

    let frameId: number | null = null

    if (currentStep === 2) {
      const offset = (stepIndicatorRef.current?.offsetHeight ?? 0) + 24
      frameId = requestAnimationFrame(() => scrollToElement(themeStepRef.current, offset))
    } else if (currentStep === 3) {
      const offset = (stepIndicatorRef.current?.offsetHeight ?? 0) + 32
      frameId = requestAnimationFrame(() => scrollToElement(resultStepRef.current ?? themeStepRef.current, offset))
    }

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [currentStep, isMobileView])

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Otomatik geçiş fonksiyonları
  const handleEventTypeSelect = (eventId: string) => {
    setSelectedEventType(eventId)
    // Kısa bir gecikme ile sonraki adıma geç
    setTimeout(() => {
      setCurrentStep(2)
      // Mobil versiyonda tema seçimi bölümünün başına taşı (ilk seçeneğe)
      if (window.innerWidth < 768) {
        if (themeStepRef.current) {
          themeStepRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          })
        }
      }
    }, 300)
  }

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    // Tema seçildikten kısa süre sonra sonuç ekranına geç
    setTimeout(() => {
      setCurrentStep(3)
      // Mobil versiyonda sonuç bölümünün başına taşı (ilk seçeneğe)
      if (window.innerWidth < 768) {
        if (resultStepRef.current) {
          resultStepRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          })
        }
      }
    }, 300)
  }

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Etkinlik Konsept Tasarımcısı
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Hayalinizdeki etkinliği 2 adımda tasarlayın. Kişiselleştirilmiş konseptinizi oluşturun.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div ref={stepIndicatorRef} className="flex justify-center mb-8 sm:mb-12">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <motion.div 
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                    currentStep >= step 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                  animate={{ scale: currentStep === step ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {step}
                </motion.div>
                {step < 3 && (
                  <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                    currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            {/* Step 1: Event Type Selection */}
            {currentStep === 1 && (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
                  Etkinlik Türünüzü Seçin
                </h3>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-4"></div>
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventTypes.map((event: EventType) => {
                      const IconComponent = eventIcons[event.name.toLowerCase()] || Calendar
                      const colorClass = eventColors[event.name.toLowerCase()] || 'bg-purple-500'
                      return (
                        <motion.div
                          key={event.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={selectedEventType === event.id ? { scale: 1.02 } : { scale: 1 }}
                        >
                          <Card 
                            className={`group cursor-pointer transition-all duration-300 rounded-2xl border ${
                              selectedEventType === event.id 
                                ? 'ring-2 ring-rose-500 shadow-2xl bg-rose-50/80 border-rose-200' 
                                : 'hover:shadow-xl hover:-translate-y-1 bg-white border-gray-100'
                            }`}
                            onClick={() => handleEventTypeSelect(event.id)}
                          >
                            <CardContent className="p-7 text-center">
                              <div className={`w-16 h-16 ${colorClass} rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-black/10`}>
                                <IconComponent className="h-8 w-8 text-white" />
                              </div>
                              <h4 className="text-lg font-semibold mb-1">{event.name}</h4>
                              <p className="text-gray-600 text-sm">{event.description}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Theme Style Selection with Color Palettes */}
            {currentStep === 2 && (
              <div ref={themeStepRef} className="scroll-mt-28">
                <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
                  Tema Stilinizi ve Renk Paletinizi Seçin
                </h3>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex space-x-2 mb-4">
                            {[...Array(4)].map((_, j) => (
                              <div key={j} className="w-8 h-8 rounded-full bg-gray-200"></div>
                            ))}
                          </div>
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {themeStyles.map((theme: ThemeStyle) => (
                      <motion.div
                        key={theme.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={selectedTheme === theme.id ? { scale: 1.02 } : { scale: 1 }}
                      >
                        <Card 
                          className={`group cursor-pointer transition-all duration-300 rounded-2xl border ${
                            selectedTheme === theme.id 
                              ? 'ring-2 ring-rose-500 shadow-2xl bg-rose-50/80 border-rose-200' 
                              : 'hover:shadow-xl hover:-translate-y-1 bg-white border-gray-100'
                          }`}
                          onClick={() => handleThemeSelect(theme.id)}
                        >
                          <CardContent className="p-7">
                            {/* Theme style icon */}
                            <div className="flex justify-center mb-3">
                              {(() => {
                                const ThemeIcon = themeIcons[theme.name.toLowerCase()] || Sparkles
                                const bg = themeIconBg[theme.name.toLowerCase()] || 'bg-rose-500'
                                return (
                                  <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center shadow-md shadow-black/10`}>
                                    <ThemeIcon className="h-7 w-7 text-white" />
                                  </div>
                                )
                              })()}
                            </div>
                            <h4 className="text-lg font-semibold mb-3 text-center">{theme.name}</h4>
                            <div className="grid grid-cols-4 gap-3 mb-3 justify-items-center">
                              {theme.colors && theme.colors.map((color: string, index: number) => (
                                <div 
                                  key={index}
                                  className="h-10 w-10 rounded-xl ring-1 ring-black/5 shadow-sm transition-transform group-hover:scale-105"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <p className="text-gray-600 text-sm text-center">{theme.description}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Result Screen */}
            {currentStep === 3 && (
              <div ref={resultStepRef} className="text-center scroll-mt-36">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-8 shadow-xl">
                    <div className="text-5xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold mb-2">Harika seçim!</h3>
                    <p className="text-gray-600 mb-6">
                      Sizin için {eventTypes.find(e => e.id === selectedEventType)?.name} × {themeStyles.find(t => t.id === selectedTheme)?.name} ürünlerini hazırladık.
                    </p>
                    {/* Embedded Preview (previously separate card) */}
                    <div className="mt-6">
                      <h4 className="text-xl font-semibold text-center mb-2 text-gray-800">Tasarım Önizlemeniz</h4>
                      <div className="flex justify-center mb-4">
                        <Sparkles className="h-5 w-5 text-rose-500" />
                      </div>
                      <div className="space-y-5 text-center">
                        <div>
                          <Badge className="mb-2 bg-rose-100 text-rose-700">Etkinlik Türü</Badge>
                          <p className="font-semibold">
                            {eventTypes.find(e => e.id === selectedEventType)?.name}
                          </p>
                        </div>
                        <div>
                          <Badge className="mb-2 bg-purple-100 text-purple-700">Tema Stili & Renk Paleti</Badge>
                          <p className="font-semibold">
                            {themeStyles.find(t => t.id === selectedTheme)?.name}
                          </p>
                          {(() => {
                            const theme = themeStyles.find(t => t.id === selectedTheme)
                            const colors = theme?.colors && theme.colors.length > 0 ? theme.colors.slice(0, 4) : []
                            if (colors.length === 0) return null
                            return (
                              <div className="mt-3 flex items-center justify-center gap-2">
                                {colors.map((c: string, idx: number) => (
                                  <span key={idx} className="h-5 w-5 rounded-md ring-1 ring-black/5 shadow-sm" style={{ backgroundColor: c }} />
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href={`/products?event=${selectedEventType}&theme=${selectedTheme}`}
                        className="inline-flex items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors w-full sm:w-48 h-12"
                      >
                        Ürünleri gör
                      </a>
                      <Button
                        variant="outline"
                        onClick={() => { setSelectedTheme(''); setSelectedEventType(''); setCurrentStep(1) }}
                        className="w-full sm:w-48 h-12"
                      >
                        Tekrar dene
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-12">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-8 py-3"
          >
            Önceki
          </Button>
          
          <div className="flex space-x-4" />
        </div>

        
      </div>
    </section>
  )
}



























