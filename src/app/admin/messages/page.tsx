"use client";
import Link from 'next/link'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Mail, 
  MailOpen,
  Clock,
  User,
  Phone,
  Calendar
} from 'lucide-react'
import { fetchMessages, getUnreadMessagesCount, deleteMessage, updateMessageStatus } from '@/lib/actions/messages'
import { supabase } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'
import { getWhatsAppHref } from '@/lib/whatsapp-utils'
import { formatDate } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { Prisma } from '@prisma/client'
import { MessageStatus } from '@prisma/client'

// metadata client componentlerde kullanılamaz; kaldırıldı

// Helper function to get message type display name
const getMessageTypeDisplay = (type: string) => {
  switch (type) {
    case 'CONTACT':
      return 'İletişim'
    case 'SUPPORT':
      return 'Destek'
    case 'COMPLAINT':
      return 'Åikayet'
    case 'SUGGESTION':
      return 'Öneri'
    case 'ORDER_INQUIRY':
      return 'Sipariş Sorgusu'
    default:
      return 'Genel'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'UNREAD':
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <Mail className="w-3 h-3 mr-1" />
          Okunmadı
        </Badge>
      )
    case 'READ':
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <MailOpen className="w-3 h-3 mr-1" />
          Okundu
        </Badge>
      )
    case 'REPLIED':
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <MessageSquare className="w-3 h-3 mr-1" />
          Yanıtlandı
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-600">
          <Clock className="w-3 h-3 mr-1" />
          Bilinmiyor
        </Badge>
      )
  }
}







