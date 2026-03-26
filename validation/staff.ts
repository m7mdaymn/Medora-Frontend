import * as v from 'valibot'

export const createStaffSchema = v.object({
  name: v.pipe(v.string('الاسم مطلوب'), v.minLength(2, 'الاسم يجب أن يكون حرفين على الأقل')),
  username: v.pipe(v.string('اسم المستخدم مطلوب'), v.minLength(3, 'اسم المستخدم قصير جداً')),
  password: v.pipe(
    v.string('كلمة المرور مطلوبة'),
    v.minLength(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  ),
  role: v.pipe(v.string('الوظيفة مطلوبة'), v.minLength(1, 'يرجى اختيار وظيفة')),
  phone: v.pipe(
    v.string('رقم الهاتف مطلوب'),
    v.regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صحيح'),
  ),
  salary: v.pipe(v.number('الراتب مطلوب'), v.minValue(1, 'الراتب لا يمكن أن يكون صفر أو سالب')),
  hireDate: v.pipe(v.string('تاريخ التعيين مطلوب'), v.isoDate('صيغة التاريخ غير صحيحة')),
  notes: v.optional(v.string()),
})

export type CreateStaffInput = v.InferInput<typeof createStaffSchema>

export const updateStaffSchema = v.object({
  id: v.string(),
  name: v.pipe(v.string(), v.minLength(2, 'الاسم قصير')),
  phone: v.pipe(v.string(), v.minLength(10, 'رقم الهاتف غير صحيح')),
  salary: v.pipe(v.number('يجب إدخال رقم'), v.minValue(0, 'الراتب لا يمكن أن يكون سالباً')),
  isEnabled: v.boolean(),
})

export type UpdateStaffInput = v.InferInput<typeof updateStaffSchema>