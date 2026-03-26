'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '../../types/api'
import { IQueueTicket } from '../../types/queue'

export async function getMyTicketAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IQueueTicket>> {
  return await fetchApi<IQueueTicket>('/api/clinic/queue/my-ticket', {
    tenantSlug,
    authType: 'patient',
    cache: 'no-store',
  })
}
