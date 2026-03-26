import * as v from 'valibot'

export const ExpenseSchema = v.object({
  category: v.pipe(v.string(), v.minLength(2, 'برجاء إدخال بند المصروف')),
  amount: v.pipe(v.number('يجب إدخال رقم'), v.minValue(1, 'المبلغ يجب أن يكون أكبر من صفر')),
  expenseDate: v.pipe(v.string(), v.nonEmpty('تاريخ المصروف مطلوب')),
  notes: v.optional(v.string()),
})

export type ExpenseInput = v.InferInput<typeof ExpenseSchema>
