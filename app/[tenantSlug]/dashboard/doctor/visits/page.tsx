import { getMyVisitsAction } from '@/actions/doctor/get-my-today-visits'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { ArrowLeft, CalendarX2, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { IVisit } from '@/types/visit'

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{
    period?: 'all' | 'today' | 'week' | 'month'
    fromDate?: string
    toDate?: string
    visitType?: 'all' | 'Exam' | 'Consultation'
    source?: 'all' | 'booking' | 'ticket' | 'self'
  }>
}

function isBookingSource(source: string): boolean {
  return source === 'Booking' || source === 'ConsultationBooking' || source === 'PatientSelfServiceBooking'
}

function isSelfServiceSource(source: string): boolean {
  return source === 'PatientSelfServiceTicket' || source === 'PatientSelfServiceBooking'
}

function getVisitTypeLabel(type: string): string {
  if (type === 'Exam') return 'كشف'
  if (type === 'Consultation') return 'استشارة'
  return type
}

function getSourceLabel(source: string): string {
  if (source === 'WalkInTicket') return 'تذكرة عيادة'
  if (source === 'Booking') return 'حجز'
  if (source === 'ConsultationBooking') return 'حجز استشارة'
  if (source === 'PatientSelfServiceTicket') return 'تذكرة ذاتية'
  if (source === 'PatientSelfServiceBooking') return 'حجز ذاتي'
  return source
}

function getDefaultDateRange(period: 'all' | 'today' | 'week' | 'month'): { from?: string; to?: string } {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  if (period === 'today') {
    return { from: today, to: today }
  }
  if (period === 'week') {
    const from = new Date(now)
    from.setDate(now.getDate() - 6)
    return { from: from.toISOString().slice(0, 10), to: today }
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: from.toISOString().slice(0, 10), to: today }
  }
  return {}
}

function applyFrontendFilters(
  visits: IVisit[],
  filters: {
    period: 'all' | 'today' | 'week' | 'month'
    fromDate?: string
    toDate?: string
    visitType: 'all' | 'Exam' | 'Consultation'
    source: 'all' | 'booking' | 'ticket' | 'self'
  },
): IVisit[] {
  const range = getDefaultDateRange(filters.period)
  const fromDate = filters.fromDate || range.from
  const toDate = filters.toDate || range.to

  return visits.filter((visit) => {
    const startedDate = visit.startedAt.slice(0, 10)

    if (fromDate && startedDate < fromDate) return false
    if (toDate && startedDate > toDate) return false

    if (filters.visitType !== 'all' && visit.visitType !== filters.visitType) return false

    if (filters.source !== 'all') {
      if (filters.source === 'booking' && !isBookingSource(visit.source)) return false
      if (filters.source === 'ticket' && visit.source !== 'WalkInTicket') return false
      if (filters.source === 'self' && !isSelfServiceSource(visit.source)) return false
    }

    return true
  })
}

