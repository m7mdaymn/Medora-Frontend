'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { ILabRequest } from '@/types/visit'
import { LabRequestFormInput } from '@/validation/labs'

export async function getLabRequestsByVisitAction(
  tenantSlug: string,
  visitId: string,
): Promise<BaseApiResponse<ILabRequest[]>> {
  return await fetchApi<ILabRequest[]>(`/api/clinic/visits/${visitId}/labs`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function updateLabRequestAction(
  tenantSlug: string,
  visitId: string,
  labId: string,
  data: LabRequestFormInput,
): Promise<BaseApiResponse<ILabRequest>> {
  const response = await fetchApi<ILabRequest>(`/api/clinic/visits/${visitId}/labs/${labId}`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify(data),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
  }

  return response
}

export async function addLabResultAction(
  tenantSlug: string,
  visitId: string,
  labId: string,
  payload: {
    resultSummary: string
    resultData?: string
    notes?: string
  },
): Promise<BaseApiResponse<ILabRequest>> {
  const response = await fetchApi<ILabRequest>(`/api/clinic/visits/${visitId}/labs/${labId}/result`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
  }

  return response
}
