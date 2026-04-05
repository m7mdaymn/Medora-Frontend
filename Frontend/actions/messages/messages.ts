'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import { IMessageLog, ISendMessagePayload } from '@/types/messages'

export async function listMessagesAction(
  tenantSlug: string,
  params: {
    templateName?: string
    channel?: string
    status?: string
    pageNumber?: number
    pageSize?: number
  } = {},
): Promise<BaseApiResponse<IPaginatedData<IMessageLog>>> {
  const search = new URLSearchParams()

  if (params.templateName) search.set('templateName', params.templateName)
  if (params.channel) search.set('channel', params.channel)
  if (params.status) search.set('status', params.status)
  if (params.pageNumber) search.set('pageNumber', String(params.pageNumber))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))

  const query = search.toString()

  return await fetchApi<IPaginatedData<IMessageLog>>(`/api/clinic/messages${query ? `?${query}` : ''}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function getMessageByIdAction(
  tenantSlug: string,
  id: string,
): Promise<BaseApiResponse<IMessageLog>> {
  return await fetchApi<IMessageLog>(`/api/clinic/messages/${id}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function sendMessageAction(
  tenantSlug: string,
  payload: ISendMessagePayload,
): Promise<BaseApiResponse<IMessageLog>> {
  const response = await fetchApi<IMessageLog>('/api/clinic/messages/send', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/messages`)
  }

  return response
}

export async function retryMessageAction(
  tenantSlug: string,
  id: string,
): Promise<BaseApiResponse<IMessageLog>> {
  const response = await fetchApi<IMessageLog>(`/api/clinic/messages/${id}/retry`, {
    method: 'POST',
    tenantSlug,
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/messages`)
  }

  return response
}
