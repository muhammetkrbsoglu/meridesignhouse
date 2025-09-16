'use client';

// Removed unused useState
import Link from 'next/link';
// Removed unused router
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { User } from '@/lib/actions/users';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Removed unused select components
// Alert dialog components not available
// Removed unused toast import

interface UserDetailProps {
  user: User;
}

export function UserDetail({ user }: UserDetailProps) {
  // Rol yönetimi devre dışı bırakıldı

  const getRoleBadge = (userRole: string) => {
    if (userRole === 'admin') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <ShieldCheckIcon className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <UserIcon className="h-3 w-3" />
        Kullanıcı
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Kullanıcı Listesine Dön
        </Link>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-gray-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.full_name || 'İsimsiz Kullanıcı'}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              <div className="mt-2">
                {getRoleBadge(user.role)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Temel Bilgiler
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Ad Soyad</p>
                  <p className="text-sm text-gray-600">
                    {user.full_name || 'Belirtilmemiş'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Telefon</p>
                  <p className="text-sm text-gray-600">
                    {user.phone || 'Belirtilmemiş'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Adres</p>
                  <div className="text-sm text-gray-600">
                    {user.address ? (
                      <div>
                        <p>{user.address}</p>
                        {user.city && (
                          <p className="text-xs text-gray-500 mt-1">
                            {user.city}{user.postal_code && `, ${user.postal_code}`}
                            {user.country && ` - ${user.country}`}
                          </p>
                        )}
                      </div>
                    ) : (
                      'Belirtilmemiş'
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Rol</p>
                  <div className="mt-1">
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Aktivite Bilgileri
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Kayıt Tarihi</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Son Güncelleme</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Son Giriş</p>
                  <p className="text-sm text-gray-600">
                    {user.last_sign_in_at 
                      ? formatDate(user.last_sign_in_at)
                      : 'Hiç giriş yapmamış'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rol Yönetimi kaldırıldı */}
    </div>
  );
}