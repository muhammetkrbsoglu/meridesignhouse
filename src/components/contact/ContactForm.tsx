'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Send, CheckCircle, Phone, Mail, MapPin } from 'lucide-react'
import { createContactMessage } from '@/lib/actions/messages'
import { isValidTurkishPhone, getWhatsAppHref } from '@/lib/whatsapp-utils'
import { useToast } from '@/hooks/use-toast'

const contactSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z
    .string({ required_error: 'Telefon numarası zorunludur' })
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

    try {
      const result = await createContactMessage(data)

      if (result.success) {
        setIsSubmitted(true)
        reset()
        toast({ intent: 'success', description: result.message })
      } else {
        toast({ intent: 'error', description: result.message })
      }
    } catch (_error) {
      toast({ intent: 'error', description: 'Mesaj gönderilirken bir hata oluştu.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mesajınız Gönderildi!</h3>
              <p className="text-gray-600 mt-2">
                Mesajınız başarıyla alındı. En kısa sürede size dönüş yapacağız.
              </p>
              <p className="text-gray-600 mt-1">
                Talebinizi <span className="font-medium">Profilim &gt; Mesajlarım</span> sayfasından takip edebilirsiniz.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button 
                onClick={() => setIsSubmitted(false)}
                variant="outline"
              >
                Yeni Mesaj Gönder
              </Button>
              <a href="/profile">
                <Button>
                  Profilimde Takip Et
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Contact Information */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>İletişim Bilgileri</CardTitle>
            <CardDescription>
              Bize ulaşmak için aşağıdaki bilgileri kullanabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Telefon</p>
                <p className="text-gray-600">+90 212 123 45 67</p>
                <p className="text-gray-600">+90 532 987 65 43</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">E-posta</p>
                <p className="text-gray-600">info@meridesignhouse.com</p>
                <p className="text-gray-600">destek@meridesignhouse.com</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Adres</p>
                <p className="text-gray-600">
                  Merkez Mahallesi, Design Sokak No:123<br />
                  Şişli / İstanbul
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Contact */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">WhatsApp Destek</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Hızlı destek için WhatsApp&apos;tan bize ulaşın
                </p>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => window.open('https://wa.me/905329876543', '_blank')}
                >
                  WhatsApp&apos;ta Mesaj Gönder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Bize Mesaj Gönderin</CardTitle>
            <CardDescription>
              Sorularınız, önerileriniz veya talepleriniz için aşağıdaki formu doldurabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Adınızı ve soyadınızı girin"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="E-posta adresinizi girin"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="05xx xxx xx xx"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Konu *</Label>
                <Input
                  id="subject"
                  {...register('subject')}
                  placeholder="Mesajınızın konusunu girin"
                  className={errors.subject ? 'border-red-500' : ''}
                />
                {errors.subject && (
                  <p className="text-sm text-red-600">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mesaj *</Label>
                <Textarea
                  id="message"
                  {...register('message')}
                  placeholder="Mesajınızı detaylı olarak yazın..."
                  rows={6}
                  className={errors.message ? 'border-red-500' : ''}
                />
                {errors.message && (
                  <p className="text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
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
                  }}
                >
                  Bu Mesajı WhatsApp ile Gönder
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}