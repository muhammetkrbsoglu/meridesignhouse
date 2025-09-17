'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  Instagram,
  HelpCircle,
  Headphones,
  FileText,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContactForm } from './ContactForm'
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { getWhatsAppHref } from '@/lib/whatsapp-utils'
import { SUPPORT_WHATSAPP_PHONE } from '@/lib/constants'

const QUICK_ACTIONS = [
  {
    id: 'whatsapp',
    title: 'WhatsApp Destek',
    description: 'Anında yanıt için WhatsApp\'tan yazın',
    icon: MessageCircle,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    href: getWhatsAppHref(SUPPORT_WHATSAPP_PHONE, 'Merhaba, Meri Design House hakkında bilgi almak istiyorum.'),
    hapticType: 'success' as const
  },
  {
    id: 'phone',
    title: 'Telefon',
    description: 'Doğrudan arama yapın',
    icon: Phone,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    href: `tel:${SUPPORT_WHATSAPP_PHONE}`,
    hapticType: 'medium' as const
  },
  {
    id: 'email',
    title: 'E-posta',
    description: 'Detaylı mesaj gönderin',
    icon: Mail,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    href: 'mailto:info@meridesignhouse.com',
    hapticType: 'light' as const
  },
  {
    id: 'instagram',
    title: 'Instagram',
    description: 'Yeni koleksiyonlar için DM',
    icon: Instagram,
    color: 'from-pink-500 to-purple-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    href: 'https://instagram.com/meridesignhouse',
    hapticType: 'light' as const
  }
]

const HELP_CATEGORIES = [
  {
    id: 'shipping',
    title: 'Kargo & Teslimat',
    description: 'Kargo süreleri, takip ve teslimat bilgileri',
    icon: MapPin,
    color: 'from-rose-500 to-pink-500',
    questions: [
      'Kargo süresi ne kadar?',
      'Kargo takip numarası nasıl alırım?',
      'Hangi şehirlere kargo gönderiyorsunuz?',
      'Kargo ücreti ne kadar?'
    ]
  },
  {
    id: 'orders',
    title: 'Sipariş & Ödeme',
    description: 'Sipariş süreci, ödeme ve iptal işlemleri',
    icon: FileText,
    color: 'from-blue-500 to-indigo-500',
    questions: [
      'Siparişimi nasıl iptal ederim?',
      'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
      'Sipariş durumumu nasıl takip ederim?',
      'Fatura nasıl alırım?'
    ]
  },
  {
    id: 'products',
    title: 'Ürün & Tasarım',
    description: 'Ürün detayları, özelleştirme ve tasarım',
    icon: Star,
    color: 'from-yellow-500 to-orange-500',
    questions: [
      'Ürünleri özelleştirebilir miyim?',
      'Hangi malzemeler kullanılıyor?',
      'Ürün boyutları nelerdir?',
      'Özel tasarım yapıyor musunuz?'
    ]
  },
  {
    id: 'support',
    title: 'Teknik Destek',
    description: 'Web sitesi, hesap ve teknik sorunlar',
    icon: Headphones,
    color: 'from-green-500 to-teal-500',
    questions: [
      'Hesabımı nasıl oluştururum?',
      'Şifremi nasıl sıfırlarım?',
      'Web sitesi çalışmıyor, ne yapmalıyım?',
      'Mobil uygulamanız var mı?'
    ]
  }
]

