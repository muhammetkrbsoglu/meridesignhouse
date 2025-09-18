'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles, Heart, Star } from 'lucide-react'
import { useHeroParallax } from '@/hooks/useParallax'
import { useDesktopAnimations } from '@/hooks/useDesktopAnimations'

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const { createFadeInAnimation, createStaggerAnimation } = useDesktopAnimations()
  const parallax = useHeroParallax()
  
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50" style={{ zIndex: 1 }}>
      {/* Background Elements - Desktop */}
      <div className="absolute inset-0 hidden md:block" aria-hidden="true">
        <motion.div 
          className="absolute top-20 left-10 text-rose-200"
          animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={24} />
        </motion.div>
        <motion.div 
          className="absolute top-40 right-20 text-pink-200"
          animate={shouldReduceMotion ? undefined : { rotate: -360, scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <Heart size={32} />
        </motion.div>
        <motion.div 
          className="absolute bottom-32 left-20 text-purple-200"
          animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <Star size={28} />
        </motion.div>
      </div>

      {/* Background Elements - Mobile */}
      <div className="absolute inset-0 md:hidden" aria-hidden="true">
        <motion.div 
          className="absolute top-16 left-4 text-rose-200/60"
          animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={16} />
        </motion.div>
        <motion.div 
          className="absolute top-32 right-6 text-pink-200/60"
          animate={shouldReduceMotion ? undefined : { rotate: -360, scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <Heart size={20} />
        </motion.div>
        <motion.div 
          className="absolute bottom-24 left-6 text-purple-200/60"
          animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <Star size={18} />
        </motion.div>
        <motion.div 
          className="absolute top-1/2 right-4 text-rose-200/40"
          animate={shouldReduceMotion ? undefined : { rotate: -180, scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={14} />
        </motion.div>
        <motion.div 
          className="absolute bottom-1/3 right-1/4 text-pink-200/40"
          animate={shouldReduceMotion ? undefined : { rotate: 180, scale: [1, 1.2, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        >
          <Heart size={16} />
        </motion.div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Desktop Left Content */}
          <motion.div 
            ref={parallax.ref}
            style={parallax.style}
            className="text-center lg:text-left hidden lg:block"
            {...createFadeInAnimation({ duration: 1.0, contextLevel: 'hero' })}
          >
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <span className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-lg">
                ✨ MeriDesignHouse – Tasarımın Merkezi
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Hayalinizdeki
              <span className="block">Etkinlik Tasarımı</span>
            </motion.h1>
            
            <motion.p 
              className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 text-gray-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Özel günlerinizi unutulmaz kılacak estetik ve şık tasarımlar. 
              Düğün, nişan, doğum günü ve daha fazlası için kişiselleştirilmiş konseptler.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                size="lg" 
                contextLevel="hero"
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Tasarım Başlat
              </Button>
              <Link href="/categories">
                <Button 
                  size="lg" 
                  variant="outline" 
                  contextLevel="featured"
                  className="border-2 border-rose-300 text-rose-600 hover:bg-rose-50 px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300 hover:border-rose-400 text-sm sm:text-base"
                >
                  Ürünleri İncele
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Desktop Right Content - Visual Elements */}
          <motion.div 
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative">
              {/* Desktop Visual Card */}
              <motion.div 
                className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              >
                <div className="aspect-square bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <motion.div 
                      className="text-6xl mb-4"
                      animate={shouldReduceMotion ? undefined : { rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🎨
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Etkinlik Konsept Tasarımcısı</h3>
                    <p className="text-gray-600 text-sm">Hayalinizdeki etkinliği tasarlayın</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Desktop Floating Cards */}
              <motion.div 
                className="absolute -top-4 -right-4 bg-rose-500 text-white p-4 rounded-2xl shadow-lg"
                animate={shouldReduceMotion ? undefined : { y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Heart className="h-6 w-6" />
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-4 -left-4 bg-purple-500 text-white p-4 rounded-2xl shadow-lg"
                animate={shouldReduceMotion ? undefined : { y: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Star className="h-6 w-6" />
              </motion.div>
            </div>
          </motion.div>

          {/* Mobile Combined Card */}
          <motion.div 
            className="relative lg:hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              {/* Mobile Combined Visual Card */}
              <motion.div 
                className="bg-white rounded-3xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
              >
                <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-6 relative overflow-hidden">
                  {/* Mobile Palette Background Pattern */}
                  <div className="absolute inset-0">
                    <div className="absolute top-4 left-4 w-8 h-8 bg-rose-200/30 rounded-full"></div>
                    <div className="absolute top-8 right-6 w-6 h-6 bg-pink-200/30 rounded-full"></div>
                    <div className="absolute bottom-6 left-8 w-7 h-7 bg-purple-200/30 rounded-full"></div>
                    <div className="absolute bottom-8 right-4 w-5 h-5 bg-rose-300/30 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-rose-200/20 to-pink-200/20 rounded-full"></div>
                  </div>
                  
                  <div className="text-center relative z-10">
                    {/* Badge */}
                    <motion.div
                      className="mb-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    >
                      <span className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-medium mb-4 shadow-lg">
                        ✨ MeriDesignHouse – Tasarımın Merkezi
                      </span>
                    </motion.div>

                    {/* Main Icon */}
                    <motion.div 
                      className="text-5xl mb-3"
                      animate={shouldReduceMotion ? undefined : { rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🎨
                    </motion.div>
                    
                    {/* Mobile Palette Emojis */}
                    <div className="flex justify-center space-x-2 mb-4">
                      <motion.span 
                        className="text-xl"
                        animate={shouldReduceMotion ? undefined : { scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      >
                        🎭
                      </motion.span>
                      <motion.span 
                        className="text-xl"
                        animate={shouldReduceMotion ? undefined : { scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      >
                        🌸
                      </motion.span>
                      <motion.span 
                        className="text-xl"
                        animate={shouldReduceMotion ? undefined : { scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                      >
                        ✨
                      </motion.span>
                      <motion.span 
                        className="text-xl"
                        animate={shouldReduceMotion ? undefined : { scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
                      >
                        💐
                      </motion.span>
                    </div>
                    
                    {/* Title */}
                    <motion.h1 
                      className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    >
                      Hayalinizdeki
                      <span className="block">Etkinlik Tasarımı</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.h3 
                      className="text-lg font-semibold text-gray-800 mb-2"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    >
                      Etkinlik Konsept Tasarımcısı
                    </motion.h3>
                    
                    {/* Description */}
                    <motion.p 
                      className="text-sm text-gray-600 mb-4"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    >
                      Özel günlerinizi unutulmaz kılacak estetik ve şık tasarımlar.
                    </motion.p>
                    
                    {/* Buttons */}
                    <motion.div 
                      className="flex flex-col sm:flex-row gap-3 justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                    >
                      <Button 
                        size="lg" 
                        contextLevel="hero"
                        className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Tasarım Başlat
                      </Button>
                      <Link href="/categories">
                        <Button 
                          size="lg" 
                          variant="outline" 
                          contextLevel="featured"
                          className="border-2 border-rose-300 text-rose-600 hover:bg-rose-50 px-6 py-3 rounded-full transition-all duration-300 hover:border-rose-400 text-sm"
                        >
                          Ürünleri İncele
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
              
              {/* Mobile Floating Cards */}
              <motion.div 
                className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-xl shadow-lg"
                animate={shouldReduceMotion ? undefined : { y: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Heart className="h-4 w-4" />
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-2 -left-2 bg-purple-500 text-white p-2 rounded-xl shadow-lg"
                animate={shouldReduceMotion ? undefined : { y: [3, -3, 3] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Star className="h-4 w-4" />
              </motion.div>

              <motion.div 
                className="absolute top-1/2 -right-1 bg-pink-500 text-white p-2 rounded-xl shadow-lg"
                animate={shouldReduceMotion ? undefined : { y: [-2, 2, -2] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 fill-white">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  )
}
