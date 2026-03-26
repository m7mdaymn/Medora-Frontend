'use server'

import { BaseApiResponse } from '@/types/api'
import { IDoctorVisitConfig } from '@/types/doctor'
import { fetchApi } from '../../lib/fetchApi'

export async function getMyVisitFieldsAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IDoctorVisitConfig>> {
  return await fetchApi<IDoctorVisitConfig>(`/api/clinic/doctors/me/visit-fields`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}
