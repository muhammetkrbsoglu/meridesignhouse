import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProviderWrapper } from '@/components/providers/AuthProviderWrapper'
import { Toaster } from '@/components/ui/toaster'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const isStaging = process.env.NEXT_PUBLIC_ENV === 'staging' || process.env.VERCEL_ENV === 'preview'

export const metadata: Metadata = {
  title: 'Meri Design House - E-Ticaret',
  description: 'Meri Design House e-ticaret sitesi',
  metadataBase: new URL('https://meridesignhouse.com'),
  robots: isStaging
    ? { index: false, follow: true }
    : { index: true, follow: true },
  openGraph: {
    siteName: 'Meri Design House',
    images: [
      { url: '/placeholder-product.jpg', width: 1200, height: 630, alt: 'Meri Design House' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/placeholder-product.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProviderWrapper>
          {children}
          <Toaster />
        </AuthProviderWrapper>
      </body>
    </html>
  )
}

export function reportWebVitals(metric: any) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }

  try {
    const thresholds = {
      LCP: 2500,
      INP: 200,
      CLS: 0.1,
    } as const

    if (metric.name === 'LCP' && metric.value > thresholds.LCP) {
      console.warn('[WebVitals] LCP slow:', metric.value)
    }
    if (metric.name === 'INP' && metric.value > thresholds.INP) {
      console.warn('[WebVitals] INP slow:', metric.value)
    }
    if (metric.name === 'CLS' && metric.value > thresholds.CLS) {
      console.warn('[WebVitals] CLS high:', metric.value)
    }
  } catch {}
}
