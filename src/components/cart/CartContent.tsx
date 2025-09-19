'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCartIcon, TrashIcon, PlusIcon, MinusIcon, HeartIcon } from '@heroicons/react/24/outline'
import { getCartItems, removeFromCart, updateCartItemQuantity, clearCart, addToCart, getCartBundles, updateCartBundleQuantity, removeCartBundle, addToFavorites } from '@/lib/api/cartClient'
import type { CartItem, CartBundleLine } from '@/types/cart'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { CartSkeleton } from './CartSkeleton'
import { SwipeActions } from '@/components/motion/SwipeActions'
import { CartCTABar } from '@/components/motion/StickyCTA'
import { useMicroAnimations } from '@/hooks/useMicroAnimations'
import { MicroFeedback } from '@/components/motion/MicroFeedback'
import { LoadingSpinner } from '@/components/motion/LoadingStates'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/motion/Modal'

const BLUR_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

export function CartContent() {
  const router = useRouter()
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({})
  const [bundleLines, setBundleLines] = useState<CartBundleLine[]>([])
  const [updatingBundles, setUpdatingBundles] = useState<Set<string>>(new Set())
  const [draftBundleQuantities, setDraftBundleQuantities] = useState<Record<string, string>>({})
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())
  
  const { createButtonAnimation, createCardAnimation } = useMicroAnimations()

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
    } catch (error) {
      console.error('Sepet yüklenirken hata:', error)
      toast({ intent: 'error', description: 'Sepet yüklenirken hata oluştu' })
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleRemoveItem = async (cartItemId: string) => {
    setRemovingItems(prev => new Set(prev).add(cartItemId))
    
    try {
      const removed = cartItems.find(ci => ci.id === cartItemId)
      const result = await removeFromCart(cartItemId)
      
      if (result.success) {
        setCartItems(prev => prev.filter(item => item.id !== cartItemId))
        toast({
          intent: 'success',
          description: 'Ürün sepetten çıkarıldı',
          action: (
            <ToastAction altText="Geri Al" onClick={async () => {
              if (removed) {
                await addToCart(removed.productId, removed.quantity)
                await loadCartItems()
                toast({ intent: 'success', description: 'Ürün geri alındı' })
              }
            }}>Geri Al</ToastAction>
          )
        })
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' })
      }
    } catch (error) {
      toast({ intent: 'error', description: 'Bir hata oluştu' })
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(cartItemId)
        return newSet
      })
    }
  }

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setUpdatingItems(prev => new Set(prev).add(productId))
    
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
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' })
      }
    } catch (error) {
      toast({ intent: 'error', description: 'Bir hata oluştu' })
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
    try {
      const result = await clearCart()
      
      if (result.success) {
        setCartItems([])
        setBundleLines([])
        toast({ intent: 'success', description: 'Sepet temizlendi' })
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' })
      }
    } catch (error) {
      toast({ intent: 'error', description: 'Bir hata oluştu' })
    }
  }

  const openConfirmClear = () => setConfirmClearOpen(true)
  const closeConfirmClear = () => setConfirmClearOpen(false)

  const handleCheckout = () => {
    if (cartItems.length === 0 && bundleLines.length === 0) {
      toast({ intent: 'info', description: 'Sepetiniz boş' })
      return
    }
    router.push('/checkout')
  }

  const handleAddToFavorites = async (productId: string, productName: string) => {
    try {
      const result = await addToFavorites(productId)
      if (result.success) {
        toast({ intent: 'success', description: `${productName} favorilere eklendi` })
      } else {
        toast({ intent: 'error', description: result.error || 'Bir hata oluştu' })
      }
    } catch (error) {
      toast({ intent: 'error', description: 'Bir hata oluştu' })
    }
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
      <Card>
        <CardContent className="text-center py-12">
          <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sepetiniz boş</h3>
          <p className="text-gray-600 mb-6">Alışverişe başlamak için ürünleri sepete ekleyin</p>
          <Link href="/products">
            <Button>
              Alışverişe Başla
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
              Sepetinizdeki Ürünler ({totalItems} ürün)
            </h2>
            {(cartItems.length > 0 || bundleLines.length > 0) && (
              <motion.div
                {...createButtonAnimation({
                  hapticMessage: 'Sepet temizlendi'
                })}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openConfirmClear}
                  className="self-start text-red-600 hover:text-red-700 hover:bg-red-50 sm:self-auto"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Sepeti Temizle
                </Button>
              </motion.div>
            )}
          </div>

        <div className="space-y-4">
          {/* Bundle Lines */}
          {bundleLines.map((b) => {
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
              <Card key={b.id} className="overflow-hidden border border-rose-200/70 shadow-sm">
                <CardContent className={`p-4 sm:p-6 ${isUpdating ? 'opacity-80' : ''}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
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
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:gap-3">
                        {(b.items || []).slice(0,4).map((it) => (
                          <div key={it.id} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                            <div className="h-14 w-14 rounded-md bg-gray-100 overflow-hidden sm:h-16 sm:w-16">
                              {it.product?.product_images?.[0]?.url && (
                                <Image src={it.product.product_images[0].url} alt={it.product?.name || ''} width={64} height={64} className="w-full h-full object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-sm font-medium text-gray-800 line-clamp-2 max-w-[180px]">{it.product?.name || 'Ürün'}</span>
                              <span className="text-xs text-gray-500">x{it.quantity}</span>
                            </div>
                          </div>
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

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                      <Button variant="outline" size="sm" onClick={() => changeQty(b.quantity - 1)} disabled={isUpdating || b.quantity <= 1} type="button">
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                      <input
                        id={`bqty-${b.id}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center text-base font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-60 sm:w-14 sm:py-1 sm:text-sm"
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
                      <Button variant="outline" size="sm" onClick={() => changeQty(b.quantity + 1)} disabled={isUpdating} type="button">
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                      {isUpdating && (
                        <span className="ml-1 inline-flex h-4 w-4 items-center justify-center">
                          <span className="block h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" aria-label="Yükleniyor" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 text-sm text-gray-600 sm:text-right">
                      <div className="text-sm text-gray-500">Toplam liste: <span className="line-through">{formatCurrency(totalListPrice)}</span></div>
                      <div className="text-sm font-semibold text-gray-900">Toplam set fiyatı: {formatCurrency(totalSetPrice)}</div>
                      {totalSavings > 0 && (
                        <div className="text-sm text-green-600">Toplam kazanç: {formatCurrency(totalSavings)}</div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeBundle} disabled={isUpdating} className="self-start text-red-600 hover:text-red-700 hover:bg-red-50 sm:self-auto">
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Product Lines */}
          {cartItems.map((item, index) => {
            const isUpdating = updatingItems.has(item.productId) || updatingItems.has(item.id)
            return (
            <SwipeActions
              key={item.id}
              leftActions={[
                {
                  id: 'remove',
                  label: 'Kaldır',
                  icon: removingItems.has(item.id) ? <LoadingSpinner size="sm" color="white" /> : <TrashIcon className="w-4 h-4" />,
                  color: 'red',
                  action: () => handleRemoveItem(item.id),
                  disabled: removingItems.has(item.id)
                }
              ]}
              rightActions={[
                {
                  id: 'favorite',
                  label: 'Favori',
                  icon: <HeartIcon className="w-4 h-4" />,
                  color: 'pink',
                  action: () => handleAddToFavorites(item.productId, item.product.name)
                }
              ]}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border border-rose-200/70 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className={`p-4 sm:p-6 ${isUpdating ? 'opacity-80' : ''}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                      {item.product.product_images && item.product.product_images.length > 0 ? (
                        <Image
                          src={item.product.product_images[0].url}
                          alt={item.product.product_images[0].alt || item.product.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                          placeholder="blur" blurDataURL={BLUR_DATA_URL}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-2xl">🛍️</span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="block transition-opacity hover:opacity-80"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 transition-colors hover:text-blue-600 sm:text-lg">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500 sm:text-sm">
                      {item.product.category?.name}
                    </p>
                    <p className="text-base font-semibold text-rose-600 sm:text-lg">
                      {formatCurrency(item.product.price)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col gap-4 sm:min-w-[210px] sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-white/80 px-4 py-3 shadow-md sm:justify-start sm:gap-2 sm:border-transparent sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 sm:h-9 sm:w-9"
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        disabled={updatingItems.has(item.productId) || item.quantity <= 1}
                        type="button"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </Button>

                      <input
                        id={`qty-${item.productId}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-20 rounded-md border border-rose-300 py-2 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/40 sm:w-14 sm:text-sm sm:py-1.5"
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

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 sm:h-9 sm:w-9"
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        disabled={updatingItems.has(item.productId)}
                        type="button"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </Button>

                      {isUpdating && (
                        <span className="inline-flex h-4 w-4 items-center justify-center sm:ml-1">
                          <span className="block h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" aria-label="Yükleniyor" />
                        </span>
                      )}
                    </div>

                    {/* Remove Button */}
                    <MicroFeedback
                      hapticType="warning"
                      hapticMessage="Ürün kaldırılıyor"
                      disabled={removingItems.has(item.id)}
                      onClick={() => handleRemoveItem(item.id)}
                      className="flex"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removingItems.has(item.id)}
                        className="self-start text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg border border-red-200 sm:self-auto sm:px-2 sm:py-1 sm:border-0"
                      >
                        {removingItems.has(item.id) ? (
                          <LoadingSpinner size="sm" color="gray" />
                        ) : (
                          <>
                            <TrashIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                            <span className="ml-2 text-sm font-medium sm:hidden">Kaldır</span>
                          </>
                        )}
                      </Button>
                    </MicroFeedback>
                  </div>
                </div>
              </CardContent>
            </Card>
              </motion.div>
            </SwipeActions>
          )})}
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-8">
          <CardHeader>
            <CardTitle>Sipariş Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Ara Toplam</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Kargo</span>
              <span className="text-green-600">
                {shipping === 0 ? 'Ücretsiz' : formatCurrency(shipping)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Toplam</span>
              <span>{formatCurrency(total)}</span>
            </div>
            
            <motion.div
              {...createButtonAnimation({
                hapticMessage: 'Sipariş sayfasına yönlendiriliyor'
              })}
            >
              <Button 
                className="w-full mt-6"
                size="lg"
                onClick={handleCheckout}
              >
                Siparişi Tamamla
              </Button>
            </motion.div>
            
            <Link href="/products" className="block">
              <motion.div
                {...createButtonAnimation({
                  hapticMessage: 'Ürünler sayfasına yönlendiriliyor'
                })}
              >
                <Button variant="outline" className="w-full">
                  Alışverişe Devam Et
                </Button>
              </motion.div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Mobile Sticky CTA */}
    <CartCTABar
      total={formatCurrency(total)}
      itemCount={totalItems}
      onCheckout={handleCheckout}
    />

    {/* Confirm Clear Modal */}
    <Modal isOpen={confirmClearOpen} onClose={closeConfirmClear} title="Sepeti Temizle">
      <p className="text-sm text-gray-700 mb-4">Sepetinizdeki tüm ürünler kaldırılacak. Devam etmek istiyor musunuz?</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={closeConfirmClear}>Vazgeç</Button>
        <Button className="bg-red-600 text-white hover:bg-red-700" onClick={async () => { await handleClearCart(); closeConfirmClear(); }}>Temizle</Button>
      </div>
    </Modal>
    </>
  )
}







