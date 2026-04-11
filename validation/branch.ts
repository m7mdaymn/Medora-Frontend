import * as v from 'valibot'

export const upsertBranchSchema = v.object({
  name: v.pipe(v.string('اسم الفرع مطلوب'), v.minLength(2, 'اسم الفرع قصير'), v.maxLength(200)),
  code: v.optional(v.pipe(v.string(), v.maxLength(50))),
  address: v.optional(v.pipe(v.string(), v.maxLength(500))),
  phone: v.optional(v.pipe(v.string(), v.maxLength(20))),
  isActive: v.optional(v.boolean()),
})

export type UpsertBranchInput = v.InferInput<typeof upsertBranchSchema>
