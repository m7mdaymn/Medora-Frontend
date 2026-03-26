'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'
import { IDoctor } from '../../types/doctor'

export async function toggleDoctorStatusAction(
  doctorId: string,
  tenantSlug: string,
  isCurrentlyEnabled: boolean,
): Promise<BaseApiResponse<IDoctor>> {
  const endpoint = isCurrentlyEnabled
    ? `/api/clinic/doctors/${doctorId}/disable`
    : `/api/clinic/doctors/${doctorId}/enable`

  const response = await fetchApi<IDoctor>(endpoint, {
    method: 'POST',
    tenantSlug,
    authType:'staff'
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/doctors`) 
  }

  return response
}
