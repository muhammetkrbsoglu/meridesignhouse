'use client'

import Link from 'next/link'
import { Heart, Sparkles, Star, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react'
import { motion } from 'framer-motion'

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 text-gray-800 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-10 left-10 text-rose-200"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={24} />
        </motion.div>
        <motion.div 
          className="absolute top-20 right-20 text-pink-200"
          animate={{ rotate: -360, scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <Heart size={32} />
        </motion.div>
        <motion.div 
          className="absolute bottom-20 left-20 text-purple-200"
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <Star size={28} />
        </motion.div>
        <motion.div 
          className="absolute top-32 right-32 text-rose-300/30"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles size={20} />
        </motion.div>
        <motion.div 
          className="absolute bottom-32 right-10 text-pink-300/30"
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Heart size={24} />
        </motion.div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Company Info */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-1.5 rounded-full shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">MeriDesignHouse</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tasarımın merkezi MeriDesignHouse ile özel anlarınızı unutulmaz kılın. 
              Etkinlik konseptlerinden dekoratif ürünlere kadar her detayda mükemmellik.
            </p>
            <div className="flex space-x-4">
              <motion.a 
                href="#" 
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 p-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5 text-white" />
              </motion.a>
              <motion.a 
                href="#" 
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 p-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5 text-white" />
              </motion.a>
              <motion.a 
                href="#" 
                className="bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 p-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5 text-white" />
              </motion.a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-base font-semibold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Hızlı Linkler</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-rose-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-rose-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-600 hover:text-rose-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  Ürünler
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-rose-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  Kategoriler
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-gray-600 hover:text-rose-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  Favorilerim
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Customer Service */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-base font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Müşteri Hizmetleri</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-pink-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  Yardım Merkezi
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-600 hover:text-pink-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  Kargo Bilgileri
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-600 hover:text-pink-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  İade ve Değişim
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="text-gray-600 hover:text-pink-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  Garanti Koşulları
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-pink-600 transition-colors duration-300 hover:translate-x-1 inline-block">
                  Sık Sorulan Sorular
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-500 to-rose-500 p-1.5 rounded-full shadow-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold bg-gradient-to-r from-purple-600 to-rose-600 bg-clip-text text-transparent">Bülten</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Yeni ürünler ve özel indirimlerden haberdar olmak için bültenimize abone olun.
            </p>
            <form className="space-y-2.5">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="w-full px-3 py-2.5 bg-white/80 border border-rose-200 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 shadow-lg"
              />
              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium py-2.5 px-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Abone Ol</span>
                </span>
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div 
          className="mt-6 pt-4 border-t border-rose-200/30"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-gray-600 text-sm">
                © 2024 MeriDesignHouse. Tüm hakları saklıdır.
              </p>
              <div className="flex space-x-4 text-sm">
                <Link href="/privacy" className="text-gray-500 hover:text-rose-600 transition-colors duration-300">
                  Gizlilik Politikası
                </Link>
                <Link href="/terms" className="text-gray-500 hover:text-rose-600 transition-colors duration-300">
                  Kullanım Koşulları
                </Link>
                <Link href="/cookies" className="text-gray-500 hover:text-rose-600 transition-colors duration-300">
                  Çerez Politikası
                </Link>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-gray-600 text-sm">Güvenli Ödeme:</span>
              <div className="flex space-x-2">
                <motion.div 
                  className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg px-2.5 py-1.5 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-xs font-bold">VISA</span>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg px-2.5 py-1.5 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-xs font-bold">MC</span>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-r from-purple-500 to-rose-500 text-white rounded-lg px-2.5 py-1.5 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-xs font-bold">AMEX</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
