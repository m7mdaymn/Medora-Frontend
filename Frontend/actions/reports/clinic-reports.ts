'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IClinicOverviewReport, IServicesSalesReport } from '@/types/reporting'

type ReportFilters = {
  fromDate?: string
  toDate?: string
  doctorId?: string
  visitType?: string
  source?: string
}

function toQueryString(filters: ReportFilters): string {
  const search = new URLSearchParams()

  if (filters.fromDate) search.set('fromDate', filters.fromDate)
  if (filters.toDate) search.set('toDate', filters.toDate)
  if (filters.doctorId) search.set('doctorId', filters.doctorId)
  if (filters.visitType) search.set('visitType', filters.visitType)
  if (filters.source) search.set('source', filters.source)

  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function getClinicOverviewReportAction(
  tenantSlug: string,
  filters: ReportFilters = {},
): Promise<BaseApiResponse<IClinicOverviewReport>> {
  return await fetchApi<IClinicOverviewReport>(`/api/clinic/reports/overview${toQueryString(filters)}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function getClinicServicesReportAction(
  tenantSlug: string,
  filters: ReportFilters = {},
): Promise<BaseApiResponse<IServicesSalesReport>> {
  return await fetchApi<IServicesSalesReport>(`/api/clinic/reports/services${toQueryString(filters)}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function getDoctorMyOverviewReportAction(
  tenantSlug: string,
  filters: Pick<ReportFilters, 'fromDate' | 'toDate'> = {},
): Promise<BaseApiResponse<IClinicOverviewReport>> {
  return await fetchApi<IClinicOverviewReport>(
    `/api/clinic/reports/my-overview${toQueryString(filters)}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}
