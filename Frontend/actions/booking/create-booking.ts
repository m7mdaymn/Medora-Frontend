'use server'

import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { CreateBookingInput } from '@/validation/booking'
import { IBooking } from '@/types/booking'
import { fetchApi } from '../../lib/fetchApi'

export async function createBookingAction(
  data: CreateBookingInput,
  tenantSlug: string,
  receiptFile?: File | null,
) {
  const requestedBranchId = data.branchId?.trim()
  if (!requestedBranchId) {
    return {
      success: false,
      message: 'يجب اختيار الفرع قبل تأكيد الحجز',
    }
  }

  const normalizedPaymentMethod =
    data.paymentMethod && data.paymentMethod !== 'none' ? data.paymentMethod.trim() : undefined
  const normalizedPaidAmount = data.paidAmount?.trim() || undefined
  const parsedPaidAmount = normalizedPaidAmount !== undefined ? Number(normalizedPaidAmount) : undefined

  if (parsedPaidAmount !== undefined && Number.isNaN(parsedPaidAmount)) {
    return {
      success: false,
      message: 'صيغة المبلغ غير صحيحة',
    }
  }

  const requiresTransferReceipt =
    (normalizedPaymentMethod === 'Transfer' || normalizedPaymentMethod === 'Receipt') &&
    (parsedPaidAmount ?? 0) > 0

  if (requiresTransferReceipt && !receiptFile) {
    return {
      success: false,
      message: 'صورة إيصال التحويل مطلوبة',
    }
  }

  const payload = {
    patientId: data.patientId,
    branchId: requestedBranchId,
    doctorId: data.doctorId,
    doctorServiceId: data.doctorServiceId || null,
    bookingDate: format(data.bookingDate, 'yyyy-MM-dd'),
    bookingTime: data.bookingTime,
    notes: data.notes,
    paidAmount: parsedPaidAmount,
    paymentMethod: normalizedPaymentMethod,
    paymentReference: data.paymentReference?.trim() || undefined,
    paymentNotes: data.paymentNotes?.trim() || undefined,
  }

  try {
    const useFormEndpoint = Boolean(receiptFile) || requiresTransferReceipt
    const result = useFormEndpoint
      ? await createBookingWithReceipt(payload, tenantSlug, receiptFile)
      : await fetchApi<IBooking>('/api/clinic/bookings', {
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

async function createBookingWithReceipt(
  payload: {
    patientId: string
    branchId: string
    doctorId: string
    doctorServiceId: string | null
    bookingDate: string
    bookingTime: string
    notes?: string
    paidAmount?: number
    paymentMethod?: string
    paymentReference?: string
    paymentNotes?: string
  },
  tenantSlug: string,
  receiptFile?: File | null,
) {
  const formData = new FormData()

  formData.append('patientId', payload.patientId)
  formData.append('branchId', payload.branchId)
  formData.append('doctorId', payload.doctorId)
  formData.append('bookingDate', payload.bookingDate)
  formData.append('bookingTime', payload.bookingTime)

  if (payload.doctorServiceId) {
    formData.append('doctorServiceId', payload.doctorServiceId)
  }

  if (payload.notes?.trim()) {
    formData.append('notes', payload.notes.trim())
  }

  if (typeof payload.paidAmount === 'number' && Number.isFinite(payload.paidAmount)) {
    formData.append('paidAmount', payload.paidAmount.toString())
  }

  if (payload.paymentMethod?.trim()) {
    formData.append('paymentMethod', payload.paymentMethod.trim())
  }

  if (payload.paymentReference?.trim()) {
    formData.append('paymentReference', payload.paymentReference.trim())
  }

  if (payload.paymentNotes?.trim()) {
    formData.append('paymentNotes', payload.paymentNotes.trim())
  }

  if (receiptFile) {
    formData.append('receiptFile', receiptFile)
  }

  return fetchApi<IBooking>('/api/clinic/bookings/with-receipt', {
    method: 'POST',
    tenantSlug,
    body: formData,
  })
}
