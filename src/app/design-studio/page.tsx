import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { DesignStudioClient } from '@/components/design-studio/DesignStudioClient'
import { fetchEventTypes, fetchThemeStyles } from '@/lib/actions/events'
import { fetchCategories } from '@/lib/actions/products'
import { fetchProducts } from '@/lib/actions/products'
import type { Metadata } from 'next'

export default async function DesignStudioPage() {
  const [eventTypes, themeStyles, categories, products] = await Promise.all([
    fetchEventTypes(),
    fetchThemeStyles(),
    fetchCategories(),
    fetchProducts()
  ])

  return (
    <CustomerLayout>
      <DesignStudioClient
        eventTypes={eventTypes}
        themeStyles={themeStyles}
        categories={categories}
        products={products}
      />
    </CustomerLayout>
  )
}

export const metadata: Metadata = {
  title: 'Tasarım Atölyesi | Meri Design House',
  description: 'Kendi setinizi oluşturun! Etkinlik türü, tema stili ve ürünlerinizi seçerek özel setler tasarlayın.',
  keywords: 'tasarım atölyesi, set oluştur, özel tasarım, etkinlik seti, tema stili',
  openGraph: {
    title: 'Tasarım Atölyesi | Meri Design House',
    description: 'Kendi setinizi oluşturun! Etkinlik türü, tema stili ve ürünlerinizi seçerek özel setler tasarlayın.',
    type: 'website',
  },
}