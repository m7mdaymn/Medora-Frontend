'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function PatientSearch() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1')

    if (term) {
      params.set('search', term)
    } else {
      params.delete('search')
    }

    replace(`${pathname}?${params.toString()}`)
  }, 300)

  return (
    <div className='relative flex-1 md:grow-0'>
      <Search className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />

      <Input
        type='search'
        placeholder='بحث بالاسم أو الهاتف...'
        className='w-full rounded-lg bg-background pr-9 pl-4 md:w-75 lg:w-85'
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('search')?.toString()}
      />
    </div>
  )
}
