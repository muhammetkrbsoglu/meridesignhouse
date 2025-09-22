'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { updateEventType, deleteEventType, type EventType } from '@/lib/actions/events'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function EventTypesTable() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadEventTypes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch event types')
      }
      
      const data = await response.json()
      setEventTypes(data)
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Etkinlik türleri yüklenirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadEventTypes()
  }, [loadEventTypes])

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateEventType(id, { isActive: !isActive })
      await loadEventTypes()
      toast({
        title: 'Başarılı',
        description: `Etkinlik türü ${!isActive ? 'aktif' : 'pasif'} hale getirildi.`,
      })
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Etkinlik türü güncellenirken bir hata oluştu.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteEventType(deleteId)
      await loadEventTypes()
      toast({
        title: 'Başarılı',
        description: 'Etkinlik türü başarıyla silindi.',
      })
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Etkinlik türü silinirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Sıralama</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Henüz etkinlik türü bulunmuyor.
                </TableCell>
              </TableRow>
            ) : (
              eventTypes.map((eventType) => (
                <TableRow key={eventType.id}>
                  <TableCell className="font-medium">{eventType.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {eventType.description || '-'}
                  </TableCell>
                  <TableCell>{eventType.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={eventType.isActive ? 'default' : 'secondary'}>
                      {eventType.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(eventType.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/events/${eventType.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(eventType.id, eventType.isActive)}
                        >
                          {eventType.isActive ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Pasif Yap
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Aktif Yap
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(eventType.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Etkinlik türünü sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu etkinlik türünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
