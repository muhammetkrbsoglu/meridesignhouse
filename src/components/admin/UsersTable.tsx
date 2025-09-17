'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  UserIcon,
  ShieldCheckIcon,
  EyeIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon
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
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const { light, medium, success } = useHapticFeedback();

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    
    if (selectedRole && selectedRole !== 'all') {
      params.set('role', selectedRole);
    } else {
      params.delete('role');
    }
    
    params.set('page', '1');
    router.push(`/admin/users?${params.toString()}`);
    medium('Arama yapılıyor');
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    const params = new URLSearchParams(searchParams.toString());
    
    if (role !== 'all') {
      params.set('role', role);
    } else {
      params.delete('role');
    }
    
    params.set('page', '1');
    router.push(`/admin/users?${params.toString()}`);
    light('Filtre uygulanıyor');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    router.push('/admin/users');
    success('Filtreler temizlendi');
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Kullanıcı Ara
            </label>
            <div className="relative">
              <Input
                placeholder="İsim, email veya telefon ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Role Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Rol Filtresi
            </label>
            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm roller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Roller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="customer">Müşteri</SelectItem>
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

      {/* Mobile Cards / Desktop Table */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border p-12 text-center"
          >
            <div className="text-gray-400">
              <UserIcon className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Kullanıcı bulunamadı
              </h3>
              <p className="text-gray-500">
                Arama kriterlerinize uygun kullanıcı bulunamadı.
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              <AnimatePresence>
                {users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <HoverCard
                      shimmer={false}
                      hapticType="light"
                      hapticMessage={`${user.full_name || 'İsimsiz Kullanıcı'} kullanıcısı`}
                      className="w-full"
                    >
                      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-rose-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {user.full_name || 'İsimsiz Kullanıcı'}
                              </h3>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          
                          {/* 3-dots Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <MicroFeedback
                                onClick={() => {}}
                                hapticType="light"
                                hapticMessage="Kullanıcı menüsü"
                              >
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <EllipsisVerticalIcon className="h-4 w-4" />
                                </Button>
                              </MicroFeedback>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}`} className="flex items-center">
                                  <EyeIcon className="mr-2 h-4 w-4" />
                                  Detayları Görüntüle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}/edit`} className="flex items-center">
                                  <PencilIcon className="mr-2 h-4 w-4" />
                                  Düzenle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                          {/* Phone */}
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <PhoneIcon className="h-3 w-3" />
                              <span>{user.phone}</span>
                            </div>
                          )}

                          {/* Address */}
                          {user.address && (
                            <div className="flex items-start space-x-2 text-xs text-gray-600">
                              <MapPinIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="truncate">{user.address}</div>
                                {user.city && (
                                  <div className="text-gray-400">
                                    {user.city}{user.postal_code && `, ${user.postal_code}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Role & Dates */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <Badge 
                              variant={user.role === 'admin' ? 'default' : 'secondary'}
                              className={`text-xs ${
                                user.role === 'admin' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {user.role === 'admin' ? 'Admin' : 'Müşteri'}
                            </Badge>
                            
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{formatDate(user.created_at)}</span>
                            </div>
                          </div>

                          {/* Last Sign In */}
                          {user.last_sign_in_at && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <ClockIcon className="h-3 w-3" />
                              <span>Son giriş: {formatDate(user.last_sign_in_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </HoverCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
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
                    {users.map((user) => (
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
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            className={user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
                          >
                            {user.role === 'admin' ? 'Admin' : 'Müşteri'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Hiç giriş yapmamış'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', page.toString());
              router.push(`/admin/users?${params.toString()}`);
              light('Sayfa değiştiriliyor');
            }}
          />
        </div>
      )}
    </div>
  );
}