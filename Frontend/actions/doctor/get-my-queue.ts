'use server'

import { IQueueBoardSession } from '@/types/queue'
import { BaseApiResponse } from '@/types/api'
import { fetchApi } from '../../lib/fetchApi'


export async function getMyQueueAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IQueueBoardSession>> {
  return await fetchApi<IQueueBoardSession>('/api/clinic/queue/my-queue', {
    tenantSlug,
    cache: 'no-store', 
  })
}
