import * as v from 'valibot'

export const clinicalSchema = v.object({
  // 1. النصوص (الملاحظات والشكوى)
  complaint: v.nullish(v.string()),
  diagnosis: v.nullish(v.string()),
  notes: v.nullish(v.string()),
  followUpDate: v.optional(v.nullable(v.string())),

  bloodPressureSystolic: v.nullish(v.number('يجب أن يكون رقماً')),
  bloodPressureDiastolic: v.nullish(v.number('يجب أن يكون رقماً')),
  heartRate: v.nullish(v.number('يجب أن يكون رقماً')),
  temperature: v.nullish(v.number('يجب أن يكون رقماً')),
  weight: v.nullish(v.number('يجب أن يكون رقماً')),
  height: v.nullish(v.number('يجب أن يكون رقماً')),
  bmi: v.nullish(v.number('يجب أن يكون رقماً')),
  bloodSugar: v.nullish(v.number('يجب أن يكون رقماً')),
  oxygenSaturation: v.nullish(v.number('يجب أن يكون رقماً')),
  respiratoryRate: v.nullish(v.number('يجب أن يكون رقماً')),
})

export type ClinicalFormInput = v.InferInput<typeof clinicalSchema>
