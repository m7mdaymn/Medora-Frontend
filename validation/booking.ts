import * as v from 'valibot'

export const createBookingSchema = v.object({
  patientId: v.pipe(v.string('يجب اختيار المريض'), v.minLength(1, 'يجب اختيار المريض')),
  branchId: v.pipe(v.string('يجب اختيار الفرع'), v.minLength(1, 'يجب اختيار الفرع')),
  doctorId: v.pipe(v.string('يجب اختيار الطبيب'), v.minLength(1, 'يجب اختيار الطبيب')),

  doctorServiceId: v.pipe(v.string('يجب اختيار الخدمة'), v.minLength(1, 'يجب اختيار الخدمة')),

  bookingDate: v.date('يجب تحديد التاريخ'),
  bookingTime: v.pipe(
    v.string(),
    v.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة (HH:mm)'),
  ),
  notes: v.optional(v.string()),
  paymentMethod: v.optional(
    v.union([v.literal('none'), v.literal('Cash'), v.literal('Receipt'), v.literal('Transfer')]),
  ),
  paidAmount: v.optional(
    v.union([
      v.literal(''),
      v.pipe(
        v.string('صيغة المبلغ غير صحيحة'),
        v.regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/, 'صيغة المبلغ غير صحيحة'),
      ),
    ]),
  ),
  paymentReference: v.optional(v.string()),
  paymentNotes: v.optional(v.string()),
})

export type CreateBookingInput = v.InferOutput<typeof createBookingSchema>
