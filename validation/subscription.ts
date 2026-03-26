import * as v from 'valibot'

// 1. إنشاء اشتراك جديد
export const CreateSubscriptionSchema = v.object({
  tenantId: v.pipe(v.string(), v.uuid('ID غير صحيح')),
  planName: v.pipe(v.string(), v.nonEmpty('اسم الخطة مطلوب')),
  startDate: v.pipe(v.string(), v.isoDate()),
  endDate: v.pipe(v.string(), v.isoDate()),
  amount: v.pipe(v.number(), v.minValue(0.01, 'المبلغ يجب أن يكون أكبر من 0')),
  currency: v.pipe(v.string(), v.minLength(3), v.maxLength(3)), // مثلا EGP
  notes: v.optional(v.string()),
})

// 2. تمديد الاشتراك
export const ExtendSubscriptionSchema = v.object({
  newEndDate: v.pipe(v.string(), v.isoDate('التاريخ غير صحيح')),
  notes: v.optional(v.string()),
})

// 3. إلغاء الاشتراك
export const CancelSubscriptionSchema = v.object({
  cancelReason: v.pipe(v.string(), v.nonEmpty('يجب ذكر سبب الإلغاء')),
})

// 4. تأكيد الدفع
export const MarkPaidSchema = v.object({
  paymentMethod: v.pipe(v.string(), v.nonEmpty('طريقة الدفع مطلوبة')),
  paymentReference: v.pipe(v.string(), v.nonEmpty('رقم المرجع مطلوب')),
  paidAt: v.pipe(v.string(), v.isoDate()),
})

export type CreateSubscriptionInput = v.InferInput<typeof CreateSubscriptionSchema>
export type ExtendSubscriptionInput = v.InferInput<typeof ExtendSubscriptionSchema>
export type CancelSubscriptionInput = v.InferInput<typeof CancelSubscriptionSchema>
export type MarkPaidInput = v.InferInput<typeof MarkPaidSchema>
