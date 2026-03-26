'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'
import { BaseApiResponse } from '../../types/api'
import { IQueueSession } from '../../types/queue'
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
