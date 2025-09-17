'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, Sparkles, Heart, Star, Award, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { cn } from '@/lib/utils'

interface UstaninNotuProps {
  className?: string
  variant?: 'default' | 'compact' | 'featured'
  showStats?: boolean
}

const masterNotes = [
  {
    id: 1,
    title: "El Yapımı Kalite",
    content: "Her ürünümüz, geleneksel el sanatları teknikleri ile modern tasarım anlayışını harmanlayarak üretilir. Ustalarımızın deneyimi ve titizliği, her detayda kendini gösterir.",
    author: "Usta Mehmet",
    experience: "25 yıl deneyim",
    icon: Award,
    color: "from-amber-500 to-orange-500",
    stats: { products: 1200, customers: 8500, rating: 4.9 }
  },
  {
    id: 2,
    title: "Sürdürülebilir Üretim",
    content: "Çevre dostu malzemeler kullanarak, gelecek nesillere daha yaşanabilir bir dünya bırakmak için çalışıyoruz. Her ürünümüzde bu sorumluluğu hissedebilirsiniz.",
    author: "Usta Ayşe",
    experience: "18 yıl deneyim",
    icon: Heart,
    color: "from-green-500 to-emerald-500",
    stats: { products: 800, customers: 6200, rating: 4.8 }
  },
  {
    id: 3,
    title: "Müşteri Memnuniyeti",
    content: "Her müşterimiz bizim için değerlidir. Ürünlerimizi seçerken, sizin mutluluğunuzu ve memnuniyetinizi ön planda tutuyoruz. Bu yaklaşımımız, 20 yıllık deneyimimizin temelini oluşturur.",
    author: "Usta Ali",
    experience: "20 yıl deneyim",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    stats: { products: 1500, customers: 12000, rating: 4.9 }
  }
]

export function UstaninNotu({ 
  className, 
  variant = 'default',
  showStats = true 
}: UstaninNotuProps) {
  const [selectedNote, setSelectedNote] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const { light, medium } = useHapticFeedback()

  const currentNote = masterNotes[selectedNote]
  const IconComponent = currentNote.icon

  const handleNoteChange = (index: number) => {
    setSelectedNote(index)
    medium('Usta notu değişti')
  }

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
    light('Usta notu genişletildi')
  }

  const variants = {
    default: 'max-w-4xl mx-auto',
    compact: 'max-w-2xl mx-auto',
    featured: 'max-w-6xl mx-auto'
  }

  return (
    <section className={cn('py-16 bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-purple-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50', className)}>
      <div className={variants[variant]}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-3 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-lg"
            >
              <Quote className="w-6 h-6 text-white" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Ustanın Notu
            </h2>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Deneyimli ustalarımızdan özel notlar ve üretim hikayeleri
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {masterNotes.map((note, index) => {
            const IconComponent = note.icon
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative"
              >
                <MicroFeedback
                  onClick={() => handleNoteChange(index)}
                  hapticType="light"
                  hapticMessage={`${note.title} seçildi`}
                  className="h-full"
                >
                  <Card className={cn(
                    'h-full cursor-pointer transition-all duration-300 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700',
                    selectedNote === index 
                      ? 'ring-2 ring-rose-500 shadow-xl scale-105' 
                      : 'hover:shadow-lg'
                  )}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          'p-2 rounded-full bg-gradient-to-r',
                          note.color
                        )}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {note.title}
                          </CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {note.author} • {note.experience}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {note.content}
                      </p>
                      
                      {showStats && (
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {note.stats.rating}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {note.stats.products.toLocaleString('tr-TR')} ürün
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {note.stats.customers.toLocaleString('tr-TR')} müşteri
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </MicroFeedback>
              </motion.div>
            )
          })}
        </div>

        {/* Selected Note Detail */}
        <motion.div
          key={selectedNote}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-3 rounded-full bg-gradient-to-r',
                    currentNote.color
                  )}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {currentNote.title}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300">
                      {currentNote.author} • {currentNote.experience}
                    </p>
                  </div>
                </div>
                
                <MicroFeedback
                  onClick={handleExpand}
                  hapticType="light"
                  hapticMessage={isExpanded ? 'Daralt' : 'Genişlet'}
                >
                  <Badge variant="outline" className="cursor-pointer hover:bg-rose-50">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isExpanded ? 'Daralt' : 'Detayları Gör'}
                  </Badge>
                </MicroFeedback>
              </div>
            </CardHeader>
            
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isExpanded ? 'expanded' : 'collapsed'}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className={cn(
                    'text-gray-700 dark:text-gray-300 leading-relaxed',
                    isExpanded ? 'text-base' : 'text-sm line-clamp-2'
                  )}>
                    {currentNote.content}
                  </p>
                  
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mt-6 p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-lg"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Usta Hakkında</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {currentNote.author}, {currentNote.experience} ile sektörde öncü konumda. 
                        Üretim süreçlerinde geleneksel teknikleri modern yaklaşımlarla harmanlayarak, 
                        her ürünü özel kılan detaylara odaklanır.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