export function ContactPageClient() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { light, medium, success } = useHapticFeedback()

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.href.startsWith('http') || action.href.startsWith('mailto:') || action.href.startsWith('tel:')) {
      window.open(action.href, '_blank')
    } else {
      window.location.href = action.href
    }
    
    if (action.hapticType === 'success') {
      success('WhatsApp\'a yönlendiriliyor')
    } else if (action.hapticType === 'medium') {
      medium('Telefon açılıyor')
    } else {
      light('İletişim kanalı açılıyor')
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId)
    light('Kategori seçildi')
  }

  const handleShowForm = () => {
    setShowForm(true)
    medium('Form açılıyor')
  }

  const handleHideForm = () => {
    setShowForm(false)
    light('Form kapatılıyor')
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
                <MessageCircle className="w-5 h-5 text-rose-600" />
                <span className="text-sm font-medium text-rose-700">İletişim & Destek</span>
                <Sparkles className="w-4 h-4 text-rose-500" />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Size Nasıl Yardımcı Olabiliriz?
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
                Sorularınız için en hızlı yanıtı alın. WhatsApp, telefon veya form ile bize ulaşın.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Hızlı İletişim
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            En hızlı yanıt için aşağıdaki kanallardan birini seçin
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {QUICK_ACTIONS.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <MicroFeedback
                  onClick={() => handleQuickAction(action)}
                  hapticType={action.hapticType}
                  hapticMessage={action.title}
                  className="h-full"
                >
                  <Card className={`h-full cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${action.borderColor} ${action.bgColor} hover:scale-105`}>
                    <CardContent className="p-6 text-center">
                      <motion.div
                        className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${action.color} flex items-center justify-center text-white shadow-lg`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-8 h-8" />
                      </motion.div>
                      <h3 className={`text-lg font-semibold ${action.textColor} mb-2`}>
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {action.description}
                      </p>
                      <motion.div
                        className="mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <ArrowRight className="w-5 h-5 mx-auto text-gray-400" />
                      </motion.div>
                    </CardContent>
                  </Card>
                </MicroFeedback>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Help Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sık Sorulan Sorular
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kategorilere göre düzenlenmiş sık sorulan sorular
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {HELP_CATEGORIES.map((category, index) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <HoverCard
                  shimmer={false}
                  hapticType="light"
                  hapticMessage={category.title}
                  className="h-full"
                >
                  <Card 
                    className={`h-full cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                      isSelected ? 'border-rose-300 bg-rose-50' : 'border-gray-200 hover:border-rose-200'
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <motion.div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-white shadow-lg`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="w-6 h-6" />
                        </motion.div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {category.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {category.description}
                          </p>
                        </div>
                        <motion.div
                          animate={{ rotate: isSelected ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </motion.div>
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {category.questions.map((question, qIndex) => (
                                <motion.div
                                  key={qIndex}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, delay: qIndex * 0.1 }}
                                  className="p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                  <p className="text-sm text-gray-700">{question}</p>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </HoverCard>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Detaylı Mesaj Gönderin
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Formu doldurarak detaylı mesajınızı gönderebilirsiniz
          </p>
          
          {!showForm && (
            <MicroFeedback
              onClick={handleShowForm}
              hapticType="medium"
              hapticMessage="Formu aç"
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <FileText className="w-6 h-6 mr-3" />
                Formu Aç
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </MicroFeedback>
          )}
        </motion.div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-4xl mx-auto border-rose-200/50 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Send className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          İletişim Formu
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Mesajınızı gönderin, en kısa sürede yanıtlayalım
                        </p>
                      </div>
                    </div>
                    <MicroFeedback
                      onClick={handleHideForm}
                      hapticType="light"
                      hapticMessage="Formu kapat"
                    >
                      <Button variant="ghost" size="sm" className="p-2">
                        ×
                      </Button>
                    </MicroFeedback>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ContactForm />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contact Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            İletişim Bilgileri
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Phone,
              title: 'Telefon',
              content: SUPPORT_WHATSAPP_PHONE,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-700'
            },
            {
              icon: Mail,
              title: 'E-posta',
              content: 'info@meridesignhouse.com',
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50',
              textColor: 'text-purple-700'
            },
            {
              icon: Clock,
              title: 'Çalışma Saatleri',
              content: 'Pazartesi - Cuma: 09:00 - 18:00\nCumartesi: 10:00 - 16:00',
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50',
              textColor: 'text-green-700'
            }
          ].map((info, index) => {
            const Icon = info.icon
            return (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <HoverCard
                  shimmer={false}
                  hapticType="light"
                  hapticMessage={info.title}
                  className="h-full"
                >
                  <Card className={`h-full text-center ${info.bgColor} border-0 hover:shadow-lg transition-all duration-300`}>
                    <CardContent className="p-6">
                      <motion.div
                        className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${info.color} flex items-center justify-center text-white shadow-lg`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-8 h-8" />
                      </motion.div>
                      <h3 className={`text-lg font-semibold ${info.textColor} mb-2`}>
                        {info.title}
                      </h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {info.content}
                      </p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
