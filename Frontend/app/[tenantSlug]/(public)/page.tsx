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
  const branches = landingRes.data?.branches || []

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

  const galleryImages =
    clinic.galleryImageUrls && clinic.galleryImageUrls.length > 0
      ? clinic.galleryImageUrls
      : clinic.imgUrl
        ? [clinic.imgUrl]
        : []

  return (
    <main className='relative flex min-h-screen w-full flex-col bg-background'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,hsl(var(--primary)/0.12),transparent_36%),radial-gradient(circle_at_85%_20%,hsl(var(--primary)/0.08),transparent_28%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.25)_40%,hsl(var(--background))_100%)]' />
      <Navbar clinic={clinic} tenantSlug={tenantSlug} />
      <Hero clinic={clinic} tenantSlug={tenantSlug} />

      <section className='container mx-auto px-4 md:px-6 py-4'>
        <div className='rounded-2xl border border-border/40 bg-background/60 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3'>
          <div className='text-sm text-muted-foreground'>
            الخدمات المنشورة: <span className='font-bold text-foreground'>{servicesCount}</span> •
            المنتجات: <span className='font-bold text-foreground'>{productsCount}</span> • الفروع:{' '}
            <span className='font-bold text-foreground'>{branches.length}</span> • وسائل الدفع:{' '}
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

      {galleryImages.length > 0 && (
        <section className='container mx-auto px-4 md:px-6 py-3'>
          <div className='rounded-2xl border border-border/40 bg-background/60 p-4'>
            <p className='text-sm font-semibold mb-3'>صور العيادة</p>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              {galleryImages.slice(0, 8).map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className='relative h-28 overflow-hidden rounded-xl border border-border/50 bg-muted/20'
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={`clinic-gallery-${index + 1}`} className='h-full w-full object-cover' />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {branches.length > 0 && (
        <section className='container mx-auto px-4 md:px-6 py-3'>
          <div className='rounded-2xl border border-border/40 bg-background/60 p-4 md:p-5 space-y-3'>
            <h2 className='text-lg font-bold'>فروع العيادة</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
              {branches.map((branch) => (
                <div key={branch.id} className='rounded-xl border border-border/50 p-4 bg-muted/10 space-y-2'>
                  <p className='font-semibold'>{branch.name}</p>
                  {branch.address && <p className='text-sm text-muted-foreground'>{branch.address}</p>}
                  {branch.phone && <p className='text-sm text-muted-foreground'>{branch.phone}</p>}
                  <div className='pt-1'>
                    <Link
                      href={`/${tenantSlug}/payment-options?branchId=${branch.id}`}
                      className='text-sm font-medium text-primary underline-offset-4 hover:underline'
                    >
                      عرض وسائل الدفع لهذا الفرع
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
