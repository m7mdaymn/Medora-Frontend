'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import {
  CancelSubscriptionInput,
  CreateSubscriptionInput,
  ExtendSubscriptionInput,
  MarkPaidInput,
} from '@/validation/subscription'
import { revalidatePath } from 'next/cache'
import { ISubscription } from '../../types/subscriptions'

export async function getSubscriptions(
  tenantId?: string,
): Promise<BaseApiResponse<IPaginatedData<ISubscription>>> {
  const query = tenantId ? `?tenantId=${tenantId}&pageSize=1000` : '?pageSize=1000'
  return await fetchApi<IPaginatedData<ISubscription>>(`/api/platform/subscriptions${query}`)
}

export async function createSubscriptionAction(
  data: CreateSubscriptionInput,
): Promise<BaseApiResponse<ISubscription>> {
  const res = await fetchApi<ISubscription>('/api/platform/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (res.success) revalidatePath('/admin/subscriptions')
  return res
}

export async function extendSubscriptionAction(
  id: string,
  data: ExtendSubscriptionInput,
): Promise<BaseApiResponse<ISubscription>> {
  const res = await fetchApi<ISubscription>(`/api/platform/subscriptions/${id}/extend`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (res.success) revalidatePath('/admin/subscriptions')
  return res
}

export async function cancelSubscriptionAction(
  id: string,
  data: CancelSubscriptionInput,
): Promise<BaseApiResponse<ISubscription>> {
  const res = await fetchApi<ISubscription>(`/api/platform/subscriptions/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (res.success) revalidatePath('/admin/subscriptions')
  return res
}

export async function markAsPaidAction(
  id: string,
  data: MarkPaidInput,
): Promise<BaseApiResponse<ISubscription>> {
  const res = await fetchApi<ISubscription>(`/api/platform/subscriptions/${id}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (res.success) revalidatePath('/admin/subscriptions')
  return res
}
