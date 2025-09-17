'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCartIcon, TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import { getCartItems, removeFromCart, updateCartItemQuantity, clearCart, addToCart, getCartBundles, updateCartBundleQuantity, removeCartBundle } from '@/lib/actions/cart'
import { CartItem, CartBundleLine } from '@/lib/actions/cart'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { CartSkeleton } from './CartSkeleton'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback'
import { BlurUpImage, Skeleton } from '@/components/motion/LoadingStates'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

const BLUR_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

export function CartContent() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({})
  const [bundleLines, setBundleLines] = useState<CartBundleLine[]>([])
  const [updatingBundles, setUpdatingBundles] = useState<Set<string>>(new Set())
  const [draftBundleQuantities, setDraftBundleQuantities] = useState<Record<string, string>>({})
  const { success, light, medium, error } = useHapticFeedback()

  useEffect(() => {
    loadCartItems(false)
    const onUpdated = () => loadCartItems(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('cartUpdated', onUpdated)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cartUpdated', onUpdated)
      }
    }
  }, [])

  const loadCartItems = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true)
      const [items, bundles] = await Promise.all([getCartItems(), getCartBundles()])
      setCartItems(items)
      setBundleLines(bundles)
    } catch (error: unknown) {
      console.error('Sepet yüklenirken hata:', error)
      toast({ intent: 'error', description: 'Sepet yüklenirken hata oluştu' })
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleRemoveItem = async (cartItemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(cartItemId))
    light('Ürün kaldırılıyor')
    
    try {
      const removed = cartItems.find(ci => ci.id === cartItemId)
      const result = await removeFromCart(cartItemId)
      
      if (result.success) {
        setCartItems(prev => prev.filter(item => item.id !== cartItemId))
        success('Ürün sepetten çıkarıldı')
        toast({
          intent: 'success',
          description: 'Ürün sepetten çıkarıldı',
          action: (
            <ToastAction altText="Geri Al" onClick={async () => {
              if (removed) {
                await addToCart(removed.productId, removed.quantity)
                await loadCartItems()
                success('Ürün geri alındı')
                toast({ intent: 'success', description: 'Ürün geri alındı' })
              }
            }}>Geri Al</ToastAction>
          )
        })
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' })
        error('Ürün kaldırma hatası')
      }
    } catch (error: unknown) {
      console.error('Remove item error:', error)
      toast({ intent: 'error', description: 'Bir hata oluştu' })
      error('Ürün kaldırma hatası')
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(cartItemId)
        return newSet
      })
    }
  }

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setUpdatingItems(prev => new Set(prev).add(productId))
    light('Miktar güncelleniyor')
    
    try {
      const result = await updateCartItemQuantity(productId, newQuantity)
      
      if (result.success) {
        setCartItems(prev => 
          prev.map(item => 
            item.productId === productId 
              ? { ...item, quantity: newQuantity }
              : item
          )
        )
        setDraftQuantities(prev => ({ ...prev, [productId]: String(newQuantity) }))
        success('Miktar güncellendi')
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' })
        error('Miktar güncelleme hatası')
      }
    } catch (error: unknown) {
      console.error('Update quantity error:', error)
      toast({ intent: 'error', description: 'Bir hata oluştu' })
      error('Miktar güncelleme hatası')
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const commitQuantity = async (productId: string, currentQuantity: number) => {
    const raw = draftQuantities[productId]
    const parsed = parseInt(raw ?? '', 10)
    if (Number.isNaN(parsed)) {
      setDraftQuantities(prev => ({ ...prev, [productId]: String(currentQuantity) }))
      return
    }
    const clamped = Math.max(1, Math.min(999, parsed))
    if (clamped === currentQuantity) {
      setDraftQuantities(prev => ({ ...prev, [productId]: String(clamped) }))
      return
    }
    await handleUpdateQuantity(productId, clamped)
  }

  const handleClearCart = async () => {
    medium('Sepet temizleniyor')
    try {
      const result = await clearCart()
      
      if (result.success) {
        setCartItems([])
        setBundleLines([])
        success('Sepet temizlendi')
        toast({ intent: 'success', description: 'Sepet temizlendi' })
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' })
        error('Sepet temizleme hatası')
      }
    } catch (error: unknown) {
      console.error('Clear cart error:', error)
      toast({ intent: 'error', description: 'Bir hata oluştu' })
      error('Sepet temizleme hatası')
    }
  }

  const handleCheckout = () => {
    if (cartItems.length === 0 && bundleLines.length === 0) {
      toast({ intent: 'info', description: 'Sepetiniz boş' })
      return
    }
    medium('Checkout sayfasına yönlendiriliyor')
    router.push('/checkout')
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0) + bundleLines.reduce((s, b) => s + b.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) + bundleLines.reduce((s, b) => s + (b.price * b.quantity), 0)
  const shipping = subtotal > 0 ? 0 : 0 // Ücretsiz kargo
  const total = subtotal + shipping

  if (loading) {
    return <CartSkeleton />
  }

  if (cartItems.length === 0 && bundleLines.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="text-center py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            </motion.div>
            <motion.h3 
              className="text-lg font-medium text-gray-900 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              Sepetiniz boş
            </motion.h3>
            <motion.p 
              className="text-gray-600 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              Alışverişe başlamak için ürünleri sepete ekleyin
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <MicroFeedback
                onClick={() => {}}
                hapticType="medium"
                hapticMessage="Alışverişe başla"
              >
                <Link href="/products">
                  <Button>
                    Alışverişe Başla
                  </Button>
                </Link>
              </MicroFeedback>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.h2 
            className="text-xl font-semibold text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            Sepetinizdeki Ürünler ({totalItems} ürün)
          </motion.h2>
          {(cartItems.length > 0 || bundleLines.length > 0) && (
            <MicroFeedback
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              hapticType="medium"
              hapticMessage="Sepeti temizle"
            >
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Sepeti Temizle
              </Button>
            </MicroFeedback>
          )}
        </motion.div>

        <div className="space-y-4">
          {/* Bundle Lines */}
          <AnimatePresence>
            {bundleLines.map((b, index) => {
            const perSetListTotal = (b.items || []).reduce((s, it) => s + ((it.product?.price || 0) * it.quantity), 0)
            const perSetSavings = Math.max(0, perSetListTotal - b.price)
            const totalSetPrice = b.price * b.quantity
            const totalListPrice = perSetListTotal * b.quantity
            const totalSavings = perSetSavings * b.quantity
            const isUpdating = updatingBundles.has(b.id)

            const changeQty = async (nextQty: number) => {
              if (nextQty < 1) return
              setUpdatingBundles(prev => new Set(prev).add(b.id))
              // optimistic update
              const prevQty = b.quantity
              setBundleLines(prev => prev.map(x => x.id === b.id ? { ...x, quantity: nextQty } : x))
              const res = await updateCartBundleQuantity(b.id, nextQty)
              if (res.success) {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('cartUpdated'))
                }
              } else {
                // revert on error
                setBundleLines(prev => prev.map(x => x.id === b.id ? { ...x, quantity: prevQty } : x))
                toast({ intent: 'error', description: res.error || 'Bir hata oluştu' })
              }
              setUpdatingBundles(prev => { const n = new Set(prev); n.delete(b.id); return n })
            }

            const commitBundleQty = async () => {
              const raw = draftBundleQuantities[b.id]
              const parsed = parseInt((raw ?? '').trim(), 10)
              if (Number.isNaN(parsed)) {
                setDraftBundleQuantities(prev => ({ ...prev, [b.id]: String(b.quantity) }))
                return
              }
              const clamped = Math.max(1, Math.min(999, parsed))
              if (clamped === b.quantity) {
                setDraftBundleQuantities(prev => ({ ...prev, [b.id]: String(clamped) }))
                return
              }
              await changeQty(clamped)
            }

            const removeBundle = async () => {
              setUpdatingBundles(prev => new Set(prev).add(b.id))
              const res = await removeCartBundle(b.id)
              if (res.success) {
                setBundleLines(prev => prev.filter(x => x.id !== b.id))
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('cartUpdated'))
                }
                toast({ intent: 'success', description: 'Set kaldırıldı' })
              } else {
                toast({ intent: 'error', description: res.error || 'Bir hata oluştu' })
              }
              setUpdatingBundles(prev => { const n = new Set(prev); n.delete(b.id); return n })
            }

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                layout
              >
                <Card className="overflow-hidden border-rose-200">
                  <CardContent className={`p-6 ${isUpdating ? 'opacity-80' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-rose-50 text-rose-700 border border-rose-200">Set</Badge>
                        <span className="text-xs text-gray-500">{b.items.length} ürün</span>
                      </div>
                      <Link href={b.bundle ? `/bundles/${b.bundle.slug}` : '#'} className="block hover:opacity-80 mt-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {b.bundle?.name || 'Set'}
                        </h3>
                      </Link>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {(b.items || []).slice(0,4).map((it) => (
                          <motion.div 
                            key={it.id} 
                            className="flex items-center gap-3 border rounded-lg px-3 py-2"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden">
                              {it.product?.product_images?.[0]?.url && (
                                <BlurUpImage 
                                  src={it.product.product_images[0].url} 
                                  alt={it.product?.name || ''} 
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-sm font-medium text-gray-800 line-clamp-2 max-w-[180px]">{it.product?.name || 'Ürün'}</span>
                              <span className="text-xs text-gray-500">x{it.quantity}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm line-through text-gray-400">{formatCurrency(perSetListTotal)}</div>
                      <div className="text-lg font-semibold text-rose-600">{formatCurrency(b.price)}</div>
                      {perSetSavings > 0 && (
                        <div className="text-xs text-green-600">Set avantajı: {formatCurrency(perSetSavings)}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MicroFeedback
                        onClick={() => changeQty(b.quantity - 1)}
                        hapticType="light"
                        hapticMessage="Miktar azalt"
                      >
                        <Button variant="outline" size="sm" disabled={isUpdating || b.quantity <= 1} type="button">
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      </MicroFeedback>
                      <HoverCard
                        className="relative"
                        shimmer={isUpdating}
                        hapticType="light"
                        hapticMessage="Miktar girişi"
                      >
                        <input
                          id={`bqty-${b.id}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-14 text-center font-medium border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-60 transition-all duration-200"
                          value={draftBundleQuantities[b.id] ?? String(b.quantity)}
                          disabled={isUpdating}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
                            setDraftBundleQuantities(prev => ({ ...prev, [b.id]: val }))
                          }}
                          onBlur={commitBundleQty}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              ;(e.currentTarget as HTMLInputElement).blur()
                            } else if (e.key === 'Escape') {
                              setDraftBundleQuantities(prev => ({ ...prev, [b.id]: String(b.quantity) }))
                              ;(e.currentTarget as HTMLInputElement).blur()
                            }
                          }}
                        />
                      </HoverCard>
                      <MicroFeedback
                        onClick={() => changeQty(b.quantity + 1)}
                        hapticType="light"
                        hapticMessage="Miktar artır"
                      >
                        <Button variant="outline" size="sm" disabled={isUpdating} type="button">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </MicroFeedback>
                      {isUpdating && (
                        <motion.span 
                          className="ml-1 inline-flex h-4 w-4 items-center justify-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="block h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" aria-label="Yükleniyor" />
                        </motion.span>
                      )}
                    </div>
                    <div className="text-right sm:text-left flex-1">
                      <div className="text-sm text-gray-500">Toplam liste: <span className="line-through">{formatCurrency(totalListPrice)}</span></div>
                      <div className="text-sm font-semibold text-gray-900">Toplam set fiyatı: {formatCurrency(totalSetPrice)}</div>
                      {totalSavings > 0 && (
                        <div className="text-sm text-green-600">Toplam kazanç: {formatCurrency(totalSavings)}</div>
                      )}
                    </div>
                    <MicroFeedback
                      onClick={removeBundle}
                      hapticType="medium"
                      hapticMessage="Seti kaldır"
                    >
                      <Button variant="ghost" size="sm" disabled={isUpdating} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </MicroFeedback>
                  </div>
                </CardContent>
                </Card>
              </motion.div>
            )
          })}
          </AnimatePresence>

          {/* Product Lines */}
          <AnimatePresence>
            {cartItems.map((item, index) => {
            const isUpdating = updatingItems.has(item.productId) || updatingItems.has(item.id)
            return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              layout
            >
              <Card className="overflow-hidden">
              <CardContent className={`p-6 ${isUpdating ? 'opacity-80' : ''}`}>
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.product.product_images && item.product.product_images.length > 0 ? (
                        <BlurUpImage
                          src={item.product.product_images[0].url}
                          alt={item.product.product_images[0].alt || item.product.name}
                          className="w-full h-full object-cover"
                          width={80}
                          height={80}
                          sizes="80px"
                        />
                      ) : (
                        <span className="text-2xl">🛍️</span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/products/${item.product.slug}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <h3 className="text-lg font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500">
                      {item.product.category?.name}
                    </p>
                    <p className="text-lg font-semibold text-rose-600 mt-1">
                      {formatCurrency(item.product.price)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <MicroFeedback
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                      hapticType="light"
                      hapticMessage="Miktar azalt"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingItems.has(item.productId) || item.quantity <= 1}
                        type="button"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                    </MicroFeedback>
                    
                    <HoverCard
                      className="relative"
                      shimmer={isUpdating}
                      hapticType="light"
                      hapticMessage="Miktar girişi"
                    >
                      <input
                        id={`qty-${item.productId}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-14 text-center font-medium border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all duration-200"
                        value={draftQuantities[item.productId] ?? String(item.quantity)}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
                          setDraftQuantities(prev => ({ ...prev, [item.productId]: val }))
                        }}
                        onBlur={() => commitQuantity(item.productId, item.quantity)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.currentTarget as HTMLInputElement).blur()
                          } else if (e.key === 'Escape') {
                            setDraftQuantities(prev => ({ ...prev, [item.productId]: String(item.quantity) }))
                            ;(e.currentTarget as HTMLInputElement).blur()
                          }
                        }}
                      />
                    </HoverCard>
                    
                    <MicroFeedback
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                      hapticType="light"
                      hapticMessage="Miktar artır"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingItems.has(item.productId)}
                        type="button"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </MicroFeedback>
                    {isUpdating && (
                      <motion.span 
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="block h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" aria-label="Yükleniyor" />
                      </motion.span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <MicroFeedback
                    onClick={() => handleRemoveItem(item.id)}
                    hapticType="medium"
                    hapticMessage="Ürünü kaldır"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updatingItems.has(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </MicroFeedback>
                </div>
              </CardContent>
              </Card>
            </motion.div>
          );
          })}
          </AnimatePresence>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div 
                className="flex justify-between text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <span>Ara Toplam</span>
                <span>{formatCurrency(subtotal)}</span>
              </motion.div>
              <motion.div 
                className="flex justify-between text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <span>Kargo</span>
                <span className="text-green-600">
                  {shipping === 0 ? 'Ücretsiz' : formatCurrency(shipping)}
                </span>
              </motion.div>
              <Separator />
              <motion.div 
                className="flex justify-between text-lg font-semibold"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <span>Toplam</span>
                <motion.span 
                  key={total}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-rose-600"
                >
                  {formatCurrency(total)}
                </motion.span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <MicroFeedback
                  onClick={handleCheckout}
                  className="w-full mt-6"
                  hapticType="medium"
                  hapticMessage="Siparişi tamamla"
                >
                  <Button 
                    className="w-full"
                    size="lg"
                  >
                    Siparişi Tamamla
                  </Button>
                </MicroFeedback>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <MicroFeedback
                  onClick={() => {}}
                  className="block"
                  hapticType="light"
                  hapticMessage="Alışverişe devam et"
                >
                  <Link href="/products">
                    <Button variant="outline" className="w-full">
                      Alışverişe Devam Et
                    </Button>
                  </Link>
                </MicroFeedback>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
