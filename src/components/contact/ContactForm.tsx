'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Send, CheckCircle, Phone, Mail, MapPin, Sparkles, AlertCircle } from 'lucide-react'
import { createContactMessage } from '@/lib/actions/messages'
import { isValidTurkishPhone, getWhatsAppHref } from '@/lib/whatsapp-utils'
import { useToast } from '@/hooks/use-toast'
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

const contactSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z
    .string()
    .min(1, 'Telefon numarası zorunludur')
    .min(10, 'Telefon numarası en az 10 haneli olmalıdır')
    .refine((val) => isValidTurkishPhone(val), 'Geçerli bir telefon numarası girin'),
  subject: z.string().min(5, 'Konu en az 5 karakter olmalıdır'),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
})

type FormData = z.infer<typeof contactSchema>

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()
  const { light, medium, success, error } = useHapticFeedback()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    medium('Mesaj gönderiliyor')

    try {
      const result = await createContactMessage(data)

      if (result.success) {
        setIsSubmitted(true)
        reset()
        success('Mesaj başarıyla gönderildi')
        toast({ intent: 'success', description: result.message })
      } else {
        error('Mesaj gönderme hatası')
        toast({ intent: 'error', description: result.message })
      }
    } catch (_error) {
      error('Mesaj gönderme hatası')
      toast({ intent: 'error', description: 'Mesaj gönderilirken bir hata oluştu.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="w-full max-w-2xl mx-auto border-green-200 bg-green-50/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Mesajınız Gönderildi!</h3>
                <p className="text-gray-600 mb-4">
                  Mesajınız başarıyla alındı. En kısa sürede size dönüş yapacağız.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Talebinizi Profilim {'>'} Mesajlarım sayfasından takip edebilirsiniz
                  </span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <MicroFeedback
                  onClick={() => setIsSubmitted(false)}
                  hapticType="light"
                  hapticMessage="Yeni mesaj gönder"
                >
                  <Button variant="outline" className="w-full sm:w-auto">
                    Yeni Mesaj Gönder
                  </Button>
                </MicroFeedback>
                
                <MicroFeedback
                  onClick={() => {}}
                  hapticType="medium"
                  hapticMessage="Profili görüntüle"
                >
                  <a href="/profile">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                      Profilimde Takip Et
                    </Button>
                  </a>
                </MicroFeedback>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name and Email Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-2"
          >
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Ad Soyad *
            </Label>
            <HoverCard
              shimmer={false}
              hapticType="light"
              hapticMessage="Ad soyad girişi"
              className="w-full"
            >
              <Input
                id="name"
                {...register('name')}
                placeholder="Adınızı ve soyadınızı girin"
                className={`min-h-[44px] ${errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'}`}
              />
            </HoverCard>
            <AnimatePresence>
              {errors.name && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-sm text-red-600"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.name.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-posta *
            </Label>
            <HoverCard
              shimmer={false}
              hapticType="light"
              hapticMessage="E-posta girişi"
              className="w-full"
            >
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="E-posta adresinizi girin"
                className={`min-h-[44px] ${errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'}`}
              />
            </HoverCard>
            <AnimatePresence>
              {errors.email && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-sm text-red-600"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.email.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Phone Field */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-2"
        >
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Telefon *
          </Label>
          <HoverCard
            shimmer={false}
            hapticType="light"
            hapticMessage="Telefon girişi"
            className="w-full"
          >
            <Input
              id="phone"
              {...register('phone')}
              placeholder="05xx xxx xx xx"
              className={`min-h-[44px] ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'}`}
            />
          </HoverCard>
          <AnimatePresence>
            {errors.phone && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-sm text-red-600"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.phone.message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Subject Field */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-2"
        >
          <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
            Konu *
          </Label>
          <HoverCard
            shimmer={false}
            hapticType="light"
            hapticMessage="Konu girişi"
            className="w-full"
          >
            <Input
              id="subject"
              {...register('subject')}
              placeholder="Mesajınızın konusunu girin"
              className={`min-h-[44px] ${errors.subject ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'}`}
            />
          </HoverCard>
          <AnimatePresence>
            {errors.subject && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-sm text-red-600"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.subject.message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Message Field */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="space-y-2"
        >
          <Label htmlFor="message" className="text-sm font-medium text-gray-700">
            Mesaj *
          </Label>
          <HoverCard
            shimmer={false}
            hapticType="light"
            hapticMessage="Mesaj girişi"
            className="w-full"
          >
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Mesajınızı detaylı olarak yazın..."
              rows={6}
              className={`min-h-[120px] resize-none ${errors.message ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'}`}
            />
          </HoverCard>
          <AnimatePresence>
            {errors.message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-sm text-red-600"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.message.message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <MicroFeedback
            onClick={() => {}}
            hapticType="success"
            hapticMessage="Mesaj gönder"
            className="flex-1"
          >
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full min-h-[44px] bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Mesaj Gönder
                </>
              )}
            </Button>
          </MicroFeedback>
          
          <MicroFeedback
            onClick={() => {
              const name = (document.getElementById('name') as HTMLInputElement)?.value || ''
              const email = (document.getElementById('email') as HTMLInputElement)?.value || ''
              const phone = (document.getElementById('phone') as HTMLInputElement)?.value || ''
              const subject = (document.getElementById('subject') as HTMLInputElement)?.value || ''
              const message = (document.getElementById('message') as HTMLTextAreaElement)?.value || ''

              if (!name || !email || !phone || !subject || !message) {
                toast({ intent: 'info', description: 'Lütfen form alanlarını doldurun' })
                return
              }
              if (!isValidTurkishPhone(phone)) {
                toast({ intent: 'error', description: 'Geçerli bir telefon numarası girin' })
                return
              }

              const text = `Merhaba,\n\nİletişim Talebi\n- Ad Soyad: ${name}\n- E-posta: ${email}\n- Telefon: ${phone}\n- Konu: ${subject}\n\nMesaj:\n${message}`
              const href = getWhatsAppHref(phone, text)
              window.open(href, '_blank')
              success('WhatsApp\'a yönlendiriliyor')
            }}
            hapticType="medium"
            hapticMessage="WhatsApp ile gönder"
            className="flex-1"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[44px] border-green-200 text-green-700 hover:bg-green-50 font-semibold"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp ile Gönder
            </Button>
          </MicroFeedback>
        </motion.div>
      </form>
    </motion.div>
  )
}