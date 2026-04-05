'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import {
  ISelfServiceRequest,
  ISelfServiceRequestListItem,
  ISelfServiceRequestsQuery,
} from '@/types/self-service'

function toQueryString(params: ISelfServiceRequestsQuery = {}): string {
  const search = new URLSearchParams()

  if (params.patientId) search.set('patientId', params.patientId)
  if (params.doctorId) search.set('doctorId', params.doctorId)
  if (params.branchId) search.set('branchId', params.branchId)
  if (params.requestType) search.set('requestType', params.requestType)
  if (params.status) search.set('status', params.status)
  if (params.fromDate) search.set('fromDate', params.fromDate)
  if (params.toDate) search.set('toDate', params.toDate)
  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))

  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listSelfServiceRequestsAction(
  tenantSlug: string,
  params: ISelfServiceRequestsQuery = {},
): Promise<BaseApiResponse<IPaginatedData<ISelfServiceRequestListItem>>> {
  return await fetchApi<IPaginatedData<ISelfServiceRequestListItem>>(
    `/api/clinic/self-service-requests${toQueryString(params)}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function getSelfServiceRequestByIdAction(
  tenantSlug: string,
  requestId: string,
): Promise<BaseApiResponse<ISelfServiceRequest>> {
  return await fetchApi<ISelfServiceRequest>(`/api/clinic/self-service-requests/${requestId}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function approveSelfServiceRequestAction(
  tenantSlug: string,
  requestId: string,
  payload: { adjustedPaidAmount?: number; notes?: string },
): Promise<BaseApiResponse<ISelfServiceRequest>> {
  const response = await fetchApi<ISelfServiceRequest>(
    `/api/clinic/self-service-requests/${requestId}/approve`,
    {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify(payload),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/self-service-requests`)
  }

  return response
}

export async function rejectSelfServiceRequestAction(
  tenantSlug: string,
  requestId: string,
  reason: string,
): Promise<BaseApiResponse<ISelfServiceRequest>> {
  const response = await fetchApi<ISelfServiceRequest>(
    `/api/clinic/self-service-requests/${requestId}/reject`,
    {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify({ reason }),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/self-service-requests`)
  }

  return response
}

export async function requestSelfServicePaymentReuploadAction(
  tenantSlug: string,
  requestId: string,
  reason: string,
): Promise<BaseApiResponse<ISelfServiceRequest>> {
  const response = await fetchApi<ISelfServiceRequest>(
    `/api/clinic/self-service-requests/${requestId}/request-reupload`,
    {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify({ reason }),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/self-service-requests`)
  }

  return response
}

export async function adjustSelfServicePaidAmountAction(
  tenantSlug: string,
  requestId: string,
  payload: { adjustedPaidAmount: number; notes?: string },
): Promise<BaseApiResponse<ISelfServiceRequest>> {
  const response = await fetchApi<ISelfServiceRequest>(
    `/api/clinic/self-service-requests/${requestId}/adjust-paid-amount`,
    {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify(payload),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/self-service-requests`)
  }

  return response
}
