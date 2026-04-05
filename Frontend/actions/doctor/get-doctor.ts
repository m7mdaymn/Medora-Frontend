'use server'

import { BaseApiResponse } from '@/types/api'
import { IDoctor } from '@/types/doctor'
import { fetchApi } from '../../lib/fetchApi'

export async function getDoctorAction(
  tenantSlug: string,
  doctorId: string,
): Promise<BaseApiResponse<IDoctor>> {
  return await fetchApi<IDoctor>(`/api/clinic/doctors/${doctorId}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function getMyDoctorProfileAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IDoctor>> {
  return await fetchApi<IDoctor>(`/api/clinic/doctors/me`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function updateDoctorServicesAction(
  tenantSlug: string,
  doctorId: string,
  clinicServiceIds: string[],
) {
  return await fetchApi<IDoctor>(`/api/clinic/doctors/${doctorId}/services`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify({ clinicServiceIds }),
  })
}
