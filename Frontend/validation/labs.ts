import * as v from 'valibot'

export const labRequestSchema = v.object({
  testName: v.pipe(v.string(), v.nonEmpty('اسم التحليل مطلوب')),
  type: v.picklist(['Lab', 'Imaging']),
  notes: v.nullish(v.string()),
  isUrgent: v.boolean(),
})

export type LabRequestFormInput = v.InferInput<typeof labRequestSchema>
