import * as v from 'valibot'

export const CreatePatientSchema = v.object({
  name: v.pipe(
    v.string('الاسم مطلوب'),
    v.minLength(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    v.maxLength(50, 'الاسم طويل جداً'),
  ),
  phone: v.pipe(v.string('رقم الهاتف مطلوب'), v.regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صحيح')),
  gender: v.picklist(['Male', 'Female'], 'يجب اختيار النوع'),
  dateOfBirth: v.date('تاريخ الميلاد مطلوب'),
  address: v.optional(v.string()),
  notes: v.optional(v.string()),

  // 🔴 الحقول الجديدة للأمراض المزمنة
  diabetes: v.optional(v.boolean(), false),
  hypertension: v.optional(v.boolean(), false),
  cardiacDisease: v.optional(v.boolean(), false),
  asthma: v.optional(v.boolean(), false),
  otherChronic: v.optional(v.string()),
})

// استخراج التايب باستخدام InferOutput زي ما طلبت
export type CreatePatientInput = v.InferOutput<typeof CreatePatientSchema>

export const CreateSubPatientSchema = v.object({
  name: v.pipe(
    v.string('الاسم مطلوب'),
    v.minLength(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    v.maxLength(50, 'الاسم طويل جداً'),
  ),
  phone: v.pipe(
    v.string('رقم الهاتف مطلوب'),
    v.regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صحيح (يجب أن يكون مصري)'),
  ),
  gender: v.picklist(['Male', 'Female'], 'يجب اختيار النوع'),

  dateOfBirth: v.date('تاريخ الميلاد مطلوب'),
})

export type CreateSubPatientInput = v.InferOutput<typeof CreateSubPatientSchema>

export const UpdatePatientSchema = v.object({
  name: v.pipe(
    v.string('الاسم مطلوب'),
    v.minLength(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    v.maxLength(50, 'الاسم طويل جداً'),
  ),
  phone: v.pipe(v.string('رقم الهاتف مطلوب'), v.regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صحيح')),
  gender: v.picklist(['Male', 'Female'], 'يجب اختيار النوع'),
  dateOfBirth: v.date('تاريخ الميلاد مطلوب'),
  address: v.optional(v.string()),
  notes: v.optional(v.string()),
  // 🔴 حقول الأمراض المزمنة للتعديل
  diabetes: v.optional(v.boolean(), false),
  hypertension: v.optional(v.boolean(), false),
  cardiacDisease: v.optional(v.boolean(), false),
  asthma: v.optional(v.boolean(), false),
  otherChronic: v.optional(v.string(), ''),
})

export type UpdatePatientInput = v.InferOutput<typeof UpdatePatientSchema>