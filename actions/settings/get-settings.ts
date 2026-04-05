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

export async function getClinicPaymentOptionsAction(
  tenantSlug: string,
): Promise<BaseApiResponse<Record<string, unknown>>> {
  return await fetchApi<Record<string, unknown>>(`/api/clinic/settings/payment-options`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}
