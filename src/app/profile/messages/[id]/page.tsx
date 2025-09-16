import { notFound } from 'next/navigation';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { WhatsAppButton } from '@/components/profile/WhatsAppButton';
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
import { getMessageById } from '@/lib/actions/messages';
import { createServerClient } from '@/lib/supabase';

export const metadata = {
  title: 'Mesaj Detayı | Profil',
  description: 'İletişim talebi detayları',
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
  
  // Check if user is authenticated
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    notFound();
  }

  const message = await getMessageById(resolvedParams.id);

  if (!message || message.userId !== user.id) {
    notFound();
  }

  const status = statusConfig[message.status as keyof typeof statusConfig];
  const type = typeConfig[message.type as keyof typeof typeConfig];

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/profile">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Sol Kolon - Mesaj İçeriği */}
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
              </div>

              {/* Sağ Kolon - İletişim ve Bilgiler */}
              <div className="space-y-6">
                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      İletişim Bilgileri
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
                  </CardContent>
                </Card>

                {/* (Moved) WhatsApp Response shown below */}

                
              </div>
            </div>

            {/* Help Info - full width bottom to reduce white space */}
            <Card className="mt-2">
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <MessageSquare className="mr-2 h-4 w-4 text-rose-600" />
                  Yardım ve Destek
                </CardTitle>
                <CardDescription>
                  Sık takılan sorular ve hızlı destek seçenekleri
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 grid gap-3">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                  <p>E-posta: <span className="font-medium">destek@meridesignhouse.com</span></p>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                  <p>Telefon: <span className="font-medium">+90 532 987 65 43</span> (09:00 - 18:00)</p>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600 mt-0.5" />
                  <p>WhatsApp: Sağ sütundaki butonla hızlıca yazışmaya başlayabilirsiniz.</p>
                </div>
                <div className="text-xs text-gray-500">
                  Not: Talep ID&apos;inizi paylaşmanız süreci hızlandırır. (#{message.id.slice(0,8)})
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href="/contact">
                    <Button size="sm" variant="outline">Yeni talep oluştur</Button>
                  </Link>
                  <Link href="/profile">
                    <Button size="sm" variant="outline">Profilime dön</Button>
                  </Link>
                  {message.phone && (
                    <Link href={`https://wa.me/${message.phone.replace(/[^0-9]/g,'')}`} target="_blank">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">WhatsApp&apos;tan yaz</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Response - placed under Help card */}
            {message.phone && (
              <Card className="mt-2">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    WhatsApp ile Yanıtla
                  </CardTitle>
                  <CardDescription>
                    Bu mesajla ilgili WhatsApp üzerinden hızlı destek alabilirsiniz
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WhatsAppButton
                    messageId={message.id}
                    message={message.message}
                    phone={message.phone}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
