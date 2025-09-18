import { notFound } from 'next/navigation';
import { AdminGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getMessageById, updateMessageStatus } from '@/lib/actions/messages';
import { getSupabaseAdmin } from '@/lib/supabase';
import { MessageStatus } from '@prisma/client';
import { ReplyForm } from './ReplyForm';

export const metadata = {
  title: 'Mesaj Detayı | Admin Panel',
  description: 'Müşteri mesajı detayları ve yanıtlama sayfası',
};

interface MessageDetailPageProps {
  params: {
    id: string;
  };
}

const statusConfig = {
  UNREAD: {
    label: 'Okunmadı',
    color: 'bg-red-100 text-red-800',
  },
  READ: {
    label: 'Okundu',
    color: 'bg-blue-100 text-blue-800',
  },
  REPLIED: {
    label: 'Yanıtlandı',
    color: 'bg-green-100 text-green-800',
  },
  CLOSED: {
    label: 'Kapatıldı',
    color: 'bg-gray-100 text-gray-800',
  },
};

const typeConfig = {
  CONTACT: {
    label: 'İletişim',
    color: 'bg-blue-100 text-blue-800',
  },
  ORDER_INQUIRY: {
    label: 'Sipariş Sorgusu',
    color: 'bg-purple-100 text-purple-800',
  },
  SUPPORT: {
    label: 'Destek',
    color: 'bg-orange-100 text-orange-800',
  },
  COMPLAINT: {
    label: 'Şikayet',
    color: 'bg-red-100 text-red-800',
  },
};

export default async function MessageDetailPage({ params }: MessageDetailPageProps) {
  const resolvedParams = await params;
  const message = await getMessageById(resolvedParams.id);

  if (!message) {
    notFound();
  }

  const status = statusConfig[message.status as keyof typeof statusConfig];
  const type = typeConfig[message.type as keyof typeof typeConfig];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/messages">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mesaj Detayı</h1>
                <p className="text-gray-600">#{message.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={status.color}>
                {status.label}
              </Badge>
              <Badge className={type.color}>
                {type.label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Kolon - Mesaj İçeriği ve Yanıt */}
            <div className="space-y-6">
              {/* Message Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5" />
                    Mesaj İçeriği
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Konu</Label>
                    <p className="text-gray-900 font-medium">{message.subject}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Mesaj</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <Calendar className="inline mr-1 h-4 w-4" />
                    {format(new Date(message.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Reply */}
              {message.adminReply && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-700">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Admin Yanıtı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{message.adminReply}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reply Form */}
              {message.status !== MessageStatus.CLOSED && (
                <Card>
                  <CardHeader>
                    <CardTitle>Yanıt Gönder</CardTitle>
                    <CardDescription>
                      Müşteriye email ve WhatsApp üzerinden yanıt gönderin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReplyForm messageId={message.id} message={message} />
                  </CardContent>
                </Card>
              )}

              {/* Admin Notu - Sol kolona taşındı */}
              <Card>
                <CardHeader>
                  <CardTitle>Admin Notu</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    action={async (formData: FormData) => {
                      'use server';
                      const supabase = getSupabaseAdmin();
                      const admin_notes = String(formData.get('admin_notes') || '');
                      await (supabase.from('messages') as any).update({ adminReply: admin_notes }).eq('id', message.id);
                    }}
                    className="space-y-2"
                  >
                    <Label className="text-sm">İç Notlar</Label>
                    <textarea 
                      name="admin_notes" 
                      defaultValue={message.adminReply || ''} 
                      className="w-full min-h-[100px] border rounded p-2" 
                      placeholder="Bu mesajla ilgili notlarınızı yazın..."
                    />
                    <Button type="submit" variant="outline" className="w-full">Notu Kaydet</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sağ Kolon - Müşteri Bilgileri ve Hızlı İşlemler */}
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Müşteri Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Ad Soyad</Label>
                    <p className="text-gray-900">{message.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">E-posta</Label>
                    <p className="text-gray-900">{message.email}</p>
                  </div>
                  {message.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Telefon</Label>
                      <p className="text-gray-900 flex items-center">
                        <Phone className="mr-1 h-4 w-4" />
                        {message.phone}
                      </p>
                    </div>
                  )}
                  {message.user && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Kayıtlı Kullanıcı</Label>
                      <p className="text-green-600">Evet</p>
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* Hızlı İşlemler */}
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {message.status === MessageStatus.UNREAD && (
                    <form action={async () => {
                      'use server';
                      await updateMessageStatus(message.id, MessageStatus.READ);
                    }}>
                      <Button type="submit" variant="outline" className="w-full">
                        Okundu Olarak İşaretle
                      </Button>
                    </form>
                  )}
                  {message.status !== MessageStatus.CLOSED && (
                    <form action={async () => {
                      'use server';
                      await updateMessageStatus(message.id, MessageStatus.CLOSED);
                    }}>
                      <Button type="submit" variant="outline" className="w-full">
                        Mesajı Kapat
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}