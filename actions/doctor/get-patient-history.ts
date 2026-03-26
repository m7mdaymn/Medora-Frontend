'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import { IVisit } from '@/types/visit'

export async function getMyPatientHistoryAction(
  tenantSlug: string,
  patientId: string,
  pageNumber: number = 1,
  pageSize: number = 10, // 👈 ضفناها هنا
): Promise<BaseApiResponse<IPaginatedData<IVisit>>> {
  const params = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(), // 👈 وبنبعتها هنا
  })

  return await fetchApi<IPaginatedData<IVisit>>(
    `/api/clinic/doctors/me/patients/${patientId}/history?${params.toString()}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}
