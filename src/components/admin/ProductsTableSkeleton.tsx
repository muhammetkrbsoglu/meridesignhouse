// Loading animation
const shimmer =
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent'

export function ProductsTableSkeleton() {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="mb-2 w-full rounded-md bg-white p-4">
                <div className="flex items-center justify-between border-b pb-8">
                  <div className="flex items-center">
                    <div className="mr-2 h-8 w-8 rounded-full bg-gray-200" />
                    <div className="h-6 w-16 rounded bg-gray-200" />
                  </div>
                  <div className="h-6 w-16 rounded bg-gray-200" />
                </div>
                <div className="flex w-full items-center justify-between border-b py-8">
                  <div className="h-6 w-16 rounded bg-gray-200" />
                  <div className="h-6 w-16 rounded bg-gray-200" />
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div className="h-6 w-16 rounded bg-gray-200" />
                  <div className="h-6 w-16 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Ürün
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Kategori
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Fiyat
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Stok
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Durum
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Düzenle</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="w-full border-b border-gray-100 last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                  <td className="relative overflow-hidden whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <div className="h-6 w-24 rounded bg-gray-200" />
                    </div>
                    <div className={`${shimmer} relative overflow-hidden`} />
                  </td>
                  <td className="relative overflow-hidden whitespace-nowrap px-3 py-3">
                    <div className="h-6 w-32 rounded bg-gray-200" />
                    <div className={`${shimmer} relative overflow-hidden`} />
                  </td>
                  <td className="relative overflow-hidden whitespace-nowrap px-3 py-3">
                    <div className="h-6 w-16 rounded bg-gray-200" />
                    <div className={`${shimmer} relative overflow-hidden`} />
                  </td>
                  <td className="relative overflow-hidden whitespace-nowrap px-3 py-3">
                    <div className="h-6 w-16 rounded bg-gray-200" />
                    <div className={`${shimmer} relative overflow-hidden`} />
                  </td>
                  <td className="relative overflow-hidden whitespace-nowrap px-3 py-3">
                    <div className="h-6 w-16 rounded bg-gray-200" />
                    <div className={`${shimmer} relative overflow-hidden`} />
                  </td>
                  <td className="relative overflow-hidden whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <div className="h-[38px] w-[38px] rounded bg-gray-200" />
                      <div className="h-[38px] w-[38px] rounded bg-gray-200" />
                    </div>
                    <div className={`${shimmer} relative overflow-hidden`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}