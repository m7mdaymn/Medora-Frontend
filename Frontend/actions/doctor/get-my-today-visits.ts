'use server'

import { fetchApi } from '@/lib/fetchApi' // 👈 عدل المسار حسب مكان الملف الأسطوري بتاعك
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import { IVisit } from '@/types/visit'

export interface MyVisitsFilters {
  fromDate?: string
  toDate?: string
  source?: string
  visitType?: string
  status?: string
  pageNumber?: number
  pageSize?: number
}

export async function getMyTodayVisitsAction(
  tenantSlug: string,
  filters: MyVisitsFilters = {},
): Promise<BaseApiResponse<IPaginatedData<IVisit>>> {
  const params = new URLSearchParams()
  if (filters.fromDate) params.set('fromDate', filters.fromDate)
  if (filters.toDate) params.set('toDate', filters.toDate)
  if (filters.source) params.set('source', filters.source)
  if (filters.visitType) params.set('visitType', filters.visitType)
  if (filters.status) params.set('status', filters.status)
  params.set('pageNumber', String(filters.pageNumber ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 100))

  return await fetchApi<IPaginatedData<IVisit>>(`/api/clinic/visits/my?${params.toString()}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store', // عشان يجيب داتا لايف دايماً
  })
}
