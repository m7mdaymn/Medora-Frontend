'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IVisit } from '@/types/visit'

type PaginatedVisits = {
  items: IVisit[]
}

type MyVisitsFetchOptions = {
  pageNumber?: number
  pageSize?: number
  fromDate?: string
  toDate?: string
  source?: string
  visitType?: string
  status?: string
  isBooking?: boolean
  isExam?: boolean
  isConsultation?: boolean
  isSelfService?: boolean
}

function toQueryString(options: MyVisitsFetchOptions): string {
  const search = new URLSearchParams()
  if (options.pageNumber) search.set('pageNumber', String(options.pageNumber))
  if (options.pageSize) search.set('pageSize', String(options.pageSize))
  if (options.fromDate) search.set('fromDate', options.fromDate)
  if (options.toDate) search.set('toDate', options.toDate)
  if (options.source) search.set('source', options.source)
  if (options.visitType) search.set('visitType', options.visitType)
  if (options.status) search.set('status', options.status)
  if (typeof options.isBooking === 'boolean') search.set('isBooking', String(options.isBooking))
  if (typeof options.isExam === 'boolean') search.set('isExam', String(options.isExam))
  if (typeof options.isConsultation === 'boolean') {
    search.set('isConsultation', String(options.isConsultation))
  }
  if (typeof options.isSelfService === 'boolean') {
    search.set('isSelfService', String(options.isSelfService))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function getMyVisitsAction(
  tenantSlug: string,
  options: MyVisitsFetchOptions = { pageNumber: 1, pageSize: 1000 },
): Promise<BaseApiResponse<IVisit[]>> {
  const result = await fetchApi<PaginatedVisits>(
    `/api/clinic/visits/my${toQueryString(options)}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )

  if (!result.success) {
    return {
      ...result,
      data: null,
    }
  }

  return {
    ...result,
    data: result.data?.items || [],
  }
}

export async function getMyTodayVisitsAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IVisit[]>> {
  const today = new Date().toISOString().slice(0, 10)
  const allVisitsRes = await getMyVisitsAction(tenantSlug, {
    pageNumber: 1,
    pageSize: 1000,
    fromDate: today,
    toDate: today,
  })
  if (!allVisitsRes.success || !allVisitsRes.data) {
    return {
      ...allVisitsRes,
      data: null,
    }
  }
  return {
    ...allVisitsRes,
    data: allVisitsRes.data,
  }
}
