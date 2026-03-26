'use server'

import { fetchApi } from '../../lib/fetchApi'
import { IChronicConditions } from '../../types/patient'

export async function getChronicConditionsAction(patientId: string, tenantSlug: string) {
  return await fetchApi<IChronicConditions>(
    `/api/clinic/patients/${patientId}/chronic-conditions`,
    {
      method: 'GET',
      tenantSlug,
      authType: 'staff',
    },
  )
}
