'use server'

import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'
import { IDoctorVisitConfig } from '@/types/doctor'
import { fetchApi } from '../../lib/fetchApi'

export async function updateVisitFieldsAction(
  tenantSlug: string,
  doctorId: string,
  data: Record<string, boolean>,
): Promise<BaseApiResponse<IDoctorVisitConfig>> {
  const result = await fetchApi<IDoctorVisitConfig>(
    `/api/clinic/doctors/${doctorId}/visit-fields`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
      tenantSlug,
    },
  )

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/doctor`, 'page')
  }

  return result
}
