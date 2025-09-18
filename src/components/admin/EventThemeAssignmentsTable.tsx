'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
import { MoreHorizontal, Trash2, Package } from 'lucide-react'
import { fetchEventThemeAssignments, removeProductFromEventTheme, type ThemeStyle } from '@/lib/actions/events'
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

interface EventThemeAssignment {
  id: string
  eventType: {
    id: string
    name: string
  }
  themeStyle: ThemeStyle
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: { url: string; alt: string | null }[]
  }
  createdAt: Date
}

export function EventThemeAssignmentsTable() {
  const [assignments, setAssignments] = useState<EventThemeAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteAssignment, setDeleteAssignment] = useState<EventThemeAssignment | null>(null)
  const { toast } = useToast()

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchEventThemeAssignments()
      setAssignments(data)
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Atamalar yüklenirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const handleDelete = async () => {
    if (!deleteAssignment) return

    try {
      await removeProductFromEventTheme(
        deleteAssignment.product.id,
        deleteAssignment.eventType.id,
        deleteAssignment.themeStyle.id
      )
      await loadAssignments()
      toast({
        title: 'Başarılı',
        description: 'Ürün ataması başarıyla kaldırıldı.',
      })
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Atama kaldırılırken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setDeleteAssignment(null)
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
              <TableHead>Ürün</TableHead>
              <TableHead>Etkinlik Türü</TableHead>
              <TableHead>Tema Stili</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Henüz ürün ataması bulunmuyor.
                  <div className="mt-2">
                    <Link href="/admin/event-themes/assign">
                      <Button variant="outline" size="sm">
                        <Package className="mr-2 h-4 w-4" />
                        İlk Atamayı Yap
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {assignment.product.images.length > 0 && (
                        <Image
                          src={assignment.product.images[0].url}
                          alt={assignment.product.images[0].alt || assignment.product.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{assignment.product.name}</div>
                        <div className="text-sm text-gray-500">ID: {assignment.product.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{assignment.eventType.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {assignment.themeStyle.image && (
                        <Image
                          src={assignment.themeStyle.image}
                          alt={assignment.themeStyle.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className="text-sm font-medium">{assignment.themeStyle.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ₺{assignment.product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setDeleteAssignment(assignment)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Atamayı Kaldır
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

      <AlertDialog open={!!deleteAssignment} onOpenChange={() => setDeleteAssignment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürün atamasını kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAssignment && (
                <>
                  <strong>{deleteAssignment.product.name}</strong> ürününün{' '}
                  <strong>{deleteAssignment.eventType.name}</strong> etkinliği ve{' '}
                  <strong>{deleteAssignment.themeStyle.name}</strong> teması için atamasını kaldırmak istediğinizden emin misiniz?
                  <br /><br />
                  Bu işlem geri alınamaz.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Kaldır
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
