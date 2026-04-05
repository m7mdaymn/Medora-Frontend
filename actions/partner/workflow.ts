'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPaginatedData } from '@/types/api'
import { revalidatePath } from 'next/cache'
import {
  ICreatePartnerContractPayload,
  ICreatePartnerServicePayload,
  ICreatePartnerPayload,
  IPartner,
  IPartnerContract,
  IPartnerOrder,
  IPartnerServiceCatalogItem,
  IPartnerUser,
  IUpdatePartnerContractPayload,
  IUpdatePartnerServicePayload,
  IUpdatePartnerPayload,
} from '@/types/partner'

type PartnerOrderListParams = {
  pageNumber?: number
  pageSize?: number
  status?: string
  partnerType?: string
  partnerId?: string
  branchId?: string
  fromDate?: string
  toDate?: string
}

type PartnerListParams = {
  type?: string
  activeOnly?: boolean
  pageNumber?: number
  pageSize?: number
}

function toQueryString(params: PartnerOrderListParams): string {
  const search = new URLSearchParams()

  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.status) search.set('status', params.status)
  if (params.partnerType) search.set('partnerType', params.partnerType)
  if (params.partnerId) search.set('partnerId', params.partnerId)
  if (params.branchId) search.set('branchId', params.branchId)
  if (params.fromDate) search.set('fromDate', params.fromDate)
  if (params.toDate) search.set('toDate', params.toDate)

  const query = search.toString()
  return query ? `?${query}` : ''
}

function toPartnerQueryString(params: PartnerListParams): string {
  const search = new URLSearchParams()

  if (params.type) search.set('type', params.type)
  if (typeof params.activeOnly === 'boolean') search.set('activeOnly', String(params.activeOnly))
  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))

  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listPartnersAction(tenantSlug: string, params: PartnerListParams = {}) {
  const query = toPartnerQueryString(params)

  return await fetchApi<IPaginatedData<IPartner>>(`/api/clinic/partners${query}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function createPartnerAction(tenantSlug: string, payload: ICreatePartnerPayload) {
  const response = await fetchApi<IPartner>('/api/clinic/partners', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/contracts`)
  }

  return response
}

export async function updatePartnerAction(
  tenantSlug: string,
  partnerId: string,
  payload: IUpdatePartnerPayload,
) {
  const response = await fetchApi<IPartner>(`/api/clinic/partners/${partnerId}`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/contracts`)
  }

  return response
}

export async function setPartnerActivationAction(
  tenantSlug: string,
  partnerId: string,
  isActive: boolean,
) {
  const response = await fetchApi<IPartner>(`/api/clinic/partners/${partnerId}/activation`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({ isActive }),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/contracts`)
  }

  return response
}

export async function listPartnerContractsAction(
  tenantSlug: string,
  params: { partnerId?: string; branchId?: string; activeOnly?: boolean } = {},
) {
  const search = new URLSearchParams()
  if (params.partnerId) search.set('partnerId', params.partnerId)
  if (params.branchId) search.set('branchId', params.branchId)
  if (typeof params.activeOnly === 'boolean') search.set('activeOnly', String(params.activeOnly))
  const query = search.toString()

  return await fetchApi<IPartnerContract[]>(`/api/clinic/partners/contracts${query ? `?${query}` : ''}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function createPartnerContractAction(
  tenantSlug: string,
  payload: ICreatePartnerContractPayload,
) {
  const response = await fetchApi<IPartnerContract>('/api/clinic/partners/contracts', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/contracts`)
  }

  return response
}

export async function updatePartnerContractAction(
  tenantSlug: string,
  contractId: string,
  payload: IUpdatePartnerContractPayload,
) {
  const response = await fetchApi<IPartnerContract>(`/api/clinic/partners/contracts/${contractId}`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/contracts`)
  }

  return response
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

export async function getPartnerOrderByIdAction(tenantSlug: string, orderId: string) {
  return await fetchApi<IPartnerOrder>(`/api/clinic/partner-orders/${orderId}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function updatePartnerOrderStatusAction(
  tenantSlug: string,
  orderId: string,
  payload: {
    status: string
    finalCost?: number
    externalReference?: string
    notes?: string
  },
) {
  const response = await fetchApi<IPartnerOrder>(`/api/clinic/partner-orders/${orderId}/status`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/contracts`)
    revalidatePath(`/${tenantSlug}/dashboard/contractor/orders`)
  }

  return response
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
  payload: ICreatePartnerServicePayload,
) {
  return await fetchApi<IPartnerServiceCatalogItem>(`/api/clinic/partners/services`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })
}

export async function updatePartnerServiceAction(
  tenantSlug: string,
  itemId: string,
  payload: IUpdatePartnerServicePayload,
) {
  return await fetchApi<IPartnerServiceCatalogItem>(`/api/clinic/partners/services/${itemId}`, {
    method: 'PUT',
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
