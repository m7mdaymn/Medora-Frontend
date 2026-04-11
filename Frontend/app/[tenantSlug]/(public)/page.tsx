import { IPublicClinic, IPublicDoctor, IPublicWorkingHour } from '@/types/public'
import { notFound } from 'next/navigation'
import AboutClinicSection from '../../../components/clinic-landing-page-template/AboutClinicSection'
import AboutDoctorSection from '../../../components/clinic-landing-page-template/AboutDoctorSection'
import ClinicStandardsSection from '../../../components/clinic-landing-page-template/ClinicStandardsSection' // <-- الجديد
import DoctorsSection from '../../../components/clinic-landing-page-template/DoctorsSection'
import Footer from '../../../components/clinic-landing-page-template/Footer'
import Hero from '../../../components/clinic-landing-page-template/Hero'
import { Navbar } from '../../../components/clinic-landing-page-template/navbar'
import WorkingHoursSection from '../../../components/clinic-landing-page-template/WorkingHoursSection'
import { fetchApi } from '../../../lib/fetchApi'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
}

export default async function Page({ params }: PageProps) {
  const { tenantSlug } = await params

  const [clinicRes, doctorsRes, workingHoursRes] = await Promise.all([
    fetchApi<IPublicClinic>(`/api/public/${tenantSlug}/clinic`),
    fetchApi<IPublicDoctor[]>(`/api/public/${tenantSlug}/doctors`),
    fetchApi<IPublicWorkingHour[]>(`/api/public/${tenantSlug}/working-hours`),
  ])

  if (!clinicRes.success || !clinicRes.data) {
    return notFound()
  }

  const clinic = clinicRes.data
  const enabledDoctors = doctorsRes.data?.filter((d) => d.isEnabled) || []
  const activeWorkingHours = workingHoursRes.data?.filter((w) => w.isActive) || []

  return (
    <main className='relative flex min-h-screen w-full flex-col bg-background'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,hsl(var(--primary)/0.12),transparent_36%),radial-gradient(circle_at_85%_20%,hsl(var(--primary)/0.08),transparent_28%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.25)_40%,hsl(var(--background))_100%)]' />
      <Navbar clinic={clinic} tenantSlug={tenantSlug} />
      <Hero clinic={clinic} tenantSlug={tenantSlug} />

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
