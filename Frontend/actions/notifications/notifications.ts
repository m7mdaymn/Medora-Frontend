'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import {
  IInAppNotification,
  INotificationSubscription,
  INotificationSubscriptionPayload,
  ISendNotificationPayload,
} from '@/types/notifications'
import { IMessageLog } from '@/types/messages'

export async function subscribeNotificationAction(
  tenantSlug: string,
  payload: INotificationSubscriptionPayload,
): Promise<BaseApiResponse<INotificationSubscription>> {
  const response = await fetchApi<INotificationSubscription>('/api/clinic/notifications/subscribe', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/notifications`)
  }

  return response
}

export async function unsubscribeNotificationAction(
  tenantSlug: string,
  id: string,
): Promise<BaseApiResponse<boolean>> {
  const response = await fetchApi<boolean>(`/api/clinic/notifications/${id}`, {
    method: 'DELETE',
    tenantSlug,
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/notifications`)
  }

  return response
}

export async function getMyNotificationSubscriptionsAction(
  tenantSlug: string,
): Promise<BaseApiResponse<INotificationSubscription[]>> {
  return await fetchApi<INotificationSubscription[]>('/api/clinic/notifications/my', {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function sendPushNotificationAction(
  tenantSlug: string,
  payload: ISendNotificationPayload,
): Promise<BaseApiResponse<IMessageLog>> {
  return await fetchApi<IMessageLog>('/api/clinic/notifications/send', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })
}

export async function listInAppNotificationsAction(
  tenantSlug: string,
  params: { unreadOnly?: boolean; pageNumber?: number; pageSize?: number } = {},
): Promise<BaseApiResponse<IPaginatedData<IInAppNotification>>> {
  const search = new URLSearchParams()
  if (typeof params.unreadOnly === 'boolean') search.set('unreadOnly', String(params.unreadOnly))
  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()

  return await fetchApi<IPaginatedData<IInAppNotification>>(
    `/api/clinic/notifications/in-app${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function markInAppNotificationReadAction(
  tenantSlug: string,
  id: string,
): Promise<BaseApiResponse<IInAppNotification>> {
  const response = await fetchApi<IInAppNotification>(`/api/clinic/notifications/in-app/${id}/read`, {
    method: 'POST',
    tenantSlug,
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/notifications`)
  }

  return response
}

export async function markAllInAppNotificationsReadAction(
  tenantSlug: string,
): Promise<BaseApiResponse<number>> {
  const response = await fetchApi<number>('/api/clinic/notifications/in-app/mark-all-read', {
    method: 'POST',
    tenantSlug,
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/notifications`)
  }

  return response
}
