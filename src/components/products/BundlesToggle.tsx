'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Switch } from '@/components/ui/switch'

export function BundlesToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const checked = searchParams.get('showBundles') === '1'

  const onChange = (value: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('showBundles', '1')
    } else {
      params.delete('showBundles')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span>Sadece setler</span>
    </label>
  )
}


