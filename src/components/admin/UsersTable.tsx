'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  UserIcon,
  ShieldCheckIcon,
  EyeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { User } from '@/lib/actions/users';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/Pagination';

interface UsersTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  search: string;
  role: string;
}

export function UsersTable({ 
  users, 
  currentPage, 
  totalPages, 
  search, 
  role 
}: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(search);
  const [selectedRole, setSelectedRole] = useState(role);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    
    params.delete('page'); // Reset to first page
    
    const queryString = params.toString();
    router.push(`/admin/users${queryString ? `?${queryString}` : ''}`);
  };

  const handleRoleFilter = (value: string) => {
    setSelectedRole(value);
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== 'all') {
      params.set('role', value);
    } else {
      params.delete('role');
    }
    
    params.delete('page'); // Reset to first page
    
    const queryString = params.toString();
    router.push(`/admin/users${queryString ? `?${queryString}` : ''}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    router.push('/admin/users');
  };

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
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FunnelIcon className="h-4 w-4" />
          Filtreler
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Arama
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Email veya isim ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="sm">
                <MagnifyingGlassIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Role Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Rol
            </label>
            <Select value={selectedRole || 'all'} onValueChange={handleRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">Kullanıcı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              &nbsp;
            </label>
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="w-full"
            >
              Filtreleri Temizle
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Giriş
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <UserIcon className="mx-auto h-12 w-12 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Kullanıcı bulunamadı
                      </h3>
                      <p className="text-gray-500">
                        Arama kriterlerinize uygun kullanıcı bulunamadı.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'İsimsiz Kullanıcı'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || 'Belirtilmemiş'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="max-w-xs">
                        {user.address ? (
                          <div>
                            <div className="truncate">{user.address}</div>
                            {user.city && (
                              <div className="text-xs text-gray-400">
                                {user.city}{user.postal_code && `, ${user.postal_code}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          'Belirtilmemiş'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Hiç giriş yapmamış'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-rose-600 hover:text-rose-900 inline-flex items-center gap-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Görüntüle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/admin/users"
            />
          </div>
        )}
      </div>
    </div>
  );
}