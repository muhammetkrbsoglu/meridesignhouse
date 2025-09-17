import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
// Dark mode temporarily disabled
import { AuthProviderWrapper } from '@/components/providers/AuthProviderWrapper'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { GestureHintProvider } from '@/contexts/GestureHintContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { Toaster } from '@/components/ui/toaster'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { WebsiteStructuredData } from '@/components/seo/WebsiteStructuredData'
import { OrganizationStructuredData } from '@/components/seo/OrganizationStructuredData'
import { WebVitals } from '@/components/analytics/WebVitals'
import PerformanceMonitorClient from '@/components/analytics/PerformanceMonitorClient'
// Theme toggle temporarily disabled

const geistSans = Geist({
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
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="light" storageKey="meri-design-theme-disabled">
          <GestureHintProvider storageKey="meri-design-gesture-hints">
            <ToastProvider>
              <AuthProviderWrapper>
                {children}
                {/* Live region for polite announcements (toasts/async) */}
                <div aria-live="polite" aria-atomic="true" className="sr-only" />
                <Toaster />
                <ToastContainer />
                <WebsiteStructuredData />
                <OrganizationStructuredData />
                <WebVitals />
                <PerformanceMonitorClient />
                {/* Theme toggle disabled */}
              </AuthProviderWrapper>
            </ToastProvider>
          </GestureHintProvider>
        </ThemeProvider>
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

  // Basit eşik uyarıları (console + optional custom event)
  try {
    const name = metric.name
    const val = metric.value
    const thresholds = {
      LCP: 2500, // ms
      INP: 200,  // ms
      CLS: 0.1,
    } as const

    if (name === 'LCP' && val > thresholds.LCP) {
      console.warn('[WebVitals] LCP slow:', val)
    }
    if (name === 'INP' && val > thresholds.INP) {
      console.warn('[WebVitals] INP slow:', val)
    }
    if (name === 'CLS' && val > thresholds.CLS) {
      console.warn('[WebVitals] CLS high:', val)
    }
  } catch {}
}
