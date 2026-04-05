'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IPatient } from '@/types/patient'

export async function getPatientAction(
	tenantSlug: string,
	patientId: string,
): Promise<BaseApiResponse<IPatient>> {
	return await fetchApi<IPatient>(`/api/clinic/patients/${patientId}`, {
		method: 'GET',
		tenantSlug,
		cache: 'no-store',
	})
}
