'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import { IInventoryItem, IInventoryItemPayload, IInventoryItemsQuery } from '@/types/inventory'

function toQueryString(params: IInventoryItemsQuery = {}): string {
  const search = new URLSearchParams()

  if (params.branchId) search.set('branchId', params.branchId)
  if (typeof params.activeOnly === 'boolean') search.set('activeOnly', String(params.activeOnly))
  if (typeof params.usableInVisit === 'boolean') {
    search.set('usableInVisit', String(params.usableInVisit))
  }
  if (typeof params.sellablePublicly === 'boolean') {
    search.set('sellablePublicly', String(params.sellablePublicly))
  }
  if (typeof params.includeInternalOnly === 'boolean') {
    search.set('includeInternalOnly', String(params.includeInternalOnly))
  }
  if (typeof params.lowStockOnly === 'boolean') search.set('lowStockOnly', String(params.lowStockOnly))
  if (params.search) search.set('search', params.search)
  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))

  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listInventoryItemsAction(
  tenantSlug: string,
  params: IInventoryItemsQuery = {},
): Promise<BaseApiResponse<IPaginatedData<IInventoryItem>>> {
  return await fetchApi<IPaginatedData<IInventoryItem>>(
    `/api/clinic/inventory/items${toQueryString(params)}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function getInventoryItemByIdAction(
  tenantSlug: string,
  itemId: string,
): Promise<BaseApiResponse<IInventoryItem>> {
  return await fetchApi<IInventoryItem>(`/api/clinic/inventory/items/${itemId}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function createInventoryItemAction(
  tenantSlug: string,
  payload: IInventoryItemPayload,
): Promise<BaseApiResponse<IInventoryItem>> {
  const response = await fetchApi<IInventoryItem>('/api/clinic/inventory/items', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/inventory`)
  }

  return response
}

export async function updateInventoryItemAction(
  tenantSlug: string,
  itemId: string,
  payload: IInventoryItemPayload,
): Promise<BaseApiResponse<IInventoryItem>> {
  const response = await fetchApi<IInventoryItem>(`/api/clinic/inventory/items/${itemId}`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/inventory`)
  }

  return response
}

export async function setInventoryItemActivationAction(
  tenantSlug: string,
  itemId: string,
  active: boolean,
): Promise<BaseApiResponse<IInventoryItem>> {
  const response = await fetchApi<IInventoryItem>(`/api/clinic/inventory/items/${itemId}/activation`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({ active }),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/inventory`)
  }

  return response
}
