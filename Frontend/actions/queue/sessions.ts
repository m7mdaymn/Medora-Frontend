'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'
import { BaseApiResponse } from '../../types/api'
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
): Promise<BaseApiResponse<IQueueSession>> {
  const response = await fetchApi<IQueueSession>(`/api/clinic/queue/sessions/${sessionId}/close`, {
    method: 'POST',
    tenantSlug,
  })
  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/queue`)
    revalidatePath(`/${tenantSlug}/dashboard/doctor/queue`)
  }
  return response
}

export async function closeAllQueueSessions(
  tenantSlug: string,
  notes?: string,
): Promise<BaseApiResponse<{ closedCount: number }>> {
  const response = await fetchApi<{ closedCount: number }>(`/api/clinic/queue/sessions/close-all`, {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({ notes: notes || null }),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/queue`)
    revalidatePath(`/${tenantSlug}/dashboard/doctor/queue`)
  }

  return response
}

export async function getQueueSessionsAction(
  tenantSlug: string,
  doctorId?: string,
): Promise<BaseApiResponse<IQueueSession[]>> {
  const query = doctorId ? `?doctorId=${doctorId}` : ''
  return await fetchApi<IQueueSession[]>(`/api/clinic/queue/sessions${query}`, {
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
