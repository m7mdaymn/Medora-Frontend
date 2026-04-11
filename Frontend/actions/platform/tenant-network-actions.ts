'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'
import {
  ICreateTenantNetworkLinkRequest,
  ITenantNetworkLink,
} from '../../types/platform'

export async function getTenantNetworkLinksAction(
  tenantId: string,
): Promise<BaseApiResponse<ITenantNetworkLink[]>> {
  return await fetchApi<ITenantNetworkLink[]>(`/api/platform/tenants/${tenantId}/network`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function linkTenantNetworkAction(
  tenantId: string,
  request: ICreateTenantNetworkLinkRequest,
): Promise<BaseApiResponse<ITenantNetworkLink>> {
  const response = await fetchApi<ITenantNetworkLink>(`/api/platform/tenants/${tenantId}/network`, {
    method: 'POST',
    body: JSON.stringify(request),
  })

  if (response.success) {
    revalidatePath('/admin/tenants')
  }

  return response
}

export async function unlinkTenantNetworkAction(
  linkId: string,
): Promise<BaseApiResponse<unknown>> {
  const response = await fetchApi<unknown>(`/api/platform/tenants/network-links/${linkId}`, {
    method: 'DELETE',
  })

  if (response.success) {
    revalidatePath('/admin/tenants')
  }

  return response
}
