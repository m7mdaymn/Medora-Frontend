import * as v from 'valibot'

const patientPhoneSchema = v.pipe(
  v.string('رقم الهاتف مطلوب'),
  v.minLength(8, 'رقم الهاتف قصير جداً'),
  v.maxLength(20, 'رقم الهاتف طويل جداً'),
  v.regex(/^\+?[0-9\s-]{8,20}$/, 'رقم الهاتف غير صحيح'),
)

export const CreatePatientSchema = v.object({
  name: v.pipe(
    v.string('الاسم مطلوب'),
    v.minLength(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    v.maxLength(50, 'الاسم طويل جداً'),
  ),
  phone: patientPhoneSchema,
  gender: v.picklist(['Male', 'Female'], 'يجب اختيار النوع'),
  dateOfBirth: v.optional(v.date()),
  branchId: v.pipe(v.string('يجب اختيار الفرع'), v.minLength(1, 'يجب اختيار الفرع')),
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
  phone: patientPhoneSchema,
  gender: v.picklist(['Male', 'Female'], 'يجب اختيار النوع'),

  dateOfBirth: v.optional(v.date()),
})

export type CreateSubPatientInput = v.InferOutput<typeof CreateSubPatientSchema>

export const UpdatePatientSchema = v.object({
  name: v.pipe(
    v.string('الاسم مطلوب'),
    v.minLength(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    v.maxLength(50, 'الاسم طويل جداً'),
  ),
  phone: patientPhoneSchema,
  gender: v.picklist(['Male', 'Female'], 'يجب اختيار النوع'),
  dateOfBirth: v.optional(v.date()),
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