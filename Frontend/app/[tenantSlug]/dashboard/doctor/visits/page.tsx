import { getMyTodayVisitsAction } from '@/actions/doctor/get-my-today-visits'
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

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function DoctorVisitsPage({ params }: Props) {
  const { tenantSlug } = await params

  // جلب الزيارات باستخدام الأكشن الجديد
  const res = await getMyTodayVisitsAction(tenantSlug)
  const visits = res.success && res.data ? res.data : []

  return (
    <DashboardShell>
      <DashboardHeader
        heading='زيارات اليوم'
        text={`قائمة الحالات التي قمت بالكشف عليها اليوم - ${format(new Date(), 'dd MMMM yyyy', {
          locale: ar,
        })}`}
      />

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
                  <TableCell className='text-sm text-muted-foreground'>
                    <div className='flex items-center gap-1.5'>
                      <Clock className='w-3.5 h-3.5' />
                      {format(new Date(visit.startedAt), 'hh:mm a', { locale: ar })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {visit.status === 'Completed' || visit.completedAt ? (
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
                      variant={visit.status === 'Completed' ? 'ghost' : 'default'}
                      size='sm'
                      asChild
                      className='w-full justify-between'
                    >
                      <Link href={`/${tenantSlug}/dashboard/doctor/visits/${visit.id}`}>
                        {visit.status === 'Completed' ? 'عرض الروشتة' : 'متابعة الكشف'}
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
