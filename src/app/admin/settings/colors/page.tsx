import { AdminGuard } from '@/components/auth/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { listAllColors, upsertColor, deleteColor, setColorActive, seedColorsIfEmpty } from '@/lib/actions/colors'
import { Color } from '@/lib/actions/colors'

export const metadata = {
  title: 'Renk Yöneticisi | Admin Panel',
  description: 'Renk paletini yönetin',
}

export default async function ColorsAdminPage() {
  await seedColorsIfEmpty()
  const colors = await listAllColors()

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="w-full">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-2xl font-bold">Renk Yöneticisi</h1>
          </div>
          {/* Create Color */}
          <div className="mt-4 mb-6 rounded-lg border bg-white p-4">
            <h2 className="text-sm font-semibold mb-3">Yeni Renk Ekle</h2>
            <form action={async (formData: FormData) => {
              'use server'
              const name = String(formData.get('name') || '').trim()
              let hex = String(formData.get('hex') || '').trim()
              if (!hex) {
                const picked = String(formData.get('hex_color_picker') || '').trim()
                if (picked) hex = picked
              }
              if (hex && !hex.startsWith('#')) hex = `#${hex}`
              const is_active = formData.get('is_active') === 'on'
              if (!name || !hex) return
              const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9\s-ığüşöç]/g, '')
                .replace(/\s+/g, '-').replace(/-+/g, '-')
                .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').replace(/ı/g,'i')
              await upsertColor({ name, hex, slug, is_active })
            }} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input name="name" placeholder="Renk adı (örn. Koyu Kırmızı)" className="border rounded-md px-3 py-2 text-sm md:col-span-2" />
              <div className="flex items-center gap-2 md:col-span-2">
                <input name="hex" placeholder="#FF0000" className="border rounded-md px-3 py-2 text-sm flex-1" />
                <input type="color" className="h-10 w-10 border rounded" name="hex_color_picker" />
              </div>
              <div className="flex items-center gap-3 md:col-span-1">
                <label className="text-sm flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked /> Aktif</label>
                <button type="submit" className="ml-auto inline-flex items-center justify-center rounded-md bg-gray-900 text-white px-3 py-2 text-sm font-medium hover:bg-gray-800">Ekle</button>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-2">İpucu: Sağdaki renk kutusuyla hex seçebilir, metin alanına yapıştırabilirsiniz.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colors.length === 0 && (
              <div className="text-sm text-gray-500">Kayıtlı renk bulunamadı.</div>
            )}
            {colors.map((c: Color) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-4 bg-white">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-5 w-5 rounded-full border" style={{ backgroundColor: c.hex }} />
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.hex}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={async () => { 'use server'; await setColorActive(c.id, !c.is_active) }}>
                    <button className="text-xs px-2 py-1 rounded border">
                      {c.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                  </form>
                  <form action={async () => { 'use server'; await deleteColor(c.id) }}>
                    <button className="text-xs px-2 py-1 rounded border text-red-600 border-red-200">Sil</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}



