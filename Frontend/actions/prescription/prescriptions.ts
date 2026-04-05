'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IPrescription } from '@/types/visit'

export async function listVisitPrescriptionsAction(
  tenantSlug: string,
  visitId: string,
): Promise<BaseApiResponse<IPrescription[]>> {
  return await fetchApi<IPrescription[]>(`/api/clinic/visits/${visitId}/prescriptions`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function getPrescriptionRevisionsAction(
  tenantSlug: string,
  visitId: string,
  prescriptionId: string,
): Promise<BaseApiResponse<Array<Record<string, unknown>>>> {
  return await fetchApi<Array<Record<string, unknown>>>(
    `/api/clinic/visits/${visitId}/prescriptions/${prescriptionId}/revisions`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}
