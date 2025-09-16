'use client'

import { useState, useEffect } from 'react'
import { getUserProfile, getUserOrders, getUserMessages, getOrderStats, updateUserProfile, UserProfile, listUserAddresses, createUserAddress, updateUserAddress, deleteUserAddress, setDefaultAddress, linkMyMessagesByEmail } from '@/lib/actions/profile'
import { backfillMessageUserIds } from '@/lib/actions/messages'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { WhatsAppButton } from '@/components/profile/WhatsAppButton'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Calendar, MapPin, Phone, Mail, Package, MessageSquare, Edit3, Save, X, Plus, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'

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

  // Addresses state
  const [addresses, setAddresses] = useState<any[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showSavedAddresses, setShowSavedAddresses] = useState(false)
  const [addressForm, setAddressForm] = useState({
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

  const handleAddressCancel = () => {
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
          label: 'Ev', full_name: profile?.name || '', phone: profile?.phone || '', address: '', city: '', state: '', postal_code: '', country: 'Türkiye', is_default_shipping: true, is_default_billing: true
        })
        setShowAddressForm(false)
        loadProfileData()
      } else {
        toast({ title: 'Hata', description: r.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Adres eklenirken hata oluştu', variant: 'destructive' })
    } finally {
      setAddressSubmitting(false)
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

  const getMessageStatusText = (status: string) => {
    switch (status) {
      case 'UNREAD': return 'Okunmadı'
      case 'READ': return 'Okundu'
      case 'REPLIED': return 'Yanıtlandı'
      case 'CLOSED': return 'Kapatıldı'
      default: return status
    }
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  if (!profile) {
    return <div className="text-center py-8 text-red-600">Profil bilgileri yüklenemedi</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sol Kolon - Profil Bilgileri */}
      <div className="lg:col-span-2 space-y-6">
        {/* Kişisel Bilgiler */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-rose-600" />
                Kişisel Bilgiler
              </CardTitle>
              <CardDescription>
                Temel bilgilerinizi düzenleyin
              </CardDescription>
            </div>
            <Button
              variant={editing ? "outline" : "default"}
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2"
            >
              {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {editing ? 'İptal' : 'Düzenle'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editingAddress}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editingAddress}
                />
              </div>
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Doğum Tarihi</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  disabled={!editingAddress}
                />
              </div>
              <div>
                <Label htmlFor="gender">Cinsiyet</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  disabled={!editingAddress}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Erkek</SelectItem>
                    <SelectItem value="FEMALE">Kadın</SelectItem>
                    <SelectItem value="OTHER">Diğer</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">Belirtmek İstemiyorum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  İptal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adres Bilgileri - Modüler Tasarım */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-600" />
              Adres Bilgilerim
            </CardTitle>
            <CardDescription>
              Varsayılan teslimat ve fatura adreslerinizi yönetin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Varsayılan Adresler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Varsayılan Teslimat Adresi */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Varsayılan Teslimat Adresi</h4>
                  <Badge className="bg-rose-100 text-rose-700">Aktif</Badge>
                </div>
                {addresses.find(a => a.is_default_shipping) ? (
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <div className="font-medium text-sm">
                      {addresses.find(a => a.is_default_shipping)?.label || 'Ev'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                      {addresses.find(a => a.is_default_shipping)?.full_name} • {addresses.find(a => a.is_default_shipping)?.phone}
                      {'\n'}{addresses.find(a => a.is_default_shipping)?.address}
                      {'\n'}{addresses.find(a => a.is_default_shipping)?.city} {addresses.find(a => a.is_default_shipping)?.postal_code} {addresses.find(a => a.is_default_shipping)?.state}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed rounded-lg bg-rose-50/40">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                      <div className="text-sm text-rose-900">
                        <div className="font-medium">Adresin kayıtlı değil</div>
                        <div className="text-rose-700">Siparişi hızlı tamamlamak için teslimat adresini kaydet.</div>
                        <Button size="sm" className="mt-2" onClick={() => setShowAddressForm(true)}>
                          Yeni Adres Ekle
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Varsayılan Fatura Adresi */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Varsayılan Fatura Adresi</h4>
                  <Badge className="bg-purple-100 text-purple-700">Aktif</Badge>
                </div>
                {addresses.find(a => a.is_default_billing) ? (
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <div className="font-medium text-sm">
                      {addresses.find(a => a.is_default_billing)?.label || 'İş'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                      {addresses.find(a => a.is_default_billing)?.full_name} • {addresses.find(a => a.is_default_billing)?.phone}
                      {'\n'}{addresses.find(a => a.is_default_billing)?.address}
                      {'\n'}{addresses.find(a => a.is_default_billing)?.city} {addresses.find(a => a.is_default_billing)?.postal_code} {addresses.find(a => a.is_default_billing)?.state}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed rounded-lg bg-purple-50/40">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-purple-700 mt-0.5" />
                      <div className="text-sm text-purple-900">
                        <div className="font-medium">Fatura adresin kayıtlı değil</div>
                        <div className="text-purple-700">Fatura işlemleri için fatura adresini ekle.</div>
                        <Button size="sm" className="mt-2" onClick={() => setShowAddressForm(true)}>
                          Yeni Adres Ekle
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Yeni Adres Ekle
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Kayıtlı Adresler ({addresses.length})
              </Button>
            </div>

            {/* Yeni Adres Ekleme Formu */}
            {showAddressForm && (
              <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">Yeni Adres Ekle</h5>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddressForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Etiket (örn: Ev, İş)</Label>
                    <Input 
                      value={addressForm.label} 
                      onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}
                      placeholder="Ev"
                    />
                  </div>
                  <div>
                    <Label>Ad Soyad</Label>
                    <Input 
                      value={addressForm.full_name} 
                      onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input 
                      value={addressForm.phone} 
                      onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Adres</Label>
                  <Textarea 
                    value={addressForm.address} 
                    onChange={e => setAddressForm({ ...addressForm, address: e.target.value })}
                    placeholder="Mahalle, sokak, bina no, daire no..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label>Şehir</Label>
                    <Input 
                      value={addressForm.city} 
                      onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>İlçe</Label>
                    <Input 
                      value={addressForm.state} 
                      onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Posta Kodu</Label>
                    <Input 
                      value={addressForm.postal_code} 
                      onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Ülke</Label>
                    <Input 
                      value={addressForm.country} 
                      onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <input 
                      id="defShip" 
                      type="checkbox" 
                      checked={addressForm.is_default_shipping} 
                      onChange={e => setAddressForm({ ...addressForm, is_default_shipping: e.target.checked })} 
                    />
                    <Label htmlFor="defShip" className="text-sm">Varsayılan Teslimat Adresi</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      id="defBill" 
                      type="checkbox" 
                      checked={addressForm.is_default_billing} 
                      onChange={e => setAddressForm({ ...addressForm, is_default_billing: e.target.checked })} 
                    />
                    <Label htmlFor="defBill" className="text-sm">Varsayılan Fatura Adresi</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddAddress} disabled={addressSubmitting} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {addressSubmitting ? 'Ekleniyor...' : 'Adres Ekle'}
                  </Button>
                  <Button variant="outline" onClick={() => setAddressForm({
                    label: '',
                    full_name: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    country: 'Türkiye',
                    is_default_shipping: true,
                    is_default_billing: true
                  })}>
                    Temizle
                  </Button>
                </div>
              </div>
            )}

            {/* Kayıtlı Adresler Listesi */}
            {showSavedAddresses && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">Kayıtlı Adresler</h5>
                  <Button variant="ghost" size="sm" onClick={() => setShowSavedAddresses(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((a) => (
                      <div key={a.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-medium">
                              {a.label}
                              {a.is_default_shipping && <Badge className="bg-rose-100 text-rose-700 text-xs">Varsayılan Teslimat</Badge>}
                              {a.is_default_billing && <Badge className="bg-purple-100 text-purple-700 text-xs">Varsayılan Fatura</Badge>}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                              {a.full_name} • {a.phone}
                              {'\n'}{a.address}
                              {'\n'}{a.city} {a.postal_code || ''} {a.state || ''} {a.country}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-3">
                            {!a.is_default_shipping && (
                              <Button variant="outline" size="sm" className="text-xs" onClick={async () => {
                                const r = await setDefaultAddress(userId, a.id, { shipping: true })
                                if (r.success) { 
                                  toast({ title: 'Güncellendi', description: 'Varsayılan teslimat adresi ayarlandı' }); 
                                  loadProfileData() 
                                } else { 
                                  toast({ title: 'Hata', description: r.error, variant: 'destructive' }) 
                                }
                              }}>
                                Varsayılan Teslimat
                              </Button>
                            )}
                            {!a.is_default_billing && (
                              <Button variant="outline" size="sm" className="text-xs" onClick={async () => {
                                const r = await setDefaultAddress(userId, a.id, { billing: true })
                                if (r.success) { 
                                  toast({ title: 'Güncellendi', description: 'Varsayılan fatura adresi ayarlandı' }); 
                                  loadProfileData() 
                                } else { 
                                  toast({ title: 'Hata', description: r.error, variant: 'destructive' }) 
                                }
                              }}>
                                Varsayılan Fatura
                              </Button>
                            )}
                            <Button variant="destructive" size="sm" className="text-xs" onClick={async () => {
                              const r = await deleteUserAddress(userId, a.id)
                              if (r.success) { 
                                toast({ title: 'Silindi', description: 'Adres silindi' }); 
                                loadProfileData() 
                              } else { 
                                toast({ title: 'Hata', description: r.error, variant: 'destructive' }) 
                              }
                            }}>
                              Sil
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Kayıtlı adres bulunmuyor</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Tercihler */}
        <Card>
          <CardHeader>
            <CardTitle>Tercihler</CardTitle>
            <CardDescription>
              Bildirim ve iletişim tercihlerinizi ayarlayın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="newsletter">E-posta Bülteni</Label>
                <p className="text-sm text-gray-500">Yeni ürünler ve kampanyalar hakkında bilgi alın</p>
              </div>
              <Switch
                id="newsletter"
                checked={formData.newsletter_subscription}
                onCheckedChange={(checked) => setFormData({ ...formData, newsletter_subscription: checked })}
                disabled={!editingAddress}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sağ Kolon - İstatistikler ve Hızlı Erişim */}
      <div className="space-y-6">
        {/* İstatistikler */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Hesap İstatistikleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-rose-50 rounded-lg">
                  <div className="text-2xl font-bold text-rose-600">{stats.totalOrders}</div>
                  <div className="text-sm text-gray-600">Toplam Sipariş</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSpent)}</div>
                  <div className="text-sm text-gray-600">Toplam Harcama</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
                  <div className="text-sm text-gray-600">Bekleyen</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.completedOrders}</div>
                  <div className="text-sm text-gray-600">Tamamlanan</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Son Siparişler */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-600" />
              Son Siparişler
            </CardTitle>
            <Link href="/orders">
              <Button variant="outline" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">#{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <Badge className={getOrderStatusColor(order.status)}>
                        {getOrderStatusText(order.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.order_items?.length} ürün • {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Henüz siparişiniz yok</p>
                <Link href="/products">
                  <Button variant="outline" size="sm" className="mt-2">
                    Alışverişe Başla
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Son Mesajlar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-rose-600" />
              İletişim Talepleri
            </CardTitle>
            <div className="flex gap-2">
              <form action={backfillMessageUserIds}>
                <Button variant="outline" size="sm">Mesajlarımı Eşleştir</Button>
              </form>
              <Link href="/contact">
                <Button variant="outline" size="sm">
                  Yeni Talep
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {messages.length > 0 ? (
              <div className="space-y-3">
                {messages.slice(0, 3).map((message) => (
                  <div key={message.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-sm">{message.subject}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <Badge className={getMessageStatusColor(message.status)}>
                        {getMessageStatusText(message.status)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {message.message}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Link href={`/profile/messages/${message.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Detayları Gör
                        </Button>
                      </Link>
                      {message.phone && (
                        <WhatsAppButton
                          messageId={message.id}
                          message={message.message}
                          phone={message.phone}
                          size="sm"
                          className="text-xs"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Henüz mesajınız yok</p>
                <Link href="/contact">
                  <Button variant="outline" size="sm" className="mt-2">
                    İletişime Geç
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