export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [totalMessages, setTotalMessages] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [searchId, setSearchId] = useState('')
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkSelect, setShowBulkSelect] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const messagesResult = await fetchMessages(page, limit)
        setMessages(messagesResult.messages)
        setTotalMessages(messagesResult.totalCount)
        const unreadCount = await getUnreadMessagesCount()
        setUnreadMessages(unreadCount)
      } catch (error) {
        console.error('CRITICAL ERROR - Messages Page Data Loading Failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          page: 'admin/messages',
          action: 'fetchMessages_and_getUnreadMessagesCount',
          pageNumber: page,
          limit: limit
        })
        
        // Fallback to prevent page crash
        setMessages([])
        setTotalMessages(0)
        setUnreadMessages(0)
      }
    }
    load()
    const channel = supabase
      .channel('messages-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        load()
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [page, limit])

  // Filter messages by phone number
  const filteredMessages = searchId 
    ? messages.filter(msg => 
        msg.phone?.toLowerCase().includes(searchId.toLowerCase()) ||
        msg.phone?.replace(/\D/g, '').includes(searchId.replace(/\D/g, ''))
      )
    : messages

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedMessages(filteredMessages.map(msg => msg.id))
    } else {
      setSelectedMessages([])
    }
  }

  // Handle individual message selection
  const handleMessageSelect = (messageId: string, checked: boolean) => {
    if (checked) {
      setSelectedMessages(prev => [...prev, messageId])
    } else {
      setSelectedMessages(prev => prev.filter(id => id !== messageId))
    }
  }

  // Single delete function
  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
      try {
        const result = await deleteMessage(messageId)
        if (result.success) {
          // Reload messages
          const messagesResult = await fetchMessages(page, limit)
          setMessages(messagesResult.messages)
          setTotalMessages(messagesResult.totalCount)
          // Remove from selected if it was selected
          setSelectedMessages(prev => prev.filter(id => id !== messageId))
        } else {
          alert(result.message || 'Mesaj silinirken hata oluştu')
        }
      } catch (error) {
        console.error('Delete message error:', error)
        alert('Mesaj silinirken hata oluştu')
      }
    }
  }

  // Bulk delete function
  const handleBulkDelete = async () => {
    if (selectedMessages.length === 0) return
    
    if (confirm(`${selectedMessages.length} mesajı silmek istediğinizden emin misiniz?`)) {
      try {
        // Delete each message individually
        for (const messageId of selectedMessages) {
          await deleteMessage(messageId)
        }
        
        setSelectedMessages([])
        setSelectAll(false)
        
        // Reload messages
        const messagesResult = await fetchMessages(page, limit)
        setMessages(messagesResult.messages)
        setTotalMessages(messagesResult.totalCount)
      } catch (error) {
        console.error('Bulk delete error:', error)
        alert('Mesajlar silinirken hata oluştu')
      }
    }
  }

  // Bulk mark as read function
  const handleBulkMarkAsRead = async () => {
    if (selectedMessages.length === 0) return
    
    try {
      // Update each message status to READ
      for (const messageId of selectedMessages) {
        await updateMessageStatus(messageId, 'READ')
      }
      
      setSelectedMessages([])
      setSelectAll(false)
      
      // Reload messages
      const messagesResult = await fetchMessages(page, limit)
      setMessages(messagesResult.messages)
      setTotalMessages(messagesResult.totalCount)
      
      // Update unread count
      const unreadCount = await getUnreadMessagesCount()
      setUnreadMessages(unreadCount)
      
      alert(`${selectedMessages.length} mesaj okundu olarak işaretlendi`)
    } catch (error) {
      console.error('Bulk mark as read error:', error)
      alert('Mesajlar işaretlenirken hata oluştu')
    }
  }
  const readMessages = totalMessages - unreadMessages
  type AdminMessage = Prisma.MessageGetPayload<{
    include: {
      user: {
        select: {
          id: true
          name: true
          email: true
        }
      }
      order: {
        select: {
          id: true
          orderNumber: true
        }
      }
    }
  }>

  const repliedMessages = messages.filter((msg: AdminMessage) => msg.status === MessageStatus.REPLIED).length

  const stats = [
    {
      name: 'Toplam Mesaj',
      value: totalMessages.toString(),
      icon: MessageSquare,
      color: 'text-blue-600'
    },
    {
      name: 'Okunmamış',
      value: unreadMessages.toString(),
      icon: Mail,
      color: 'text-red-600'
    },
    {
      name: 'Okunmuş',
      value: readMessages.toString(),
      icon: MailOpen,
      color: 'text-blue-600'
    },
    {
      name: 'Yanıtlanmış',
      value: repliedMessages.toString(),
      icon: MessageSquare,
      color: 'text-green-600'
    }
  ]

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mesajlar</h1>
            <p className="mt-1 text-sm text-gray-500">
              Müşteri mesajlarını görüntüleyin ve yanıtlayın
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.name}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Icon className={`h-8 w-8 ${stat.color}`} />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">
                            {stat.name}
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Unread Messages Alert */}
          {unreadMessages > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {unreadMessages} adet okunmamış mesaj var!
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Bu mesajları incelemeniz önerilir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tüm Mesajlar</CardTitle>
              <CardDescription>
                Müşterilerden gelen mesajların listesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Telefon Numarası Ara:</Label>
                    <Input
                      type="text"
                      placeholder="Telefon numarası girin... (örn: 0555 123 45 67)"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  {showBulkSelect && selectedMessages.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkMarkAsRead}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <MailOpen className="h-4 w-4 mr-1" />
                        Okundu İşaretle ({selectedMessages.length})
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        Seçilenleri Sil ({selectedMessages.length})
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Sayfa Boyutu</Label>
                  <select
                    value={limit}
                    onChange={(e) => { setPage(1); setLimit(Number(e.target.value)) }}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  Toplam: {totalMessages} 
                  {searchId && ` (Filtrelenmiş: ${filteredMessages.length})`}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowBulkSelect(!showBulkSelect)
                      if (showBulkSelect) {
                        // Toplu seçim modu kapatılıyorsa seçimleri temizle
                        setSelectedMessages([])
                        setSelectAll(false)
                      }
                    }}
                    className="text-xs"
                  >
                    {showBulkSelect ? 'Toplu Seçimi Gizle' : 'Toplu Seç'}
                  </Button>
                  {showBulkSelect && (
                    <>
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label className="text-sm">Tümünü Seç</Label>
                    </>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="border-b">
                      {showBulkSelect && (
                        <th className="text-left py-3 px-2 font-medium text-gray-500 w-8">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                      )}
                      <th className="text-left py-3 px-2 font-medium text-gray-500 w-48">Gönderen</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 w-64">Konu</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 w-24">Tür</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 w-24">Durum</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 w-32">Tarih</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 w-48">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((message: AdminMessage) => (
                      <tr key={message.id} className="border-b hover:bg-gray-50">
                        {showBulkSelect && (
                          <td className="py-3 px-2">
                            <Checkbox
                              checked={selectedMessages.includes(message.id)}
                              onCheckedChange={(checked) => handleMessageSelect(message.id, checked as boolean)}
                            />
                          </td>
                        )}
                        <td className="py-3 px-2">
                          <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0">
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-3 w-3 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-2 min-w-0 flex-1">
                              <div className="font-medium text-gray-900 text-sm truncate">{message.name}</div>
                              <div className="text-xs text-gray-500 truncate">{message.email}</div>
                              {message.phone && (
                                <div className="text-xs text-gray-400 flex items-center mt-1">
                                  <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{message.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {message.subject}
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-1">
                              {message.message}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="text-xs">
                            {getMessageTypeDisplay(message.type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="scale-90 origin-left">
                            {getStatusBadge(message.status)}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{formatDate(message.createdAt)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            <Link href={`/admin/messages/${message.id}`}>
                              <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7">
                                Gör
                              </Button>
                            </Link>
                            {message.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs px-2 py-1 h-7"
                                onClick={() => {
                                  const href = getWhatsAppHref(message.phone!, `Merhaba ${message.name},\n\n${message.subject}`)
                                  window.open(href, '_blank')
                                }}
                              >
                                WA
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs px-2 py-1 h-7"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              Sil
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Önceki
                  </Button>
                  <div className="text-sm text-gray-600">Sayfa {page} / {Math.max(1, Math.ceil(totalMessages / limit))}</div>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(totalMessages / limit)} onClick={() => setPage((p) => p + 1)}>
                    Sonraki
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
