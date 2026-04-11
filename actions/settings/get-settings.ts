'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IClinicPaymentOptions, IClinicSettings } from '@/types/settings'
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
  branchId?: string,
): Promise<BaseApiResponse<IClinicPaymentOptions>> {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''
  return await fetchApi<IClinicPaymentOptions>(`/api/clinic/settings/payment-options${query}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}
