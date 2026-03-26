'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns' // بنستخدمه عشان نظبط فورمات التاريخ
import { Calendar as CalendarIcon, Filter } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// دالة مساعدة عشان نحول الاسترنج اللي جاي من الـ URL لـ Date Object
const parseSafeDate = (dateStr: string | null) => {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? undefined : d
}

export function PeriodFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [range, setRange] = useState(searchParams.get('range') || 'all')
  // خلينا الـ State هنا من نوع Date عشان يشتغل مع Shadcn Calendar
  const [customFrom, setCustomFrom] = useState<Date | undefined>(
    parseSafeDate(searchParams.get('from')),
  )
  const [customTo, setCustomTo] = useState<Date | undefined>(parseSafeDate(searchParams.get('to')))

  const handleApply = (fromVal: string, toVal: string, rangeVal: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', rangeVal)
    params.set('page', '1')

    if (fromVal) params.set('from', fromVal)
    else params.delete('from')

    if (toVal) params.set('to', toVal)
    else params.delete('to')

    if (rangeVal === 'all') {
      params.delete('from')
      params.delete('to')
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  // دالة مخصوصة لزرار "تطبيق" بتاع التواريخ المخصصة
  const handleCustomApply = () => {
    const f = customFrom ? format(customFrom, 'yyyy-MM-dd') : ''
    const t = customTo ? format(customTo, 'yyyy-MM-dd') : ''
    handleApply(f, t, 'custom')
  }

  const handlePresetChange = (value: string) => {
    setRange(value)
    const today = new Date()
    let f = '',
      t = ''

    if (value === 'today') {
      f = t = format(today, 'yyyy-MM-dd')
    } else if (value === 'this-month') {
      f = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd')
      t = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd')
    } else if (value === 'last-month') {
      f = format(new Date(today.getFullYear(), today.getMonth() - 1, 1), 'yyyy-MM-dd')
      t = format(new Date(today.getFullYear(), today.getMonth(), 0), 'yyyy-MM-dd')
    } else if (value === 'this-year') {
      f = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd')
      t = format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd')
    }

    if (value !== 'custom') {
      setCustomFrom(f ? new Date(f) : undefined)
      setCustomTo(t ? new Date(t) : undefined)
      handleApply(f, t, value)
    }
  }

  return (
    <div className='flex flex-wrap items-center gap-3 w-full sm:w-auto z-10 relative'>
      <Select value={range} onValueChange={handlePresetChange} dir='rtl'>
        <SelectTrigger className='w-full sm:w-40 h-10 bg-background shrink-0'>
          <div className='flex items-center gap-2'>
            <Filter className='w-4 h-4 text-muted-foreground' />
            <SelectValue placeholder='الفترة الزمنية' />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='today'>اليوم</SelectItem>
          <SelectItem value='this-month'>هذا الشهر</SelectItem>
          <SelectItem value='last-month'>الشهر الماضي</SelectItem>
          <SelectItem value='this-year'>هذه السنة</SelectItem>
          <SelectItem value='all'>كل الأوقات</SelectItem>
          <SelectItem value='custom'>تاريخ مخصص...</SelectItem>
        </SelectContent>
      </Select>

      {range === 'custom' && (
        <div className='flex flex-wrap sm:flex-nowrap items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300 w-full sm:w-auto'>
          {/* ========== DatePicker: من تاريخ ========== */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full sm:w-35 h-10 justify-start text-right font-normal',
                  !customFrom && 'text-muted-foreground',
                )}
              >
                {/* الأيقونة واخدة ml-2 عشان إحنا RTL */}
                <CalendarIcon className='ml-2 h-4 w-4' />
                {customFrom ? format(customFrom, 'yyyy-MM-dd') : <span>من تاريخ</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={customFrom}
                onSelect={setCustomFrom}
                // السطر ده هو اللي بيقفل المستقبل!
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className='text-sm text-muted-foreground font-medium hidden sm:block'>إلى</span>

          {/* ========== DatePicker: إلى تاريخ ========== */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full sm:w-35 h-10 justify-start text-right font-normal',
                  !customTo && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className='ml-2 h-4 w-4' />
                {customTo ? format(customTo, 'yyyy-MM-dd') : <span>إلى تاريخ</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={customTo}
                onSelect={setCustomTo}
                // بيقفل المستقبل + بيقفل أي تاريخ قبل "من تاريخ" لو حابب
                disabled={(date) => date > new Date() || (customFrom ? date < customFrom : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button className='h-10 w-full sm:w-auto shrink-0' onClick={handleCustomApply}>
            تطبيق
          </Button>
        </div>
      )}
    </div>
  )
}
