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
}

function toQueryString(options: MyVisitsFetchOptions): string {
  const search = new URLSearchParams()
  if (options.pageNumber) search.set('pageNumber', String(options.pageNumber))
  if (options.pageSize) search.set('pageSize', String(options.pageSize))
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function getMyVisitsAction(
  tenantSlug: string,
  options: MyVisitsFetchOptions = { pageNumber: 1, pageSize: 200 },
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
  const allVisitsRes = await getMyVisitsAction(tenantSlug, { pageNumber: 1, pageSize: 200 })
  if (!allVisitsRes.success || !allVisitsRes.data) {
    return {
      ...allVisitsRes,
      data: null,
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayVisits = allVisitsRes.data.filter((visit) => visit.startedAt.slice(0, 10) === today)
  return {
    ...allVisitsRes,
    data: todayVisits,
  }
}
