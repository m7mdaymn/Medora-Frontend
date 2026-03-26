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
  const doctorId = resolvedSearchParams.doctorId

  // جلب الداتا الأساسية بالتوازي (أداء أسرع)
  const [doctorsResponse, catalogResponse] = await Promise.all([
    getDoctorsAction(tenantSlug),
    getClinicServicesAction(tenantSlug, page, 20),
  ])

  // لو فيه دكتور مختار في الـ URL، هات خدماته المربوطة
  const currentLinks = doctorId ? await getDoctorLinksAction(tenantSlug, doctorId) : []

  return (
    <DashboardShell>
      <DashboardHeader
        heading='إدارة الخدمات'
        text='تحكم في الكتالوج المركزي للعيادة، وقم بتخصيص أسعار الأطباء من مكان واحد.'
      >
        <AddServiceModal tenantSlug={tenantSlug}/>
      </DashboardHeader>

      {/* 🔴 ده الكومبوننت اللي هيلم الليلة كلها */}
      <ServicesMasterView
        tenantSlug={tenantSlug}
        paginatedCatalog={catalogResponse}
        doctors={doctorsResponse.doctors}
        currentLinks={currentLinks}
        selectedDoctorId={doctorId}
        defaultTab={resolvedSearchParams.tab || 'catalog'}
      />
    </DashboardShell>
  )
}
