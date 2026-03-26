import { fetchApi } from '../../lib/fetchApi'
import { BaseApiResponse } from '../../types/api'
import { IQueueBoard } from '../../types/queue'

export async function getQueueBoard(tenantSlug: string): Promise<BaseApiResponse<IQueueBoard>> {
  // نداء مباشر بدون تكرار للـ Try/Catch أو الـ Headers
  return await fetchApi<IQueueBoard>('/api/clinic/queue/board', {
    method: 'GET',
    tenantSlug,
    cache: 'no-cache',
  })
}
