'use client'

import {
  getPatientBookingsAppAction,
  getPatientSelfServiceRequestsAppAction,
} from '@/actions/patient-app/profile'
import { ProfileSwitcher } from '@/components/patient/profile-switcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import {
  Calendar,
  CalendarX,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Hourglass,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import Link from 'next/link'
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

  const { data: selfServiceRes, isLoading: loadingSelfService } = useSWR(
    activeProfileId ? ['patientSelfServiceRequests', tenantSlug, activeProfileId] : null,
    () => getPatientSelfServiceRequestsAppAction(tenantSlug, activeProfileId!),
  )

  const bookings = bookingsRes?.data || []
  const selfServiceRequests = selfServiceRes?.data || []

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

      <div className='flex justify-end'>
        <Button asChild size='sm' className='rounded-full'>
          <Link href={`/${tenantSlug}/patient/request`}>طلب جديد بالدفع الذاتي</Link>
        </Button>
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
              <Button asChild size='sm' variant='outline' className='mt-3'>
                <Link href={`/${tenantSlug}/patient/request`}>ابدأ طلب حجز بالدفع الذاتي</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className='space-y-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
            <ShieldCheck className='w-3.5 h-3.5' />
            متابعة تأكيدات الدفع الذاتي
          </div>
          <Button asChild size='sm' variant='outline'>
            <Link href={`/${tenantSlug}/patient/request`}>طلب جديد</Link>
          </Button>
        </div>

        {loadingSelfService ? (
          <div className='space-y-2'>
            <Skeleton className='h-20 w-full rounded-2xl' />
            <Skeleton className='h-20 w-full rounded-2xl' />
          </div>
        ) : selfServiceRequests.length > 0 ? (
          <div className='grid gap-3'>
            {selfServiceRequests.map((request) => (
              <Card key={request.id} className='rounded-2xl border-border/40 shadow-sm'>
                <CardContent className='p-4 space-y-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <p className='text-sm font-bold'>د. {request.doctorName}</p>
                      <p className='text-[11px] text-muted-foreground'>
                        {request.serviceName || 'خدمة غير محددة'}
                      </p>
                    </div>
                    <SelfServiceStatusBadge status={request.status} />
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-[11px] text-muted-foreground'>
                    <div className='flex items-center gap-1.5'>
                      <Calendar className='w-3.5 h-3.5 text-primary' />
                      {new Date(request.requestedDate).toLocaleDateString('ar-EG')}
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Clock className='w-3.5 h-3.5 text-orange-500' />
                      {request.requestedTime || '--'}
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Hourglass className='w-3.5 h-3.5 text-muted-foreground' />
                      ينتهي: {new Date(request.expiresAt).toLocaleDateString('ar-EG')}
                    </div>
                    <div className='font-bold text-foreground'>
                      المدفوع:{' '}
                      {(request.adjustedPaidAmount ?? request.declaredPaidAmount ?? 0).toLocaleString(
                        'ar-EG',
                      )}{' '}
                      ج.م
                    </div>
                  </div>

                  {(request.convertedQueueTicketId || request.convertedBookingId) && (
                    <div className='rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 text-[11px] font-bold text-primary'>
                      {request.convertedQueueTicketId
                        ? 'تم تحويل الطلب إلى تذكرة عيادة.'
                        : 'تم تحويل الطلب إلى حجز مؤكد.'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className='rounded-2xl border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground'>
            لا توجد طلبات دفع ذاتي حتى الآن.
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

function SelfServiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PendingPaymentReview':
      return (
        <Badge variant='outline' className='text-[10px] font-bold'>
          قيد مراجعة الدفع
        </Badge>
      )
    case 'PaymentApproved':
      return (
        <Badge
          variant='outline'
          className='bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-bold'
        >
          تم اعتماد الدفع
        </Badge>
      )
    case 'ReuploadRequested':
      return (
        <Badge
          variant='outline'
          className='bg-amber-500/5 text-amber-600 border-amber-500/20 text-[10px] font-bold'
        >
          مطلوب إعادة الإثبات
        </Badge>
      )
    case 'ConvertedToQueueTicket':
      return (
        <Badge
          variant='outline'
          className='bg-primary/5 text-primary border-primary/20 text-[10px] font-bold'
        >
          تحول إلى تذكرة
        </Badge>
      )
    case 'ConvertedToBooking':
      return (
        <Badge
          variant='outline'
          className='bg-primary/5 text-primary border-primary/20 text-[10px] font-bold'
        >
          تحول إلى حجز
        </Badge>
      )
    case 'Rejected':
      return (
        <Badge
          variant='outline'
          className='bg-destructive/5 text-destructive border-destructive/20 text-[10px] font-bold'
        >
          مرفوض
        </Badge>
      )
    case 'Expired':
      return (
        <Badge variant='outline' className='text-[10px] font-bold'>
          منتهي الصلاحية
        </Badge>
      )
    default:
      return (
        <Badge variant='outline' className='text-[10px] font-bold'>
          {status}
        </Badge>
      )
  }
}
