'use server'

import { IBooking } from '@/types/booking'
import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'

/**
 * إلغاء حجز مؤكد بناءً على السياسة المتبعة
 *
 */
export async function cancelBookingAction(bookingId: string, reason: string, tenantSlug: string) {
  try {
    const result = await fetchApi<IBooking>(`/api/clinic/bookings/${bookingId}/cancel`, {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify({ cancellationReason: reason }),
    })

    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard/appointments`)
      return { success: true, message: 'تم إلغاء الحجز بنجاح' }
    }

    return {
      success: false,
      message: result.message || 'فشل إلغاء الحجز',
    }
  } catch (error) {
    console.error('[CANCEL_BOOKING_ERROR]:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء إلغاء الحجز، يرجى المحاولة مرة أخرى',
    }
  }
}
