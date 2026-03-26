import * as v from 'valibot'

export const LoginSchema = v.object({
  username: v.pipe(v.string(), v.minLength(3, 'اسم المستخدم قصير جداً')),
  password: v.pipe(v.string(), v.minLength(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')),
})

export type LoginInput = v.InferOutput<typeof LoginSchema> 