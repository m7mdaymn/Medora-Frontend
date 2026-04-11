'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import {
  IPublicClinic,
  IPublicDoctor,
  IPublicLanding,
  IPublicMarketplaceItem,
  IPublicPaymentOptions,
  IPublicService,
  IPublicWorkingHour,
} from '@/types/public'
import { IMarketplaceOrder } from '@/types/marketplace'

export async function getPublicLandingAction(slug: string): Promise<BaseApiResponse<IPublicLanding>> {
  return await fetchApi<IPublicLanding>(`/api/public/${slug}/landing`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getPublicClinicAction(slug: string): Promise<BaseApiResponse<IPublicClinic>> {
  return await fetchApi<IPublicClinic>(`/api/public/${slug}/clinic`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getPublicDoctorsAction(slug: string): Promise<BaseApiResponse<IPublicDoctor[]>> {
  return await fetchApi<IPublicDoctor[]>(`/api/public/${slug}/doctors`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getPublicDoctorsAvailableNowAction(
  slug: string,
): Promise<BaseApiResponse<IPublicDoctor[]>> {
  return await fetchApi<IPublicDoctor[]>(`/api/public/${slug}/doctors/available-now`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getPublicServicesAction(slug: string): Promise<BaseApiResponse<IPublicService[]>> {
  return await fetchApi<IPublicService[]>(`/api/public/${slug}/services`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getPublicPaymentOptionsAction(
  slug: string,
  branchId?: string,
): Promise<BaseApiResponse<IPublicPaymentOptions>> {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''
  return await fetchApi<IPublicPaymentOptions>(`/api/public/${slug}/payment-options${query}`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getPublicWorkingHoursAction(
  slug: string,
): Promise<BaseApiResponse<IPublicWorkingHour[]>> {
  return await fetchApi<IPublicWorkingHour[]>(`/api/public/${slug}/working-hours`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getPublicMarketplaceItemsAction(
  slug: string,
  params: { branchId?: string; featuredOnly?: boolean; search?: string; pageNumber?: number; pageSize?: number } = {},
): Promise<BaseApiResponse<IPaginatedData<IPublicMarketplaceItem>>> {
  const search = new URLSearchParams()

  if (params.branchId) search.set('branchId', params.branchId)
  if (typeof params.featuredOnly === 'boolean') search.set('featuredOnly', String(params.featuredOnly))
  if (params.search) search.set('search', params.search)
  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))

  const query = search.toString()
  const path = query
    ? `/api/public/${slug}/marketplace/items?${query}`
    : `/api/public/${slug}/marketplace/items`

  return await fetchApi<IPaginatedData<IPublicMarketplaceItem>>(path, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getPublicMarketplaceItemByIdAction(
  slug: string,
  itemId: string,
): Promise<BaseApiResponse<IPublicMarketplaceItem>> {
  return await fetchApi<IPublicMarketplaceItem>(`/api/public/${slug}/marketplace/items/${itemId}`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function createPublicMarketplaceOrderAction(
  slug: string,
  payload: {
    customerName: string
    phone: string
    branchId: string
    notes?: string
    items: Array<{ inventoryItemId: string; quantity: number }>
  },
): Promise<BaseApiResponse<IMarketplaceOrder>> {
  return await fetchApi<IMarketplaceOrder>(`/api/public/${slug}/marketplace/orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
}
