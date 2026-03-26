'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { ITenant } from '../../types/platform'

export async function deleteTenant(id: string): Promise<BaseApiResponse<ITenant>> {
  return await fetchApi<ITenant>(`/api/platform/tenants?${id}`, { method: 'DELETE' })
}
