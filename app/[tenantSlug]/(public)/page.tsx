import {
  getPublicDoctorsAction,
  getPublicDoctorsAvailableNowAction,
  getPublicLandingAction,
  getPublicPaymentOptionsAction,
  getPublicServicesAction,
  getPublicWorkingHoursAction,
} from '@/actions/public/landing'
import { IPublicClinic, IPublicDoctor } from '@/types/public'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AboutClinicSection from '../../../components/clinic-landing-page-template/AboutClinicSection'
import AboutDoctorSection from '../../../components/clinic-landing-page-template/AboutDoctorSection'
import ClinicStandardsSection from '../../../components/clinic-landing-page-template/ClinicStandardsSection' // <-- الجديد
import DoctorsSection from '../../../components/clinic-landing-page-template/DoctorsSection'
import Footer from '../../../components/clinic-landing-page-template/Footer'
import Hero from '../../../components/clinic-landing-page-template/Hero'
import { Navbar } from '../../../components/clinic-landing-page-template/navbar'
import WorkingHoursSection from '../../../components/clinic-landing-page-template/WorkingHoursSection'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
}

export default async function Page({ params }: PageProps) {
  const { tenantSlug } = await params

  const [landingRes, doctorsRes, availableNowRes, servicesRes, paymentOptionsRes, workingHoursRes] =
    await Promise.all([
      getPublicLandingAction(tenantSlug),
      getPublicDoctorsAction(tenantSlug),
      getPublicDoctorsAvailableNowAction(tenantSlug),
      getPublicServicesAction(tenantSlug),
      getPublicPaymentOptionsAction(tenantSlug),
      getPublicWorkingHoursAction(tenantSlug),
    ])

  const clinicRes = {
    success: landingRes.success,
    data: (landingRes.data?.clinic as IPublicClinic | null) || null,
  }

  const landingDoctors = landingRes.data?.doctorsAvailableNow || []
  const allDoctors = doctorsRes.data || []
  const availableNowDoctors = availableNowRes.data || []

  const mergedDoctors: IPublicDoctor[] =
    allDoctors.length > 0 ? allDoctors : landingDoctors.length > 0 ? landingDoctors : availableNowDoctors

  const servicesCount = servicesRes.data?.length || landingRes.data?.featuredServices.length || 0
  const paymentMethodsCount =
    paymentOptionsRes.data?.methods.length || landingRes.data?.paymentMethods.length || 0
  const productsCount = landingRes.data?.featuredProducts.length || 0

  const doctorsResponseLike = {
    data: mergedDoctors,
  }

  const workingHoursResponseLike = {
    data: workingHoursRes.data,
  }

  const [clinic, enabledDoctors, activeWorkingHours] = [
    clinicRes.data,
    doctorsResponseLike.data?.filter((doctor) => doctor.isEnabled) || [],
    workingHoursResponseLike.data?.filter((workingHour) => workingHour.isActive) || [],
  ]

  if (!clinicRes.success || !clinic) {
    return notFound()
  }

  return (
    <main className='relative flex min-h-screen w-full flex-col '>
      <Navbar clinic={clinic} tenantSlug={tenantSlug} />
      <Hero clinic={clinic} tenantSlug={tenantSlug} />

      <section className='container mx-auto px-4 md:px-6 py-4'>
        <div className='rounded-2xl border border-border/40 bg-background/60 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3'>
          <div className='text-sm text-muted-foreground'>
            الخدمات المنشورة: <span className='font-bold text-foreground'>{servicesCount}</span> •
            المنتجات: <span className='font-bold text-foreground'>{productsCount}</span> • وسائل الدفع:{' '}
            <span className='font-bold text-foreground'>{paymentMethodsCount}</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button asChild variant='outline' size='sm'>
              <Link href={`/${tenantSlug}/services`}>الخدمات</Link>
            </Button>
            <Button asChild variant='outline' size='sm'>
              <Link href={`/${tenantSlug}/marketplace`}>المتجر</Link>
            </Button>
            <Button asChild variant='outline' size='sm'>
              <Link href={`/${tenantSlug}/payment-options`}>وسائل الدفع</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* قسم عن العيادة */}
      <AboutClinicSection clinic={clinic} />

      {/* رحلة المريض (جينيريك وممتاز للـ UX) */}
      <ClinicStandardsSection />

      {/* قسم الأطباء */}
      {enabledDoctors.length === 1 ? (
        <AboutDoctorSection doctor={enabledDoctors[0]} />
      ) : enabledDoctors.length > 1 ? (
        <DoctorsSection doctors={enabledDoctors} />
      ) : null}

      {/* مواعيد العمل */}
      {activeWorkingHours.length > 0 && <WorkingHoursSection workingHours={activeWorkingHours} />}

      {/* الكول تو أكشن الختامي قبل الفوتر مباشرة */}
      {/* <FinalCtaSection tenantSlug={tenantSlug} /> */}

      <Footer clinic={clinic} tenantSlug={tenantSlug} />
    </main>
  )
}
