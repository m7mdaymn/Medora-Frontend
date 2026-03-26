import * as v from 'valibot'

// 1. تعريف شكل "بند الفاتورة" (Item)
const InvoiceItemSchema = v.object({
  serviceId: v.string(),
  price: v.number(),
  name: v.string(),
})

// 2. تحديث سكيما الفاتورة لتشمل كل التفاصيل
export const createInvoiceSchema = v.object({
  patientId: v.string(),
  doctorId: v.string(),

  // غيرنا amount لـ totalAmount عشان يبقى أدق، وضفنا باقي الحقول
  totalAmount: v.pipe(v.number(), v.minValue(0, 'الإجمالي مطلوب')),
  paidAmount: v.pipe(v.number(), v.minValue(0)),

  items: v.array(InvoiceItemSchema),
  paymentMethod: v.string(),
  status: v.string(),

  notes: v.optional(v.string()),
})

export type CreateInvoiceFormInput = v.InferInput<typeof createInvoiceSchema>

// ... (سيب باقي الملف زي ما هو: createPaymentSchema)
export const createPaymentSchema = v.object({
  amount: v.pipe(v.number(), v.minValue(1)),
  paymentMethod: v.pipe(v.string(), v.nonEmpty()),
  referenceNumber: v.nullish(v.string()),
  notes: v.nullish(v.string()),
})
export type CreatePaymentFormInput = v.InferInput<typeof createPaymentSchema>
