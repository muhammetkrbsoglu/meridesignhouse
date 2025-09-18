"use client"
import dynamic from 'next/dynamic'
import { Footer } from './Footer'
// import { ToastContainer } from '@/components/ui/ToastContainer'
// import { ToastProvider } from '@/contexts/ToastContext'
// import { useGestureHint } from '@/contexts/GestureHintContext'
import { useReducedMotion } from 'framer-motion'

const Navbar = dynamic(() => import('./Navbar').then(m => ({ default: m.Navbar })), { ssr: false })
const BottomTabBar = dynamic(() => import('./BottomTabBar').then(m => ({ default: m.BottomTabBar })), { ssr: false })

interface CustomerLayoutProps {
  children: React.ReactNode
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  // const { showGestureHint } = useGestureHint()
  const reducedMotion = useReducedMotion()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <BottomTabBar />
      <Footer />
      {/* {showGestureHint && (
        <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="rounded-full bg-blue-500 px-4 py-2 text-white shadow-lg"
          >
            Kaydırmak için dokunun
          </motion.div>
        </div>
      )} */}
      {/* <ToastContainer /> */}
    </div>
  )
}