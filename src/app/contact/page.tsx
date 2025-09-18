import { Metadata } from 'next'
import { ContactForm } from '@/components/contact/ContactForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Phone } from 'lucide-react'
import { MicroFeedback } from '@/components/motion/MicroFeedback'

export const metadata: Metadata = {
  title: 'İletişim | Meri Design House',
  description: 'Bizimle iletişime geçin. Sorularınız için bize ulaşın.',
}

export default function ContactPage() {
  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">İletişim</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              En hızlı yanıt için WhatsApp ve Instagram üzerinden bize ulaşabilirsiniz. Formu da doldurabilirsiniz.
            </p>
          </div>

          {/* Öncelik: WhatsApp ve Instagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <Phone className="h-5 w-5" /> WhatsApp ile Hızlı İletişim
                </CardTitle>
                <CardDescription>Anında destek için WhatsApp&apos;tan yazın</CardDescription>
              </CardHeader>
              <CardContent>
                <MicroFeedback
                  hapticType="success"
                  hapticMessage="WhatsApp açılıyor"
                  className="w-full"
                >
                  <a
                    href="https://wa.me/905551234567?text=Merhaba, Meri Design House hakkında bilgi almak istiyorum."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    WhatsApp&apos;tan Mesaj Gönder
                  </a>
                </MicroFeedback>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-pink-600">Instagram DM</CardTitle>
                <CardDescription>Yeni koleksiyon ve tasarımlar için DM&apos;den ulaşın</CardDescription>
              </CardHeader>
              <CardContent>
                <MicroFeedback
                  hapticType="success"
                  hapticMessage="Instagram açılıyor"
                  className="w-full"
                >
                  <a
                    href="https://instagram.com/meridesignhouse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Instagram&apos;dan Mesaj Gönder
                  </a>
                </MicroFeedback>
              </CardContent>
            </Card>
          </div>

          {/* Form (yakın mesafe) */}
          <Card>
            <CardHeader>
              <CardTitle>Bize Mesaj Gönderin</CardTitle>
              <CardDescription>Aşağıdaki formu doldurarak bize ulaşabilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  )
}
