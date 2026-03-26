'use client'

import { getPatientBookingsAppAction } from '@/actions/patient-app/profile'
import { ProfileSwitcher } from '@/components/patient/profile-switcher'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import { Calendar, CalendarX, CheckCircle2, ChevronLeft, Clock, Timer } from 'lucide-react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'

export default function PatientBookingsPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const authData = usePatientAuthStore((state) => state.tenants[tenantSlug])
  const activeProfileId = authData?.activeProfileId

  // جلب الحجوزات بـ SWR
  const { data: bookingsRes, isLoading } = useSWR(
    activeProfileId ? ['patientBookings', tenantSlug, activeProfileId] : null,
    () => getPatientBookingsAppAction(tenantSlug, activeProfileId!),
  )

  const bookings = bookingsRes?.data || []

  if (!activeProfileId) return null

  return (
    <div
      className='max-w-full overflow-x-hidden p-4 pb-24 space-y-6 animate-in fade-in duration-500'
      dir='rtl'
    >
      {/* الهيدر */}
      <div className='flex items-center justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight text-foreground'>حجوزاتي</h2>
          <p className='text-[10px] text-muted-foreground font-medium mt-1'>
            متابعة مواعيد الكشف القادمة والسابقة
          </p>
        </div>
        <div className='shrink-0'>
          <ProfileSwitcher tenantSlug={tenantSlug} />
        </div>
      </div>

      {/* قائمة الحجوزات */}
      <div className='space-y-4'>
        {isLoading ? (
          <div className='space-y-3'>
            <Skeleton className='h-32 w-full rounded-2xl' />
            <Skeleton className='h-32 w-full rounded-2xl' />
            <Skeleton className='h-32 w-full rounded-2xl' />
          </div>
        ) : bookings.length > 0 ? (
          <div className='grid gap-4'>
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className='border-border/40 shadow-sm overflow-hidden rounded-2xl bg-background group hover:border-primary/30 transition-all'
              >
                <CardContent className='p-0'>
                  {/* الجزء العلوي: الحالة والطبيب */}
                  <div className='p-4 flex items-start justify-between'>
                    <div className='flex gap-3'>
                      <div className='w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10'>
                        <Calendar className='w-5 h-5 text-primary' />
                      </div>
                      <div className='flex flex-col gap-0.5'>
                        <p className='font-bold text-sm text-foreground'>د. {booking.doctorName}</p>
                        <p className='text-[11px] text-muted-foreground font-medium'>
                          {booking.serviceName || 'كشف عام'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  {/* الجزء السفلي: الوقت والتاريخ (Vercel Divider Style) */}
                  <div className='bg-muted/20 border-t border-border/40 px-4 py-3 grid grid-cols-2 gap-4'>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <div className='p-1.5 rounded-md bg-background border border-border/40'>
                        <Calendar className='w-3 h-3 text-primary' />
                      </div>
                      <span className='text-[11px] font-bold'>
                        {new Date(booking.bookingDate).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <div className='p-1.5 rounded-md bg-background border border-border/40'>
                        <Clock className='w-3 h-3 text-orange-500' />
                      </div>
                      <span className='text-[11px] font-bold tracking-wider'>
                        {booking.bookingTime}
                      </span>
                    </div>
                  </div>

                  {/* لو الحجز مؤكد وفيه تذكرة، نظهر لينك سريع */}
                  {booking.queueTicketId && (
                    <div className='px-4 py-2 bg-primary/5 border-t border-primary/10 flex items-center justify-between group-hover:bg-primary/10 transition-colors'>
                      <span className='text-[10px] font-bold text-primary flex items-center gap-1'>
                        <Timer className='w-3 h-3' /> تم إصدار تذكرة الحجز
                      </span>
                      <ChevronLeft className='w-3 h-3 text-primary' />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className='flex flex-col items-center justify-center py-20 text-center space-y-4'>
            <div className='w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center'>
              <CalendarX className='w-10 h-10 text-muted-foreground/20' />
            </div>
            <div className='space-y-1'>
              <p className='text-sm font-bold text-muted-foreground'>لا توجد حجوزات مسجلة</p>
              <p className='text-[10px] text-muted-foreground/60 max-w-50'>
                ابدأ بحجز موعد جديد من خلال التواصل مع العيادة
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Confirmed':
      return (
        <Badge
          variant='outline'
          className='bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-bold rounded-full px-2'
        >
          <CheckCircle2 className='w-3 h-3 ml-1' /> مؤكد
        </Badge>
      )
    case 'Cancelled':
      return (
        <Badge
          variant='outline'
          className='bg-destructive/5 text-destructive border-destructive/20 text-[10px] font-bold rounded-full px-2'
        >
          ملغي
        </Badge>
      )
    default:
      return (
        <Badge
          variant='outline'
          className='bg-muted text-muted-foreground border-border/50 text-[10px] font-bold rounded-full px-2'
        >
          {status}
        </Badge>
      )
  }
}
