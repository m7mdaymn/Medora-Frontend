'use server'

import { BaseApiResponse } from '@/types/api'
import { IDoctor } from '@/types/doctor'
import { fetchApi } from '../../lib/fetchApi'

export async function getMeDoctorAction(tenantSlug: string): Promise<BaseApiResponse<IDoctor>> {
  return await fetchApi<IDoctor>(`/api/clinic/doctors/me`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store', 
  })
}
