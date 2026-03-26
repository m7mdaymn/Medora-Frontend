'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export interface GenericPaginationProps {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function GenericPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
}: GenericPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { replace } = useRouter()

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 0) return null

  // ضفتلك mt-6 mb-2 هنا عشان تحافظ على نفس المسافات القديمة اللي كانت في الكومبوننت بتاعك
  return (
    <div className='flex items-center justify-end gap-2 mt-6 mb-2'>
      <div className='text-sm text-muted-foreground ml-4'>
        صفحة {currentPage} من {totalPages}
      </div>

      <Button
        variant='outline'
        size='icon'
        disabled={!hasPreviousPage}
        onClick={() => replace(createPageURL(currentPage - 1))}
      >
        <ChevronRight className='h-4 w-4' />
      </Button>

      <Button
        variant='outline'
        size='icon'
        disabled={!hasNextPage}
        onClick={() => replace(createPageURL(currentPage + 1))}
      >
        <ChevronLeft className='h-4 w-4' />
      </Button>
    </div>
  )
}
