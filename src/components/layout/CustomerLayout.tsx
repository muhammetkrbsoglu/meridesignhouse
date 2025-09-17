"use client"
import dynamic from 'next/dynamic'
import { Footer } from './Footer'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { ToastProvider } from '@/contexts/ToastContext'
import { useGestureHint } from '@/contexts/GestureHintContext'
import { useReducedMotion } from 'framer-motion'

const Navbar = dynamic(() => import('./Navbar').then(m => ({ default: m.Navbar })), { ssr: false })
const BottomTabBar = dynamic(() => import('./BottomTabBar').then(m => ({ default: m.BottomTabBar })), { ssr: false })

interface CustomerLayoutProps {
  children: React.ReactNode
  showMobileNav?: boolean
  showPullToRefresh?: boolean
  enableHaptic?: boolean
}

export function CustomerLayout({ 
  children, 
  showMobileNav = true, 
  showPullToRefresh = false,
  enableHaptic = true 
}: CustomerLayoutProps) {
  const { resetHints, showHints } = useGestureHint()
  const shouldReduceMotion = useReducedMotion()
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pb-16 supports-[padding:max(0px)]:pb-[calc(64px+env(safe-area-inset-bottom))]">
          {children}
        </main>
        {showMobileNav && <BottomTabBar />}
        {/* Mobile-only minimal controls for gesture hints */}
        <div className="md:hidden fixed bottom-[88px] right-4 z-40 flex flex-col gap-2">
          <button
            onClick={() => resetHints()}
            aria-label="İpuçlarını sıfırla"
            className="px-3 py-2 rounded-full bg-white/90 backdrop-blur-md border text-xs shadow-lg motion-safe:transition-all motion-safe:duration-200 active:scale-[0.98]"
          >
            İpuçlarını sıfırla
          </button>
          <button
            onClick={() => showHints()}
            aria-label="İpuçlarını göster"
            className="px-3 py-2 rounded-full bg-white/90 backdrop-blur-md border text-xs shadow-lg motion-safe:transition-all motion-safe:duration-200 active:scale-[0.98]"
          >
            İpuçlarını göster
          </button>
        </div>
        <Footer />
        <ToastContainer />
      </div>
    </ToastProvider>
  )
}