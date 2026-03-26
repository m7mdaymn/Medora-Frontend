'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '../../types/api'
import { IBooking } from '../../types/booking'

export async function getMyBookingsAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IBooking[]>> {
  // الراوت ده بيرجع مصفوفة من الحجوزات الخاصة بالمريض فقط
  return await fetchApi<IBooking[]>('/api/clinic/bookings/my', {
    tenantSlug,
    authType: 'patient', // 👈 السر بتاعنا عشان نأمن الريكويست
    cache: 'no-store', 
  })
}
