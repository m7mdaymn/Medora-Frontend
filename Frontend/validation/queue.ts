import * as v from 'valibot'

// ==========================================
// 1. فاليشين فتح عيادة (شفت)
// ==========================================
export const OpenSessionSchema = v.object({
  doctorId: v.string('اختر الطبيب'),
  notes: v.optional(v.string()),
})

export type OpenSessionInput = v.InferOutput<typeof OpenSessionSchema>

// ==========================================
// 2. فاليديشن قطع تذكرة (عادية أو بدفع)
// ==========================================
export const CutTicketSchema = v.object({
  sessionId: v.string('اختر العيادة'),
  patientId: v.string('اختر المريض'),
  doctorId: v.string('الطبيب مطلوب'),
  doctorServiceId: v.optional(v.string()),
  visitType: v.optional(v.string()), 
  isUrgent: v.optional(v.boolean()),
  notes: v.optional(v.string()),
  paymentAmount: v.optional(v.number()),
  paidAmount: v.optional(v.number()), 
  paymentMethod: v.optional(v.string()),
  paymentReference: v.optional(v.string()),
  paymentNotes: v.optional(v.string()),
})

export type CutTicketInput = v.InferOutput<typeof CutTicketSchema>
