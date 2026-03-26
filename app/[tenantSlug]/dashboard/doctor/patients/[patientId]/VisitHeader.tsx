import { Badge } from '@/components/ui/badge'
import { CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckCircle2, Clock } from 'lucide-react'

interface Props {
  startedAt: string
  status: 'Open' | 'Completed'
}

export function VisitHeader({ startedAt, status }: Props) {
  const date = new Date(startedAt)
  const formattedDate = date.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // شيلت الثواني وظبطت الفورمات عشان يطلع شكله نضيف
  const formattedTime = date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const isCompleted = status === 'Completed'

  return (
    // ضفنا space-y-0 عشان نلغي المسافات الافتراضية بتاعت شادسيان
    <CardHeader className='bg-muted/10 border-b p-4 flex flex-row items-start sm:items-center justify-between space-y-0'>
      <div className='flex items-center gap-3'>
        {/* لمسة UI سينيور: أيقونة جوه بوكس خفيف */}
        <div className='bg-primary/10 p-2 rounded-lg text-primary shrink-0'>
          <Calendar className='w-5 h-5' />
        </div>

        {/* فصلنا التاريخ عن الوقت في فليكس عشان الموبايل والـ RTL */}
        <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
          <CardTitle className='text-base sm:text-lg font-bold leading-none'>
            {formattedDate}
          </CardTitle>

          <span className='text-muted-foreground text-sm font-medium flex items-center gap-2'>
            <span className='hidden sm:inline-block'>-</span>
            <span dir='ltr'>{formattedTime}</span>
          </span>
        </div>
      </div>

      <Badge variant={isCompleted ? 'default' : 'secondary'} className='gap-1 h-7 shrink-0'>
        {isCompleted ? <CheckCircle2 className='w-3.5 h-3.5' /> : <Clock className='w-3.5 h-3.5' />}
        {isCompleted ? 'مكتملة' : 'مفتوحة'}
      </Badge>
    </CardHeader>
  )
}
