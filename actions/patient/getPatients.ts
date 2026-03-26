'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPaginatedData } from '@/types/api'
import { IPatient } from '@/types/patient'

export async function getPatientsAction(
  tenantSlug: string,
  pageNumber: number = 1,
  pageSize: number = 10,
  search: string = '',
): Promise<IPaginatedData<IPatient>> {
  const queryParams = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  })

  if (search) queryParams.append('search', search)

  const res = await fetchApi<IPaginatedData<IPatient>>(
    `/api/clinic/patients?${queryParams.toString()}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )

  if (!res.success || !res.data) {
    return {
      items: [],
      totalCount: 0,
      pageNumber: pageNumber,
      pageSize: pageSize,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  }

  return res.data
}