export default async function DoctorVisitsPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const qs = await searchParams

  const period = qs.period || 'all'
  const visitType = qs.visitType || 'all'
  const source = qs.source || 'all'
  const fromDate = qs.fromDate
  const toDate = qs.toDate

  const res = await getMyVisitsAction(tenantSlug, { pageNumber: 1, pageSize: 300 })
  const allVisits = res.success && res.data ? res.data : []
  const visits = applyFrontendFilters(allVisits, {
    period,
    fromDate,
    toDate,
    visitType,
    source,
  })

  const defaultRange = getDefaultDateRange(period)
  const effectiveFrom = fromDate || defaultRange.from || ''
  const effectiveTo = toDate || defaultRange.to || ''

  return (
    <DashboardShell>
      <DashboardHeader
        heading='زياراتي'
        text={`عرض كل الزيارات مع فلاتر الوقت والنوع والمصدر - ${format(new Date(), 'dd MMMM yyyy', {
          locale: ar,
        })}`}
      />

      <div className='rounded-2xl border p-4 mb-4'>
        <form method='GET' className='grid grid-cols-1 md:grid-cols-6 gap-3'>
          <div>
            <label className='text-xs text-muted-foreground'>الفترة</label>
            <select
              name='period'
              defaultValue={period}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            >
              <option value='all'>الكل</option>
              <option value='today'>اليوم</option>
              <option value='week'>آخر 7 أيام</option>
              <option value='month'>هذا الشهر</option>
            </select>
          </div>

          <div>
            <label className='text-xs text-muted-foreground'>النوع</label>
            <select
              name='visitType'
              defaultValue={visitType}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            >
              <option value='all'>الكل</option>
              <option value='Exam'>كشف</option>
              <option value='Consultation'>استشارة</option>
            </select>
          </div>

          <div>
            <label className='text-xs text-muted-foreground'>المصدر</label>
            <select
              name='source'
              defaultValue={source}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            >
              <option value='all'>الكل</option>
              <option value='booking'>حجز</option>
              <option value='ticket'>تذكرة</option>
              <option value='self'>ذاتي</option>
            </select>
          </div>

          <div>
            <label className='text-xs text-muted-foreground'>من تاريخ</label>
            <input
              name='fromDate'
              type='date'
              defaultValue={effectiveFrom}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            />
          </div>

          <div>
            <label className='text-xs text-muted-foreground'>إلى تاريخ</label>
            <input
              name='toDate'
              type='date'
              defaultValue={effectiveTo}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            />
          </div>

          <div className='flex items-end gap-2'>
            <Button className='h-10 px-4'>تطبيق</Button>
            <Button variant='outline' asChild className='h-10 px-4'>
              <Link href={`/${tenantSlug}/dashboard/doctor/visits`}>إعادة ضبط</Link>
            </Button>
          </div>
        </form>
      </div>

      <div className='rounded-2xl overflow-hidden border '>
        {visits.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-24 text-center'>
            <div className='h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4'>
              <CalendarX2 className='w-10 h-10 text-muted-foreground/50' />
            </div>
            <h3 className='text-xl font-bold text-foreground mb-2'>لا توجد زيارات بعد</h3>
            <p className='text-sm text-muted-foreground max-w-sm'>
              لم تقم ببدء أي كشف حتى الآن في جلسة اليوم. ابدأ باستدعاء المرضى من الطابور.
            </p>
            <Button asChild className='mt-6' variant='outline'>
              <Link href={`/${tenantSlug}/dashboard/doctor/queue`}>الذهاب لطابور الكشف</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead className='text-right w-30'>رقم الزيارة</TableHead>
                <TableHead className='text-right'>المريض</TableHead>
                  <TableHead className='text-right'>النوع</TableHead>
                  <TableHead className='text-right'>المصدر</TableHead>
                  <TableHead className='text-right'>الخدمة</TableHead>
                  <TableHead className='text-right'>السعر</TableHead>
                  <TableHead className='text-right'>نصيب الطبيب</TableHead>
                <TableHead className='text-right'>وقت البدء</TableHead>
                <TableHead className='text-right'>الحالة</TableHead>
                <TableHead className='text-left w-37.5'>الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((visit) => (
                <TableRow key={visit.id} className='hover:bg-muted/30 transition-colors'>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    #{visit.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className='font-bold text-foreground'>{visit.patientName}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{getVisitTypeLabel(visit.visitType)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>{getSourceLabel(visit.source)}</Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {visit.serviceName || 'غير محدد'}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {visit.invoice?.amount?.toLocaleString('ar-EG') || '0'} ج.م
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {visit.estimatedDoctorCompensationAmount?.toLocaleString('ar-EG') || '0'} ج.م
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    <div className='flex items-center gap-1.5'>
                      <Clock className='w-3.5 h-3.5' />
                      {format(new Date(visit.startedAt), 'hh:mm a', { locale: ar })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {visit.effectiveStatus === 'Cancelled' ? (
                      <Badge variant='destructive' className='gap-1 px-2 py-0.5'>
                        ملغية
                      </Badge>
                    ) : visit.status === 'Completed' || visit.completedAt ? (
                      <Badge
                        variant='outline'
                        className='bg-emerald-50 text-emerald-600 border-emerald-200 gap-1 px-2 py-0.5'
                      >
                        <CheckCircle2 className='w-3.5 h-3.5' />
                        مكتملة
                      </Badge>
                    ) : (
                      <Badge className='bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 gap-1 px-2 py-0.5'>
                        <Clock className='w-3.5 h-3.5' />
                        قيد الكشف
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-left'>
                    <Button
                      variant={visit.status === 'Completed' || visit.effectiveStatus === 'Cancelled' ? 'ghost' : 'default'}
                      size='sm'
                      asChild
                      className='w-full justify-between'
                    >
                      <Link href={`/${tenantSlug}/dashboard/doctor/visits/${visit.id}`}>
                        {visit.status === 'Completed' || visit.effectiveStatus === 'Cancelled' ? 'عرض التفاصيل' : 'متابعة الكشف'}
                        <ArrowLeft className='w-4 h-4 ml-1' />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardShell>
  )
}
