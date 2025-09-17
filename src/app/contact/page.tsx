import { Metadata } from 'next'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
import { ContactPageClient } from '@/components/contact/ContactPageClient'
import { CustomerLayout } from '@/components/layout/CustomerLayout'

export const metadata: Metadata = {
  title: 'İletişim | Meri Design House',
  description: 'Bizimle iletişime geçin. Sorularınız için bize ulaşın.',
}

export default function ContactPage() {
  return (
    <CustomerLayout>
      <ContactPageClient />
    </CustomerLayout>
  )
}