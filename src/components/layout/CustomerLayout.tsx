"use client"
import dynamic from 'next/dynamic'
import { Footer } from './Footer'
const Navbar = dynamic(() => import('./Navbar').then(m => ({ default: m.Navbar })), { ssr: false })
const BottomTabBar = dynamic(() => import('./BottomTabBar').then(m => ({ default: m.BottomTabBar })), { ssr: false })

interface CustomerLayoutProps {
  children: React.ReactNode
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div className="min-h-screen-dyn overscroll-contain flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16 supports-[padding:max(0px)]:pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomTabBar />
      <Footer />
    </div>
  )
}