import { UpdateCategory, DeleteCategory } from '@/components/admin/CategoryButtons'
import { fetchFilteredCategories } from '@/lib/actions/categories'

interface CategoryChild {
  id: string;
  name: string;
}

export async function CategoriesTable({
  query,
  currentPage,
}: {
  query: string
  currentPage: number
}) {
  const categories = await fetchFilteredCategories(query, currentPage)

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {categories?.map((category) => (
              <div
                key={category.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <p className="font-medium">{category.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {category.parent?.name || 'Ana Kategori'}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <UpdateCategory id={category.id} />
                    <DeleteCategory id={category.id} />
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {category.productCount} ürün
                    </p>
                    <p className="text-sm text-gray-500">
                      {category.children.length} alt kategori
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Kategori Adı
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Üst Kategori
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Ürün Sayısı
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Alt Kategoriler
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
              {categories?.map((category) => (
                <tr
                  key={category.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-gray-500">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {category.parent?.name || (
                      <span className="text-gray-400">Ana Kategori</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {category.productCount}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {category.children.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {category.children.slice(0, 2).map((child: CategoryChild) => (
                          <span
                            key={child.id}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                          >
                            {child.name}
                          </span>
                        ))}
                        {category.children.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{category.children.length - 2} daha
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdateCategory id={category.id} />
                      <DeleteCategory id={category.id} />
                    </div>
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