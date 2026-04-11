'use client'

import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  Activity,
  Calendar,
  CalendarDays,
  Clock,
  Layout,
  Phone,
  Stethoscope,
  User,
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { GenericPagination } from '@/components/shared/pagination'
import { cn } from '@/lib/utils'
import { IPaginatedData } from '@/types/api'
import { IBooking } from '@/types/booking'
import { AppointmentsCalendar } from './appointments-calendar'
import { BookingRowActions } from './BookingRowActions'

interface AppointmentsViewProps {
  paginatedData: IPaginatedData<IBooking> | null
  currentView: string
}

export function AppointmentsView({ paginatedData, currentView }: AppointmentsViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const bookingsList = paginatedData?.items || []

  const handleViewChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('view', value)
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // 1. هندلة الحالة الأساسية للحجز
  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      Confirmed: { label: 'مؤكد', variant: 'default' },
      Cancelled: { label: 'ملغي', variant: 'destructive' },
      Completed: { label: 'مكتمل', variant: 'secondary' },
      Rescheduled: { label: 'مؤجل', variant: 'outline' },
    }

    const { label, variant } = config[status] || { label: status, variant: 'outline' }
    return (
      <Badge variant={variant} className='whitespace-nowrap'>
        {label}
      </Badge>
    )
  }

  // 🔴 2. هندلة الغرض من العملية (كشف / استشارة / موعد قادم / في الطابور)
  const getOperationalBadge = (purpose: string) => {
    const config: Record<string, { label: string }> = {
      FutureAppointment: {
        label: 'موعد قادم',
      },
      QueueBridged: {
        label: 'في الطابور',
      },
    }

    const match = config[purpose]

    return (
      <Badge
        variant='secondary'
        className={cn('h-4 text-[9px] px-1.5 rounded-sm whitespace-nowrap')}
      >
        {match ? match.label : purpose}
      </Badge>
    )
  }

  return (
    <Tabs value={currentView} onValueChange={handleViewChange} className='w-full' dir='rtl'>
      <div className='flex items-center justify-between mb-6'>
        <TabsList className='grid w-75 grid-cols-2'>
          <TabsTrigger value='table' className='flex items-center gap-2 text-sm font-medium'>
            <Layout className='h-4 w-4' /> الجدول
          </TabsTrigger>
          <TabsTrigger value='calendar' className='flex items-center gap-2 text-sm font-medium'>
            <CalendarDays className='h-4 w-4' /> التقويم
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value='table' className='mt-0 outline-none'>
        <div className='overflow-x-auto rounded-xl border '>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead className='text-right'>المريض</TableHead>
                <TableHead className='text-right'>الطبيب والخدمة</TableHead>
                <TableHead className='text-right'>الميعاد</TableHead>
                <TableHead className='text-right'>الحالة</TableHead>
                <TableHead className='text-left w-20'>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-32 text-center text-muted-foreground'>
                    لا يوجد حجوزات حالياً.
                  </TableCell>
                </TableRow>
              ) : (
                bookingsList.map((booking) => (
                  <TableRow key={booking.id} className='hover:bg-muted/30 transition-colors'>
                    <TableCell>
                      <div className='flex flex-col gap-1 text-right'>
                        <span className='font-bold flex items-center gap-2 text-sm'>
                          <User className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                          {booking.patientName}
                        </span>
                        <span className='text-[11px] text-muted-foreground flex items-center gap-1'>
                          <Phone className='h-3 w-3 shrink-0' />
                          <span dir='ltr'>{booking.patientPhone}</span>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex flex-col gap-1 text-right'>
                        <div className='flex items-center gap-2 text-sm font-medium'>
                          <Stethoscope className='h-3.5 w-3.5 text-primary shrink-0' />
                          {booking.doctorName}
                        </div>
                        <div className='flex items-center gap-2 mr-5 text-[11px] text-muted-foreground'>
                          {booking.serviceName && <span>{booking.serviceName}</span>}
                          {/* 🔴 عرض نوع العملية أو حالة الطابور */}
                          {booking.operationalPurpose &&
                            getOperationalBadge(booking.operationalPurpose)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex flex-col gap-1 text-right'>
                        <div className='flex items-center gap-1.5 text-sm'>
                          <Calendar className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                          {format(new Date(booking.bookingDate), 'PPP', { locale: ar })}
                        </div>
                        <div className='flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground'>
                          <Clock className='h-3.5 w-3.5 shrink-0' />
                          {booking.bookingTime}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {getStatusBadge(booking.status)}
                        {/* 🔴 نبض التنبيه لو الكشف شغال حالياً */}
                        {booking.isOperationalNow && (
                          <span className='flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse whitespace-nowrap'>
                            <Activity className='w-3 h-3' />
                            جارِ الكشف
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className='text-left'>
                      <BookingRowActions booking={booking} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {paginatedData && paginatedData.totalPages > 1 && (
          <GenericPagination
            currentPage={paginatedData.pageNumber}
            totalPages={paginatedData.totalPages}
            hasNextPage={paginatedData.hasNextPage}
            hasPreviousPage={paginatedData.hasPreviousPage}
          />
        )}
      </TabsContent>

      <TabsContent value='calendar' className='mt-0 outline-none'>
        <AppointmentsCalendar bookingsList={bookingsList} />
      </TabsContent>
    </Tabs>
  )
}
