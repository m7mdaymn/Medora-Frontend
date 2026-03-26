import * as v from 'valibot'

export const CreateDoctorSchema = v.object({
  name: v.string('الاسم مطلوب'),
  username: v.string('اسم المستخدم مطلوب'),
  password: v.string('كلمة المرور مطلوبة'),
  phone: v.optional(v.string()),
  specialty: v.string('التخصص مطلوب'),
  bio: v.optional(v.string()),
  avgVisitDurationMinutes: v.number('مدة الكشف مطلوبة'),
  // 🔥 التعديل هنا: شلنا urgentCaseMode وحطينا الجديد
  urgentInsertAfterCount: v.number('نظام الطوارئ مطلوب'),
})

export type CreateDoctorInput = v.InferOutput<typeof CreateDoctorSchema>

export const UpdateDoctorSchema = v.object({
  name: v.optional(v.string()),
  phone: v.optional(v.string()),
  specialty: v.optional(v.string()),
  bio: v.optional(v.string()),
  avgVisitDurationMinutes: v.optional(v.number()),
  // 🔥 التعديل هنا كمان
  urgentInsertAfterCount: v.optional(v.number()),
  photoUrl: v.optional(v.string()),
})

export type UpdateDoctorInput = v.InferOutput<typeof UpdateDoctorSchema>
