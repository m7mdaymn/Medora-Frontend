'use client'

import {
  getPatientQueueTicketAppAction,
  getPatientSummaryAppAction,
} from '@/actions/patient-app/profile'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import { Activity, AlertCircle, CalendarDays, Clock, FileText, Ticket, Users } from 'lucide-react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { ProfileSwitcher } from '../../../../components/patient/profile-switcher'

export default function PatientHomePage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const authData = usePatientAuthStore((state) => state.tenants[tenantSlug])
  const activeProfileId = authData?.activeProfileId

  const { data: summaryRes, isLoading: loadingSummary } = useSWR(
    activeProfileId ? ['patientSummary', tenantSlug, activeProfileId] : null,
    () => getPatientSummaryAppAction(tenantSlug, activeProfileId!),
  )

  const { data: ticketRes, isLoading: loadingTicket } = useSWR(
    activeProfileId ? ['patientTicket', tenantSlug, activeProfileId] : null,
    () => getPatientQueueTicketAppAction(tenantSlug, activeProfileId!),
    { refreshInterval: 10000 },
  )

  const summary = summaryRes?.data
  const ticket = ticketRes?.data

  if (!activeProfileId) return null // أو Placeholder للملف الشخصي

  return (
    <div className='max-w-full overflow-x-hidden p-4 pb-24 space-y-8 animate-in fade-in duration-500'>
      {/* هيدر محمي من السكرول */}
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-2xl font-bold tracking-tight text-foreground truncate'>الرئيسية</h2>
        <div className='shrink-0'>
          <ProfileSwitcher tenantSlug={tenantSlug} />
        </div>
      </div>

      {/* التذكرة النشطة أو الـ Placeholder */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-muted-foreground flex items-center gap-2'>
          <Ticket className='w-4 h-4' /> تذكرة العيادة الحالية
        </h3>

        {loadingTicket ? (
          <Skeleton className='h-48 w-full rounded-2xl' />
        ) : ticket ? (
          <Card className='border-border/50 shadow-sm overflow-hidden bg-background rounded-2xl'>
            <div className='flex flex-col'>
              <div className='flex items-center justify-around py-8 px-4'>
                <div className='flex flex-col items-center gap-1.5'>
                  <span className='text-[10px] font-bold text-muted-foreground uppercase'>
                    دورك
                  </span>
                  <span className='text-5xl font-black tracking-tighter text-foreground'>
                    {ticket.myQueueNumber || ticket.ticketNumber}
                  </span>
                </div>
                <div className='w-px h-12 bg-border/40' />
                <div className='flex flex-col items-center gap-1.5'>
                  <span className='text-[10px] font-bold text-muted-foreground uppercase'>
                    الحالي
                  </span>
                  <span className='text-5xl font-black tracking-tighter text-primary'>
                    {ticket.currentServingNumber || '--'}
                  </span>
                </div>
              </div>

              <div className='bg-muted/30 border-t border-border/40 p-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <Badge
                    variant={ticket.isUrgent ? 'destructive' : 'secondary'}
                    className='rounded-full px-3'
                  >
                    {ticket.status === 'Called'
                      ? 'تفضل بالدخول'
                      : ticket.status === 'Waiting'
                        ? 'في الانتظار'
                        : 'في الكشف'}
                  </Badge>
                  <span className='text-[11px] font-bold text-muted-foreground truncate max-w-37.5'>
                    د. {ticket.doctorName}
                  </span>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='bg-background border border-border/40 rounded-xl p-2.5 flex items-center gap-2'>
                    <Users className='w-3.5 h-3.5 text-primary' />
                    <span className='text-xs font-bold uppercase'>
                      أمامك: {ticket.patientsAheadCount || 0}
                    </span>
                  </div>
                  <div className='bg-background border border-border/40 rounded-xl p-2.5 flex items-center gap-2'>
                    <Clock className='w-3.5 h-3.5 text-orange-500' />
                    <span className='text-xs font-bold truncate'>
                      {ticket.estimatedWaitText || '...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          /* Placeholder في حالة عدم وجود تذكرة */
          <Card className='border-dashed border-border/60 bg-muted/5 shadow-none rounded-2xl'>
            <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
              <div className='w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3'>
                <AlertCircle className='w-6 h-6 text-muted-foreground/40' />
              </div>
              <p className='text-sm font-bold text-muted-foreground/60'>
                لا توجد تذاكر حجز نشطة حالياً
              </p>
              <p className='text-[10px] text-muted-foreground/40 mt-1'>
                يمكنك الحجز من خلال زيارة العيادة
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ملخص الزيارات */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between px-1'>
          <h3 className='text-sm font-bold text-muted-foreground flex items-center gap-2'>
            <Activity className='w-4 h-4' /> آخر الزيارات
          </h3>
          <span className='text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full'>
            {summary?.totalVisits || 0} زيارة
          </span>
        </div>

        {loadingSummary ? (
          <div className='space-y-3'>
            <Skeleton className='h-20 w-full rounded-2xl' />
            <Skeleton className='h-20 w-full rounded-2xl' />
          </div>
        ) : summary?.recentVisits?.length ? (
          <Card className='border-border/40 shadow-sm overflow-hidden rounded-2xl'>
            <div className='divide-y divide-border/40'>
              {summary.recentVisits.map((visit) => (
                <div
                  key={visit.id}
                  className='p-4 hover:bg-muted/10 transition-colors flex items-center justify-between'
                >
                  <div className='flex flex-col gap-1'>
                    <p className='font-bold text-sm'>د. {visit.doctorName}</p>
                    <div className='flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium'>
                      <CalendarDays className='w-3 h-3' />
                      {new Date(visit.startedAt).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                  <Badge variant='outline' className='text-[10px] font-bold border-border/60'>
                    {visit.diagnosis ? 'تم التشخيص' : 'كشف'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className='border-dashed border-border/60 bg-transparent shadow-none rounded-2xl'>
            <CardContent className='flex flex-col items-center justify-center py-10 text-muted-foreground'>
              <FileText className='w-8 h-8 mb-2 opacity-20' />
              <p className='text-xs font-bold'>لا توجد زيارات سابقة</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
