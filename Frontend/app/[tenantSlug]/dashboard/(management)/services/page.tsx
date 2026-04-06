import { getDoctorsAction } from '@/actions/doctor/get-doctors'
import { getClinicServicesAction } from '@/actions/service/clinic-services'
import { getDoctorLinksAction } from '@/actions/service/doctor-services'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { ServicesMasterView } from './services-master-view'
import { AddServiceModal } from './add-service-modal'

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function ServicesPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const resolvedSearchParams = await searchParams

  const page = Number(resolvedSearchParams.page) || 1
  const urlDoctorId = resolvedSearchParams.doctorId 

  const [doctorsResponse, catalogResponse] = await Promise.all([
    getDoctorsAction(tenantSlug),
    getClinicServicesAction(tenantSlug, page, 20),
  ])

  const doctors = doctorsResponse.doctors || []

  const effectiveDoctorId = urlDoctorId || (doctors.length > 0 ? doctors[0].id : undefined)


  const currentLinks = effectiveDoctorId
    ? await getDoctorLinksAction(tenantSlug, effectiveDoctorId)
    : []

  return (
    <DashboardShell>
      <DashboardHeader
        heading='إدارة الخدمات'
        text='تحكم في الكتالوج المركزي للعيادة، وقم بتخصيص أسعار الأطباء من مكان واحد.'
      >
        <AddServiceModal tenantSlug={tenantSlug} />
      </DashboardHeader>

      <ServicesMasterView
        tenantSlug={tenantSlug}
        paginatedCatalog={catalogResponse}
        doctors={doctors}
        currentLinks={currentLinks}
        selectedDoctorId={effectiveDoctorId}
        defaultTab={resolvedSearchParams.tab || 'catalog'}
      />
    </DashboardShell>
  )
}
