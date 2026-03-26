'use server'

import { revalidatePath } from 'next/cache'
import { IBooking } from '@/types/booking'
import { fetchApi } from '../../lib/fetchApi'

/**
 * تعديل موعد حجز قائم (Reschedule)
 *
 */
export async function rescheduleBookingAction(
  bookingId: string,
  date: string,
  time: string,
  tenantSlug: string,
) {
  const result = await fetchApi<IBooking>(`/api/clinic/bookings/${bookingId}/reschedule`, {
    method: 'POST',
    tenantSlug,
    // الـ Payload متوافق مع مواصفات المرحلة الرابعة
    body: JSON.stringify({
      bookingDate: date,
      bookingTime: time,
    }),
  })

  if (result.success) {
    // تحديث المسار ليعكس المواعيد الجديدة في الـ UI
    revalidatePath(`/${tenantSlug}/dashboard/appointments`)
    return { success: true, message: 'تم تعديل الموعد بنجاح' }
  }

  return {
    success: false,
    message: result.message || 'فشل تأجيل الحجز',
  }
}
