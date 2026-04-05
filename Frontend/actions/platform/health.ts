'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'

export async function getHealthAction(): Promise<BaseApiResponse<Record<string, unknown>>> {
  return await fetchApi<Record<string, unknown>>('/api/Health', {
    method: 'GET',
    cache: 'no-store',
  })
}
