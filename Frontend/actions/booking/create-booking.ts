'use server'

import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { CreateBookingInput } from '@/validation/booking'
import { IBooking } from '@/types/booking'
import { fetchApi } from '../../lib/fetchApi'

export async function createBookingAction(data: CreateBookingInput, tenantSlug: string) {
  const payload = {
    patientId: data.patientId,
    doctorId: data.doctorId,
    doctorServiceId: data.doctorServiceId || null,
    bookingDate: format(data.bookingDate, 'yyyy-MM-dd'),
    bookingTime: data.bookingTime,
    notes: data.notes,
  }

  try {
    const result = await fetchApi<IBooking>('/api/clinic/bookings', {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify(payload),
    })

    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard/appointments`)
      return { success: true, message: 'تم تأكيد الحجز بنجاح' }
    }

    return {
      success: false,
      message: result.message || 'فشل حجز الموعد',
    }
  } catch (error) {
    console.error('[CREATE_BOOKING_ERROR]:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء حجز الموعد، يرجى المحاولة مرة أخرى',
    }
  }
}
