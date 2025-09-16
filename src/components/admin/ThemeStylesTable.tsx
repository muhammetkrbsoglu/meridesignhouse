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
import { fetchThemeStyles, updateThemeStyle, deleteThemeStyle, type ThemeStyle } from '@/lib/actions/events'
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

export function ThemeStylesTable() {
  const [themeStyles, setThemeStyles] = useState<ThemeStyle[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadThemeStyles = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchThemeStyles()
      setThemeStyles(data)
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Tema stilleri yüklenirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadThemeStyles()
  }, [loadThemeStyles])

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateThemeStyle(id, { isActive: !isActive })
      await loadThemeStyles()
      toast({
        title: 'Başarılı',
        description: `Tema stili ${!isActive ? 'aktif' : 'pasif'} hale getirildi.`,
      })
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Tema stili durumu güncellenirken bir hata oluştu.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteThemeStyle(deleteId)
      await loadThemeStyles()
      toast({
        title: 'Başarılı',
        description: 'Tema stili başarıyla silindi.',
      })
    } catch (_error) {
      toast({
        title: 'Hata',
        description: 'Tema stili silinirken bir hata oluştu.',
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
            {themeStyles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Henüz tema stili bulunmuyor.
                </TableCell>
              </TableRow>
            ) : (
              themeStyles.map((themeStyle) => (
                <TableRow key={themeStyle.id}>
                  <TableCell className="font-medium">{themeStyle.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {themeStyle.description || '-'}
                  </TableCell>
                  <TableCell>
                    {themeStyle.description || '-'}
                  </TableCell>
                  <TableCell>{themeStyle.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={themeStyle.isActive ? 'default' : 'secondary'}>
                      {themeStyle.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(themeStyle.createdAt).toLocaleDateString('tr-TR')}
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
                          <Link href={`/admin/themes/${themeStyle.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(themeStyle.id, themeStyle.isActive)}
                        >
                          {themeStyle.isActive ? (
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
                          onClick={() => setDeleteId(themeStyle.id)}
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
            <AlertDialogTitle>Tema stilini sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu tema stilini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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