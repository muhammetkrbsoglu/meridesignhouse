'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles, Heart, Star, ArrowRight } from 'lucide-react'

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 overflow-hidden" style={{ zIndex: 1 }}>
      {/* Background Elements - Reduced motion for mobile */}
      <div className="absolute inset-0 hidden md:block" aria-hidden="true">
        <motion.div 
          className="absolute top-20 left-10 text-rose-200/60"
          animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={20} />
        </motion.div>
        <motion.div 
          className="absolute top-40 right-20 text-pink-200/60"
          animate={shouldReduceMotion ? undefined : { rotate: -360, scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          <Heart size={24} />
        </motion.div>
        <motion.div 
          className="absolute bottom-32 left-20 text-purple-200/60"
          animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <Star size={22} />
        </motion.div>
      </div>

      {/* Subtle gradient shift for premium feel */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-rose-50/80 via-pink-50/60 to-purple-50/80"
        animate={shouldReduceMotion ? undefined : { 
          background: [
            "linear-gradient(135deg, rgba(251, 113, 133, 0.1) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(168, 85, 247, 0.1) 100%)",
            "linear-gradient(135deg, rgba(251, 113, 133, 0.15) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(168, 85, 247, 0.15) 100%)",
            "linear-gradient(135deg, rgba(251, 113, 133, 0.1) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(168, 85, 247, 0.1) 100%)"
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content - Mobile-first typography */}
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              <span className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                ✨ MeriDesignHouse – Tasarımın Merkezi
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight line-clamp-2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              Hayalinizdeki
              <span className="block">Etkinlik Tasarımı</span>
            </motion.h1>
            
            <motion.p 
              className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-gray-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              Özel günlerinizi unutulmaz kılacak estetik ve şık tasarımlar. 
              Düğün, nişan, doğum günü ve daha fazlası için kişiselleştirilmiş konseptler.
            </motion.p>
            
            {/* CTA Stack - Single column, full width on mobile */}
            <motion.div 
              className="flex flex-col gap-3 sm:gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
              >
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base font-semibold min-h-[48px]"
                  aria-label="Tasarım sürecini başlat ve özel etkinlik tasarımı yap"
                >
                  <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Tasarım Başlat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
              
              <motion.div
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
              >
                <Link href="/categories" className="w-full sm:w-auto block">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full border-2 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-200 text-sm sm:text-base font-semibold min-h-[48px]"
                    aria-label="Tüm ürün kategorilerini incele ve keşfet"
                  >
                    Ürünleri İncele
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Right Content - Visual Elements - Hidden on mobile for cleaner UX */}
          <motion.div 
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
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
                      animate={shouldReduceMotion ? undefined : { rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🎨
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Etkinlik Konsept Tasarımcısı</h3>
                    <p className="text-gray-600 text-sm">Hayalinizdeki etkinliği tasarlayın</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Floating Cards - Subtle animations */}
              <motion.div 
                className="absolute -top-4 -right-4 bg-rose-500 text-white p-4 rounded-2xl shadow-lg"
                animate={shouldReduceMotion ? undefined : { y: [-3, 3, -3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart className="h-6 w-6" />
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-4 -left-4 bg-purple-500 text-white p-4 rounded-2xl shadow-lg"
                animate={shouldReduceMotion ? undefined : { y: [3, -3, 3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
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