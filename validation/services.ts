import * as v from 'valibot'

export const ClinicServiceSchema = v.object({
  name: v.pipe(v.string('اسم الخدمة مطلوب'), v.minLength(2, 'الاسم قصير جداً')),
  description: v.optional(v.string()),
  defaultPrice: v.pipe(v.number('السعر مطلوب'), v.minValue(0, 'السعر لا يمكن أن يكون بالسالب')),
  defaultDurationMinutes: v.pipe(v.number('المدة مطلوبة'), v.minValue(5, 'أقل مدة 5 دقائق')),
  isActive: v.optional(v.boolean(), true),
})

export type ClinicServiceInput = v.InferOutput<typeof ClinicServiceSchema>

// سكيما للربط (هنحتاجها في الشاشة التانية)
export const DoctorServiceLinkSchema = v.object({
  overridePrice: v.nullable(v.pipe(v.number(), v.minValue(0))),
  overrideDurationMinutes: v.nullable(v.pipe(v.number(), v.minValue(5))),
  isActive: v.optional(v.boolean(), true),
})

export type DoctorServiceLinkInput = v.InferOutput<typeof DoctorServiceLinkSchema>
