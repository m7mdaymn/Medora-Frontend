'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import {
  IMarketplaceOrder,
  IMarketplaceOrdersQuery,
  IUpdateMarketplaceOrderStatusPayload,
} from '@/types/marketplace'

function toQueryString(params: IMarketplaceOrdersQuery = {}): string {
  const search = new URLSearchParams()

  if (params.branchId) search.set('branchId', params.branchId)
  if (params.status) search.set('status', params.status)
  if (params.fromDate) search.set('fromDate', params.fromDate)
  if (params.toDate) search.set('toDate', params.toDate)
  if (params.search) search.set('search', params.search)
  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))

  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listMarketplaceOrdersAction(
  tenantSlug: string,
  params: IMarketplaceOrdersQuery = {},
): Promise<BaseApiResponse<IPaginatedData<IMarketplaceOrder>>> {
  return await fetchApi<IPaginatedData<IMarketplaceOrder>>(
    `/api/clinic/marketplace/orders${toQueryString(params)}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function getMarketplaceOrderByIdAction(
  tenantSlug: string,
  orderId: string,
): Promise<BaseApiResponse<IMarketplaceOrder>> {
  return await fetchApi<IMarketplaceOrder>(`/api/clinic/marketplace/orders/${orderId}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function updateMarketplaceOrderStatusAction(
  tenantSlug: string,
  orderId: string,
  payload: IUpdateMarketplaceOrderStatusPayload,
): Promise<BaseApiResponse<IMarketplaceOrder>> {
  const response = await fetchApi<IMarketplaceOrder>(
    `/api/clinic/marketplace/orders/${orderId}/status`,
    {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify(payload),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/marketplace-orders`)
  }

  return response
}
