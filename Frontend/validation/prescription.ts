import * as v from 'valibot'

export const prescriptionSchema = v.object({
  medicationName: v.pipe(v.string(), v.nonEmpty('اسم الدواء مطلوب')),
  dosage: v.pipe(v.string(), v.nonEmpty('الجرعة مطلوبة (مثال: قرص واحد)')),
  frequency: v.pipe(v.string(), v.nonEmpty('التكرار مطلوب (مثال: 3 مرات يومياً)')),
  duration: v.pipe(v.string(), v.nonEmpty('المدة مطلوبة (مثال: 5 أيام)')),
  instructions: v.nullish(v.string()),
})

export type PrescriptionFormInput = v.InferInput<typeof prescriptionSchema>
