'use server'

import { BaseApiResponse } from '@/types/api'
import { fetchApi } from '../../lib/fetchApi'
import { IChronicConditions } from '../../types/patient'

export async function updateChronicConditionsAction(
  patientId: string,
  data: IChronicConditions,
  tenantSlug: string,
): Promise<BaseApiResponse<IChronicConditions>> {
  return await fetchApi<IChronicConditions>(
    `/api/clinic/patients/${patientId}/chronic-conditions`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
      tenantSlug,
      authType: 'staff',
    },
  )
}
