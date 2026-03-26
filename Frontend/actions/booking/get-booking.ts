'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPaginatedData } from '@/types/api'
import { IBooking } from '@/types/booking'

export async function getBookingsAction(
  tenantSlug: string,
  pageNumber: number = 1,
  pageSize: number = 10,
): Promise<IPaginatedData<IBooking> | null> {
  const queryParams = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  })

  const res = await fetchApi<IPaginatedData<IBooking>>(
    `/api/clinic/bookings?${queryParams.toString()}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )

  if (!res.success || !res.data) {
    return null
  }

  return res.data
}
