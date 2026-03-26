import { getBookingsAction } from '@/actions/booking/get-booking'
import { getDoctorsAction } from '@/actions/doctor/get-doctors'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import { AppointmentsView } from './appointments-view'
import { BookingModal } from './booking-modal'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AppointmentsPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params
  const resolvedSearchParams = await searchParams

  const view = (resolvedSearchParams.view as string) || 'table'
  const page = Number(resolvedSearchParams.page) || 1

  // 🔥 السحر هنا: لو كاليندر هات 500 حجز عشان تملى الشاشة، لو جدول هات 10 بس
  const pageSize = view === 'calendar' ? 500 : 10

  const [doctorsData, bookingsData] = await Promise.all([
    getDoctorsAction(tenantSlug),
    getBookingsAction(tenantSlug, page, pageSize),
  ])

  const doctorsList = doctorsData.doctors || []

  // هنباصي الداتا كلها مش بس الـ items عشان الباجينيشن يشتغل
  return (
    <DashboardShell>
      <DashboardHeader heading='أجندة المواعيد' text='عرض وجدولة المواعيد الخاصة بالعيادة.'>
        <BookingModal doctors={doctorsList} />
      </DashboardHeader>

      <Suspense
        fallback={
          <div className='flex justify-center p-10'>
            <Loader2 className='animate-spin' />
          </div>
        }
      >
        <AppointmentsView paginatedData={bookingsData} currentView={view} />
      </Suspense>
    </DashboardShell>
  )
}
