'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import { ITenant } from '../../types/platform'

export async function getTenants(): Promise<BaseApiResponse<IPaginatedData<ITenant>>> {
  return await fetchApi<IPaginatedData<ITenant>>(
    `/api/platform/tenants?pageNumber=1&pageSize=10000`,
    { method: 'GET', cache: 'no-store' },
  )
}
