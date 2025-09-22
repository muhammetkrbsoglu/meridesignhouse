'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUserProfile, getUserOrders, getUserMessages, getOrderStats, updateUserProfile, UserProfile, listUserAddresses, createUserAddress, deleteUserAddress, setDefaultAddress, UserAddress } from '@/lib/actions/profile'
import { backfillMessageUserIds } from '@/lib/actions/messages'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { WhatsAppButton } from '@/components/profile/WhatsAppButton'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { MapPin, Package, MessageSquare, Edit3, Save, X, Plus, AlertCircle, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Address {
  id?: string
  label: string
  full_name: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default_shipping: boolean
  is_default_billing: boolean
}

interface ProfileContentProps {
  userId: string
}

export default function ProfileContent({ userId }: ProfileContentProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { signOut } = useAuth()

  // Addresses state
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showSavedAddresses, setShowSavedAddresses] = useState(false)
  const [addressForm, setAddressForm] = useState<Partial<UserAddress>>({
    label: 'Ev',
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Türkiye',
    is_default_shipping: true, // Varsayılan olarak teslimat adresi
    is_default_billing: true, // Varsayılan olarak fatura adresi
  })
  const [addressSubmitting, setAddressSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Turkey',
    birth_date: '',
    gender: '',
    newsletter_subscription: false
  })

  useEffect(() => {
    loadProfileData()
  }, [userId])

  useEffect(() => {
    const channel = supabase
      .channel('messages-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `userId=eq.${userId}` }, () => {
        getUserMessages(userId).then(setMessages).catch(() => {})
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [userId])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const [profileData, ordersData, messagesData, statsData, addr] = await Promise.all([
        getUserProfile(userId),
        getUserOrders(userId),
        getUserMessages(userId),
        getOrderStats(userId),
        listUserAddresses(userId)
      ])

      setProfile(profileData)
      setOrders(ordersData)
      setMessages(messagesData)
      setStats(statsData)
      setAddresses(addr || [])

      if (profileData) {
        setFormData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          zip_code: profileData.zip_code || '',
          country: profileData.country || 'Turkey',
          birth_date: profileData.birth_date || '',
          gender: profileData.gender || '',
          newsletter_subscription: profileData.newsletter_subscription || false
        })

        setAddressForm(prev => ({
          ...prev,
          full_name: profileData.name || '',
          phone: profileData.phone || ''
        }))
      }
    } catch (error) {
      console.error('Profile data yükleme hatası:', error)
      toast({
        title: 'Hata',
        description: 'Profil bilgileri yüklenirken bir hata oluştu',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const result = await updateUserProfile(userId, formData)
      
      if (result.success) {
        toast({
          title: 'Başarılı',
          description: 'Profil bilgileriniz güncellendi'
        })
        setEditing(false)
        loadProfileData()
      } else {
        toast({
          title: 'Hata',
          description: result.error || 'Profil güncellenirken bir hata oluştu',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Profile güncelleme hatası:', error)
      toast({
        title: 'Hata',
        description: 'Profil güncellenirken bir hata oluştu',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        country: profile.country || 'Turkey',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
        newsletter_subscription: profile.newsletter_subscription || false
      })
    }
    setEditing(false)
    setEditingAddress(false)
  }

  const _handleAddressCancel = () => {
    if (profile) {
      setFormData({
        ...formData,
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        country: profile.country || 'Turkey'
      })
    }
    setEditingAddress(false)
  }

  const handleAddAddress = async () => {
    setAddressSubmitting(true)
    try {
      const payload: any = { ...addressForm }
      const r = await createUserAddress(userId, payload)
      if (r.success) {
        toast({ title: 'Adres eklendi' })
        setAddressForm({
          label: 'Ev', 
          full_name: profile?.name || '', 
          phone: profile?.phone || '', 
          address: '', 
          city: '', 
          state: '', 
          postal_code: '', 
          country: 'Türkiye', 
          is_default_shipping: true, 
          is_default_billing: true
        })
        setShowAddressForm(false)
        loadProfileData()
      } else {
        toast({ title: 'Hata', description: r.error, variant: 'destructive' })
      }
    } catch (_error) {
      toast({ title: 'Hata', description: 'Adres eklenirken hata oluştu', variant: 'destructive' })
    } finally {
      setAddressSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (_e) {
      toast({
        title: 'Hata',
        description: 'Çıkış yapılırken bir hata oluştu',
        variant: 'destructive'
      })
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PROCESSING': return 'bg-purple-100 text-purple-800'
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Beklemede'
      case 'CONFIRMED': return 'Onaylandı'
      case 'PROCESSING': return 'İşleniyor'
      case 'SHIPPED': return 'Kargoya Verildi'
      case 'DELIVERED': return 'Teslim Edildi'
      case 'CANCELLED': return 'İptal Edildi'
      case 'REFUNDED': return 'İade Edildi'
      default: return status
    }
  }

  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case 'UNREAD': return 'bg-red-100 text-red-800'
      case 'READ': return 'bg-blue-100 text-blue-800'
      case 'REPLIED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Information Card */}
      <Card className="lg:col-span-2 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-800">Hesap Bilgileri</CardTitle>
          <CardDescription className="text-gray-500">Kişisel bilgilerinizi güncelleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-6">
            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Doğum Tarihi</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="gender">Cinsiyet</Label>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  disabled={!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cinsiyet Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="newsletter_subscription" className="flex items-center space-x-2">
                <Switch
                  id="newsletter_subscription"
                  checked={formData.newsletter_subscription}
                  onCheckedChange={(checked) => setFormData({ ...formData, newsletter_subscription: checked })}
                  disabled={!editing}
                />
                <span>E-posta bültenine abone ol</span>
              </Label>
            </div>

            <div className="flex justify-end space-x-2">
              {editing ? (
                <>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                    <X className="mr-2 h-4 w-4" /> İptal
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Kaydediliyor...' : <><Save className="mr-2 h-4 w-4" /> Kaydet</>}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setEditing(true)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Düzenle
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Addresses Card */}
      <Card className="lg:col-span-1 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-800">Adreslerim</CardTitle>
          <CardDescription className="text-gray-500">Kayıtlı adreslerinizi yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 && !showAddressForm && (
            <p className="text-gray-500 mb-4">Henüz kayıtlı adresiniz bulunmamaktadır.</p>
          )}

          {/* Address List */}
          {addresses.length > 0 && !showAddressForm && (
            <div className="space-y-4 mb-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">{addr.label}</h3>
                    <div className="flex space-x-2">
                      {addr.is_default_shipping && <Badge variant="secondary">Varsayılan Teslimat</Badge>}
                      {addr.is_default_billing && <Badge variant="secondary">Varsayılan Fatura</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{addr.full_name}</p>
                  <p className="text-sm text-gray-700">{addr.address}</p>
                  <p className="text-sm text-gray-700">{addr.postal_code} {addr.city}/{addr.state}</p>
                  <p className="text-sm text-gray-700">{addr.phone}</p>
                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => {
                      // Logic to edit address
                      toast({ title: 'Düzenleme özelliği yakında!' })
                    }}>
                      Düzenle
                    </Button>
                    <Button variant="destructive" size="sm" onClick={async () => {
                      if (confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
                        const r = await deleteUserAddress(userId, addr.id)
                        if (r.success) {
                          toast({ title: 'Adres silindi' })
                          loadProfileData()
                        } else {
                          toast({ title: 'Hata', description: r.error, variant: 'destructive' })
                        }
                      }
                    }}>
                      Sil
                    </Button>
                    {!addr.is_default_shipping && (
                      <Button variant="outline" size="sm" onClick={async () => {
                        const r = await setDefaultAddress(userId, addr.id, { shipping: true })
                        if (r.success) {
                          toast({ title: 'Varsayılan teslimat adresi ayarlandı' })
                          loadProfileData()
                        } else {
                          toast({ title: 'Hata', description: r.error, variant: 'destructive' })
                        }
                      }}>
                        Varsayılan Teslimat Yap
                      </Button>
                    )}
                    {!addr.is_default_billing && (
                      <Button variant="outline" size="sm" onClick={async () => {
                        const r = await setDefaultAddress(userId, addr.id, { billing: true })
                        if (r.success) {
                          toast({ title: 'Varsayılan fatura adresi ayarlandı' })
                          loadProfileData()
                        } else {
                          toast({ title: 'Hata', description: r.error, variant: 'destructive' })
                        }
                      }}>
                        Varsayılan Fatura Yap
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Address Button */}
          {!showAddressForm && (
            <Button onClick={() => setShowAddressForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Yeni Adres Ekle
            </Button>
          )}

          {/* Address Form */}
          <AnimatePresence>
            {showAddressForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-4 p-4 border rounded-lg bg-blue-50"
              >
                <h3 className="text-lg font-semibold mb-4">Yeni Adres Ekle</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address-label">Adres Etiketi</Label>
                    <Select
                      value={addressForm.label}
                      onValueChange={(value) => setAddressForm({ ...addressForm, label: value })}
                    >
                      <SelectTrigger id="address-label">
                        <SelectValue placeholder="Etiket Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ev">Ev</SelectItem>
                        <SelectItem value="İş">İş</SelectItem>
                        <SelectItem value="Diğer">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="address-full_name">Ad Soyad</Label>
                    <Input
                      id="address-full_name"
                      value={addressForm.full_name}
                      onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address-phone">Telefon</Label>
                    <Input
                      id="address-phone"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address-address">Adres</Label>
                    <Textarea
                      id="address-address"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="address-city">İl</Label>
                      <Input
                        id="address-city"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address-state">İlçe</Label>
                      <Input
                        id="address-state"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address-postal_code">Posta Kodu</Label>
                      <Input
                        id="address-postal_code"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address-country">Ülke</Label>
                    <Input
                      id="address-country"
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      disabled
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default_shipping"
                      checked={addressForm.is_default_shipping}
                      onCheckedChange={(checked) => setAddressForm({ ...addressForm, is_default_shipping: checked })}
                    />
                    <Label htmlFor="is_default_shipping">Varsayılan Teslimat Adresi Yap</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default_billing"
                      checked={addressForm.is_default_billing}
                      onCheckedChange={(checked) => setAddressForm({ ...addressForm, is_default_billing: checked })}
                    />
                    <Label htmlFor="is_default_billing">Varsayılan Fatura Adresi Yap</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddressForm(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleAddAddress} disabled={addressSubmitting}>
                      {addressSubmitting ? 'Ekleniyor...' : 'Adres Ekle'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Orders Card */}
      <Card className="lg:col-span-2 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-800">Siparişlerim</CardTitle>
          <CardDescription className="text-gray-500">Geçmiş siparişlerinizi görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-gray-500">Henüz siparişiniz bulunmamaktadır.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">Sipariş #{order.id.substring(0, 8)}</h3>
                    <Badge className={`${getOrderStatusColor(order.status)} px-3 py-1.5 min-w-fit`}>{getOrderStatusText(order.status)}</Badge>
                  </div>
                  <p className="text-sm text-gray-700">Tarih: {new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-700">Toplam: {formatCurrency(order.total_amount)}</p>
                  <Link href={`/orders/${order.id}`} className="text-sm text-purple-600 hover:underline mt-2 block">
                    Sipariş Detaylarını Görüntüle
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages Card */}
      <Card className="lg:col-span-1 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-800">Mesajlarım</CardTitle>
          <CardDescription className="text-gray-500">Müşteri hizmetleri mesajlarınızı görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-gray-500">Henüz mesajınız bulunmamaktadır.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">Konu: {message.subject}</h3>
                    <Badge className={getMessageStatusColor(message.status)}>{message.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-700">Tarih: {new Date(message.created_at).toLocaleDateString()}</p>
                  <Link href={`/profile/messages/${message.id}`} className="text-sm text-purple-600 hover:underline mt-2 block">
                    Mesajı Görüntüle
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logout Button */}
      <div className="lg:col-span-3 flex justify-center mt-8">
        <Button
          onClick={handleLogout}
          className="w-full max-w-md bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center"
        >
          <LogOut className="mr-2 h-5 w-5" /> Çıkış Yap
        </Button>
      </div>
    </div>
  )
}

