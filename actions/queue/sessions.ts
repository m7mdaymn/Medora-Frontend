'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '../../types/api'
import { IQueueSession, IQueueTicket } from '../../types/queue'
import { OpenSessionInput } from '../../validation/queue'

export async function openQueueSession(
  tenantSlug: string,
  data: OpenSessionInput,
): Promise<BaseApiResponse<IQueueSession>> {
  const response = await fetchApi<IQueueSession>('/api/clinic/queue/sessions', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(data), // هنا الصح
  })
  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/queue`)
    revalidatePath(`/${tenantSlug}/dashboard/doctor/queue`)
  }
  return response
}

// الدالة اللي إنت كسلت تكتبها
export async function closeQueueSession(
  tenantSlug: string,
  sessionId: string,
  force: boolean = false,
): Promise<BaseApiResponse<IQueueSession>> {
  const query = force ? '?force=true' : ''
  const response = await fetchApi<IQueueSession>(
    `/api/clinic/queue/sessions/${sessionId}/close${query}`,
    {
      method: 'POST',
      tenantSlug,
    },
  )
  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/queue`)
    revalidatePath(`/${tenantSlug}/dashboard/doctor/queue`)
  }
  return response
}

export async function closeAllQueueSessions(
  tenantSlug: string,
  date?: string,
): Promise<BaseApiResponse<number>> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  const response = await fetchApi<number>(`/api/clinic/queue/sessions/close-all${query}`, {
    method: 'POST',
    tenantSlug,
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/queue`)
    revalidatePath(`/${tenantSlug}/dashboard/doctor/queue`)
  }

  return response
}

export async function getQueueSessionsAction(
  tenantSlug: string,
  pageNumber: number = 1,
  pageSize: number = 10,
): Promise<BaseApiResponse<IPaginatedData<IQueueSession>>> {
  const query = `?pageNumber=${pageNumber}&pageSize=${pageSize}`
  return await fetchApi<IPaginatedData<IQueueSession>>(`/api/clinic/queue/sessions${query}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function getQueueSessionByIdAction(
  tenantSlug: string,
  sessionId: string,
): Promise<BaseApiResponse<IQueueSession>> {
  return await fetchApi<IQueueSession>(`/api/clinic/queue/sessions/${sessionId}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function getQueueSessionTicketsAction(
  tenantSlug: string,
  sessionId: string,
): Promise<BaseApiResponse<IQueueTicket[]>> {
  return await fetchApi<IQueueTicket[]>(`/api/clinic/queue/sessions/${sessionId}/tickets`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}
