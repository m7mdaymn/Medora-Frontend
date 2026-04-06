import * as v from 'valibot'

const CompensationModeSchema = v.picklist(
  ['Salary', 'Percentage', 'FixedPerVisit'] as const,
  'نمط التعاقد مطلوب',
)

export const CreateDoctorSchema = v.object({
  name: v.string('الاسم مطلوب'),
  username: v.string('اسم المستخدم مطلوب'),
  password: v.string('كلمة المرور مطلوبة'),
  phone: v.optional(v.string()),
  specialty: v.string('التخصص مطلوب'),
  bio: v.optional(v.string()),
  avgVisitDurationMinutes: v.number('مدة الكشف مطلوبة'),
  urgentInsertAfterCount: v.number('نظام الطوارئ مطلوب'),
  compensationMode: CompensationModeSchema,
  compensationValue: v.pipe(
    v.number('قيمة التعاقد مطلوبة'),
    v.minValue(0.01, 'قيمة التعاقد يجب أن تكون أكبر من صفر'),
  ),
})

export type CreateDoctorInput = v.InferOutput<typeof CreateDoctorSchema>

export const UpdateDoctorSchema = v.object({
  name: v.string('الاسم مطلوب'),
  phone: v.optional(v.string()),
  specialty: v.string('التخصص مطلوب'),
  bio: v.optional(v.string()),
  avgVisitDurationMinutes: v.number('مدة الكشف مطلوبة'),
  urgentInsertAfterCount: v.number('نظام الطوارئ مطلوب'),
  compensationMode: CompensationModeSchema,
  compensationValue: v.pipe(
    v.number('قيمة التعاقد مطلوبة'),
    v.minValue(0.01, 'قيمة التعاقد يجب أن تكون أكبر من صفر'),
  ),
  photoUrl: v.optional(v.string()),
})

export type UpdateDoctorInput = v.InferOutput<typeof UpdateDoctorSchema>
