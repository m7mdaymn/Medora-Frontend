'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale' // 👈 استيراد اللغة العربية
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function DoctorDateFilter({ currentDate }: { currentDate: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', format(date, 'yyyy-MM-dd'))
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const formattedDate = new Date(currentDate).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='flex items-center gap-2 px-4 py-2 bg-card border-border/50 shadow-sm rounded-xl h-auto font-bold text-sm hover:bg-muted/50 transition-colors'
        >
          <CalendarIcon className='size-4 text-muted-foreground' />
          <span>{formattedDate}</span>
        </Button>
      </PopoverTrigger>
      {/* ضفنا dir rtl عشان الأيام تبدأ صح */}
      <PopoverContent className='w-auto p-0' align='end' dir='rtl'>
        <Calendar
          mode='single'
          selected={new Date(currentDate)}
          onSelect={handleSelect}
          locale={ar} 
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
