'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import { IPatient } from '@/types/patient'

export async function getMyPatientsAction(
  tenantSlug: string,
  pageNumber: number = 1,
  search?: string,
  pageSize: number = 10, // 👈 ضفناها هنا
): Promise<BaseApiResponse<IPaginatedData<IPatient>>> {
  const params = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(), // 👈 وبنبعتها هنا
  })

  if (search) {
    params.append('search', search)
  }

  return await fetchApi<IPaginatedData<IPatient>>(
    `/api/clinic/doctors/me/patients?${params.toString()}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}
