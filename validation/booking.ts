import * as v from 'valibot'

export const createBookingSchema = v.object({
  patientId: v.pipe(v.string('يجب اختيار المريض'), v.minLength(1, 'يجب اختيار المريض')),
  doctorId: v.pipe(v.string('يجب اختيار الطبيب'), v.minLength(1, 'يجب اختيار الطبيب')),

  // 👈 التعديل هنا: نستخدم string() مع رسالة خطأ واضحة
  doctorServiceId: v.pipe(v.string('يجب اختيار الخدمة'), v.minLength(1, 'يجب اختيار الخدمة')),

  bookingDate: v.date('يجب تحديد التاريخ'),
  bookingTime: v.pipe(
    v.string(),
    v.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة (HH:mm)'),
  ),
  notes: v.optional(v.string()),
})

export type CreateBookingInput = v.InferOutput<typeof createBookingSchema>
