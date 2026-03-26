import * as v from 'valibot'

export const DoctorLinkSchema = v.object({
  clinicServiceId: v.pipe(v.string('يجب اختيار الخدمة'), v.minLength(1, 'يجب اختيار الخدمة')),
  // بنقبل null أو رقم
  overridePrice: v.nullable(v.number('السعر يجب أن يكون رقماً')),
  overrideDurationMinutes: v.nullable(v.number('المدة يجب أن تكون رقماً')),
  isActive: v.optional(v.boolean(), true),
})

export type DoctorLinkInput = v.InferOutput<typeof DoctorLinkSchema>
