'use server'

import { fetchApi } from '../../lib/fetchApi'
import { IDailyFinance } from '../../types/finance'

export const getDailyFinance = async (tenantSlug: string) => {
  return fetchApi<IDailyFinance>('/api/clinic/finance/daily', {
    method: 'GET',
    tenantSlug,
  })
}
