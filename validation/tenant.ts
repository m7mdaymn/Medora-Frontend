import * as v from 'valibot'

export const CreateTenantSchema = v.object({
  // بيانات العيادة
  name: v.pipe(v.string(), v.nonEmpty('اسم العيادة مطلوب'), v.maxLength(200, 'الاسم طويل جداً')),
  slug: v.pipe(
    v.string(),
    v.nonEmpty('المعرف مطلوب'),
    v.regex(/^[a-z0-9\-]+$/, 'يجب أن يكون حروف إنجليزية صغيرة وأرقام وعلامة (-) فقط'),
    v.maxLength(100, 'المعرف طويل جداً'),
  ),
  contactPhone: v.optional(v.string()),
  address: v.optional(v.string()),
  logoUrl: v.optional(v.string()),

  // بيانات المالك
  ownerName: v.pipe(v.string(), v.nonEmpty('اسم المالك مطلوب'), v.maxLength(200)),
  ownerUsername: v.pipe(v.string(), v.nonEmpty('اسم المستخدم مطلوب'), v.maxLength(50)),
  ownerPassword: v.pipe(
    v.string(),
    v.nonEmpty('كلمة المرور مطلوبة'),
    v.minLength(6, 'يجب أن تكون 6 أحرف على الأقل'),
  ),
  ownerPhone: v.optional(v.string()),
})

export type CreateTenantInput = v.InferInput<typeof CreateTenantSchema>
