'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IClinicSettings } from '@/types/settings'
import { BaseApiResponse } from '../../types/api'

export async function getClinicSettings(
  tenantSlug: string,
): Promise<BaseApiResponse<IClinicSettings>> {
  return await fetchApi<IClinicSettings>(`/api/clinic/settings`, {
    method: 'GET',
    tenantSlug,
  })
}
