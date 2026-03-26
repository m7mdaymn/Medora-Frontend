import { PermissionGate } from '@/components/auth/permission-gate'
import { Typography } from '@/components/ui/typography'
import { ROLES } from '@/config/roles'

import { getPatientsAction } from '../../../../../actions/patient/getPatients'
import { GenericPagination } from '../../../../../components/shared/pagination'
import { DashboardHeader, DashboardShell } from '../../../../../components/shell'
import { AddPatientModal } from './add-patient-modal'
import { PatientsList } from './patient-list'
import { PatientSearch } from './patient-search'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PatientsPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params
  const queryParams = await searchParams
  const currentPage = Number(queryParams.page) || 1
  const search = (queryParams.search as string) || ''

  const response = await getPatientsAction(tenantSlug, currentPage, 10, search)

  const pagination = {
    pageNumber: response?.pageNumber || 1,
    totalPages: response?.totalPages || 1,
    hasNextPage: response?.hasNextPage || false,
    hasPreviousPage: response?.hasPreviousPage || false,
  }

  return (
    <DashboardShell>
      <DashboardHeader heading='سجل المرضى' text='إدارة بيانات المرضى والبحث المتقدم داخل العيادة'>
        <PermissionGate
          allowedRoles={[ROLES.CLINIC_OWNER, ROLES.CLINIC_MANAGER, ROLES.SUPER_ADMIN,'Receptionist']}
        >
          <AddPatientModal tenantSlug={tenantSlug}/>
        </PermissionGate>
      </DashboardHeader>

      <div className='space-y-4'>
        <div className='flex w-full max-w-sm items-center space-x-2'>
          <PatientSearch />
        </div>

        <PermissionGate
          allowedRoles={[ROLES.CLINIC_OWNER, ROLES.CLINIC_MANAGER, ROLES.SUPER_ADMIN, ROLES.DOCTOR,'Receptionist']}
          fallback={
            <div className='flex h-100 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20'>
              <Typography variant='muted'>عذراً، لا تملك صلاحية عرض السجلات.</Typography>
            </div>
          }
        >
          <PatientsList data={response.items || []} />

          <div className='mt-4 flex justify-end'>
            {/* 4. باصينا الـ totalCount اللي طلعناه من الـ data */}
            <GenericPagination
              currentPage={pagination.pageNumber}
              totalPages={pagination.totalPages}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
            />
          </div>
        </PermissionGate>
      </div>
    </DashboardShell>
  )
}
