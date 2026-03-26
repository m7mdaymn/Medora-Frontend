'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface PaginationProps {
  totalCount: number
  pageSize?: number
}

export function PatientPagination({ totalCount, pageSize = 10 }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { replace } = useRouter()

  const currentPage = Number(searchParams.get('page')) || 1
  const totalPages = Math.ceil(totalCount / pageSize)

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) return null

  return (
    <div className='flex items-center justify-end gap-2'>
      <div className='text-sm text-muted-foreground ml-4'>
        صفحة {currentPage} من {totalPages}
      </div>

      <Button
        variant='outline'
        size='icon'
        disabled={currentPage <= 1}
        onClick={() => replace(createPageURL(currentPage - 1))}
      >
        <ChevronRight className='h-4 w-4' />
      </Button>

      <Button
        variant='outline'
        size='icon'
        disabled={currentPage >= totalPages}
        onClick={() => replace(createPageURL(currentPage + 1))}
      >
        <ChevronLeft className='h-4 w-4' />
      </Button>
    </div>
  )
}
