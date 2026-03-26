'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

export function PatientSearch() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // State عشان الـ Input يفضل سريع وميهنجش مع الكتابة
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  // السحر هنا: الدالة دي مش هتتنفذ غير بعد 400 ملي ثانية من آخر ضغطة زرار
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1') // دايماً رجعه لأول صفحة

    if (term) {
      params.set('search', term)
    } else {
      params.delete('search')
    }

    replace(`${pathname}?${params.toString()}`)
  }, 400)

  return (
    <div className='relative w-full max-w-md '>
      <Search className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        className='pr-9'
        placeholder='ابحث باسم المريض أو رقم الهاتف...'
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value) // Update UI immediately
          handleSearch(e.target.value) // Trigger debounced search
        }}
      />
    </div>
  )
}
