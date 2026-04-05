'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPaginatedData } from '@/types/api'
import { IPartnerOrder, IPartnerServiceCatalogItem, IPartnerUser } from '@/types/partner'

type PartnerOrderListParams = {
  pageNumber?: number
  pageSize?: number
  status?: string
  partnerId?: string
  branchId?: string
}

function toQueryString(params: PartnerOrderListParams): string {
  const search = new URLSearchParams()

  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.status) search.set('status', params.status)
  if (params.partnerId) search.set('partnerId', params.partnerId)
  if (params.branchId) search.set('branchId', params.branchId)

  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listPartnerOrdersAction(
  tenantSlug: string,
  params: PartnerOrderListParams = {},
) {
  const query = toQueryString(params)

  return await fetchApi<IPaginatedData<IPartnerOrder>>(`/api/clinic/partner-orders${query}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function acceptPartnerOrderAction(tenantSlug: string, orderId: string, notes?: string) {
  return await fetchApi<IPartnerOrder>(`/api/clinic/partner-orders/${orderId}/accept`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({ notes: notes || null }),
  })
}

export async function schedulePartnerOrderAction(
  tenantSlug: string,
  orderId: string,
  scheduledAt: string,
  notes?: string,
) {
  return await fetchApi<IPartnerOrder>(`/api/clinic/partner-orders/${orderId}/schedule`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({ scheduledAt, notes: notes || null }),
  })
}

export async function markPartnerOrderArrivedAction(
  tenantSlug: string,
  orderId: string,
  arrivedAt?: string,
  notes?: string,
) {
  return await fetchApi<IPartnerOrder>(`/api/clinic/partner-orders/${orderId}/arrived`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({ arrivedAt: arrivedAt || null, notes: notes || null }),
  })
}

export async function uploadPartnerResultAction(
  tenantSlug: string,
  orderId: string,
  payload: {
    resultSummary: string
    finalCost?: number
    externalReference?: string
    notes?: string
    resultUploadedAt?: string
  },
) {
  return await fetchApi<IPartnerOrder>(`/api/clinic/partner-orders/${orderId}/result`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })
}

export async function listPartnerServicesAction(
  tenantSlug: string,
  params: { partnerId?: string; branchId?: string; activeOnly?: boolean } = {},
) {
  const search = new URLSearchParams()

  if (params.partnerId) search.set('partnerId', params.partnerId)
  if (params.branchId) search.set('branchId', params.branchId)
  if (typeof params.activeOnly === 'boolean') search.set('activeOnly', String(params.activeOnly))

  const query = search.toString()

  return await fetchApi<IPartnerServiceCatalogItem[]>(
    `/api/clinic/partners/services${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function createPartnerServiceAction(
  tenantSlug: string,
  payload: {
    partnerId: string
    branchId?: string
    serviceName: string
    price: number
    settlementTarget: 'Doctor' | 'Clinic'
    settlementPercentage: number
    clinicDoctorSharePercentage?: number
    notes?: string
  },
) {
  return await fetchApi<IPartnerServiceCatalogItem>(`/api/clinic/partners/services`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })
}

export async function createPartnerUserAction(
  tenantSlug: string,
  partnerId: string,
  payload: {
    username: string
    password: string
    displayName: string
    phone?: string
    isPrimary?: boolean
  },
) {
  return await fetchApi<IPartnerUser>(`/api/clinic/partners/${partnerId}/users`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })
}
