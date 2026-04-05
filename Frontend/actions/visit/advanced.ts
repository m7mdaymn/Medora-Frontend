'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import { IPatient } from '@/types/patient'

export async function getMyVisitPatientsAction(
  tenantSlug: string,
  params: { pageNumber?: number; pageSize?: number; search?: string } = {},
): Promise<BaseApiResponse<IPaginatedData<IPatient>>> {
  const search = new URLSearchParams()
  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.search) search.set('search', params.search)
  const query = search.toString()

  return await fetchApi<IPaginatedData<IPatient>>(
    `/api/clinic/visits/my/patients${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function getStaleOpenVisitsAction(
  tenantSlug: string,
  olderThanHours: number = 12,
): Promise<BaseApiResponse<Array<Record<string, unknown>>>> {
  return await fetchApi<Array<Record<string, unknown>>>(
    `/api/clinic/visits/maintenance/stale-open?olderThanHours=${olderThanHours}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function closeStaleVisitAction(
  tenantSlug: string,
  visitId: string,
  payload?: { markTicketNoShow?: boolean; notes?: string },
): Promise<BaseApiResponse<Record<string, unknown>>> {
  return await fetchApi<Record<string, unknown>>(`/api/clinic/visits/maintenance/${visitId}/close`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload || {}),
  })
}

export async function recordVisitInventoryUsageAction(
  tenantSlug: string,
  visitId: string,
  payload: {
    inventoryItemId: string
    quantity: number
    notes?: string
  },
): Promise<BaseApiResponse<Record<string, unknown>>> {
  return await fetchApi<Record<string, unknown>>(`/api/clinic/visits/${visitId}/inventory-usage`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })
}
