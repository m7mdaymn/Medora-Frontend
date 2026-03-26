'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'

export interface IRecentVisit {
  id: string
  doctorName: string
  complaint: string | null
  diagnosis: string | null
  startedAt: string
  completedAt: string | null
}

export interface IPatientSummary {
  patientId: string
  name: string
  phone: string
  dateOfBirth: string | null
  gender: string
  totalVisits: number
  recentVisits: IRecentVisit[]
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
