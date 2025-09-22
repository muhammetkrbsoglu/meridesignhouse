'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Users, 
  ShoppingCart, 
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  Palette,
  Link2,
  Layers,
  Tags
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Renk Yöneticisi',
    href: '/admin/settings/colors',
    icon: Palette,
  },
  {
    name: 'Ürünler',
    href: '/admin/products',
    icon: Package,
  },
  {
    name: 'Kategoriler',
    href: '/admin/categories',
    icon: FolderTree,
  },
  {
    name: 'Etiket Şablonları',
    href: '/admin/label-templates',
    icon: Tags,
  },
  {
    name: 'Etkinlik Türleri',
    href: '/admin/events',
    icon: Calendar,
  },
  {
    name: 'Tema Stilleri',
    href: '/admin/themes',
    icon: Palette,
  },
  {
    name: 'Etkinlik-Tema Atamaları',
    href: '/admin/event-themes',
    icon: Link2,
  },
  {
    name: 'Set Atayıcı',
    href: '/admin/bundles',
    icon: Layers,
  },
  {
    name: 'Kullanıcılar',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Siparişler',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    name: 'Mesajlar',
    href: '/admin/messages',
    icon: MessageSquare,
  },
  {
    name: 'Ayarlar',
    href: '/admin/settings',
    icon: Settings,
    hidden: true,
  },
  {
    name: 'Memnun Müşteriler',
    href: '/admin/settings/whatsapp-messages',
    icon: MessageSquare,
  },
  {
    name: 'Mesaj Åablonları',
    href: '/admin/settings/whatsapp-templates',
    icon: MessageSquare,
  },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { userProfile, signOut } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.filter(i => !(i as any).hidden).map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {userProfile?.name?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {userProfile?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">{userProfile?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.filter(i => !(i as any).hidden).map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {userProfile?.name?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {userProfile?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">{userProfile?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Meri Design House - Admin
              </h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
