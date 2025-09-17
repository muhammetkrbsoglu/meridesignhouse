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
    <section className="relative min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 overflow-hidden" style={{ zIndex: 1 }}>
      {/* Background Elements */}
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <motion.div 
            ref={parallax.ref}
            style={parallax.style}
            className="text-center lg:text-left"
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
          
          {/* Right Content - Visual Elements */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative">
              {/* Main Visual Card */}
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
              
              {/* Floating Cards */}
              <motion.div 
                className="absolute -top-4 -right-4 bg-rose-500 text-white p-4 rounded-2xl shadow-lg hidden md:block"
                animate={shouldReduceMotion ? undefined : { y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Heart className="h-6 w-6" />
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-4 -left-4 bg-purple-500 text-white p-4 rounded-2xl shadow-lg hidden md:block"
                animate={shouldReduceMotion ? undefined : { y: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Star className="h-6 w-6" />
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