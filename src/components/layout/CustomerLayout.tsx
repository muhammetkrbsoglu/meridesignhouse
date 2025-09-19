"use client"
import dynamic from 'next/dynamic'
import { Footer } from './Footer'
// import { ToastContainer } from '@/components/ui/ToastContainer'
// import { ToastProvider } from '@/contexts/ToastContext'

const Navbar = dynamic(() => import('./Navbar').then(m => ({ default: m.Navbar })), { ssr: false })
const BackToTopButtons = dynamic(() => import('./Navbar').then(m => ({ default: m.BackToTopButtons })), { ssr: false })
const BottomTabBar = dynamic(() => import('./BottomTabBar').then(m => ({ default: m.BottomTabBar })), { ssr: false })

interface CustomerLayoutProps {
  children: React.ReactNode
  showMobileNav?: boolean
}

export function CustomerLayout({ children, showMobileNav = true }: CustomerLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      {showMobileNav && <BottomTabBar />}
      <Footer />
      <BackToTopButtons />
      {/* <ToastContainer /> */}
    </div>
  )
}
