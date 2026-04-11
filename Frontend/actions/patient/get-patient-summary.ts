'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IPatientSummary } from '../../types/patient-app'

export interface IRecentVisit {
  id: string
  doctorName: string
  complaint: string | null
  diagnosis: string | null
  startedAt: string
  completedAt: string | null
}



export async function getPatientSummaryAction(
  tenantSlug: string,
  patientId: string,
): Promise<BaseApiResponse<IPatientSummary>> {
  return await fetchApi<IPatientSummary>(`/api/clinic/patients/${patientId}/summary`, {
    tenantSlug,
    cache: 'no-store',
  })
}
