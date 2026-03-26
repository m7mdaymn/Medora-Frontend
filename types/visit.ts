export type VisitStatus = 'Open' | 'Completed'
export type VisitType = 'Exam' | 'Consultation' | string
export type LifecycleState = 'Draft' | string
export type FinancialState = 'NotStarted' | string
export type LabRequestType = 'Lab' | 'Imaging'

export interface IPrescription {
  id: string
  visitId: string
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string | null
  createdAt: string
}

export interface ILabRequest {
  id: string
  visitId: string
  testName: string
  type: LabRequestType
  notes: string | null
  isUrgent: boolean
  resultText: string | null
  createdAt: string
  resultReceivedAt: string
}

export interface IPayment {
  id: string
  invoiceId: string
  amount: number
  paymentMethod: string
  referenceNumber: string | null
  paidAt: string
  notes: string | null
  isRefund: boolean // <-- جديد
  createdAt: string
}

// <-- جديد: الأصناف الإضافية في الفاتورة -->
export interface IInvoiceLineItem {
  id: string
  invoiceId: string
  clinicServiceId: string
  itemName: string
  unitPrice: number
  quantity: number
  totalPrice: number
  notes: string | null
  createdAt: string
}

export interface IInvoice {
  id: string
  invoiceNumber: string
  visitId: string
  patientId: string
  patientName: string
  patientPhone: string | null
  doctorId: string
  doctorName: string
  amount: number
  paidAmount: number
  remainingAmount: number
  status: 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Refunded' | string
  isServiceRendered: boolean

  // <-- جديد: تفاصيل مالية دقيقة -->
  creditAmount: number
  hasPendingSettlement: boolean
  pendingSettlementAmount: number
  totalRefunded: number
  creditIssuedAt: string | null
  notes: string | null

  lineItems: IInvoiceLineItem[] // <-- جديد
  payments: IPayment[]
  createdAt: string
}

// <-- جديد: الأمراض المزمنة -->
export interface IChronicProfile {
  id: string
  patientId: string
  diabetes: boolean
  hypertension: boolean
  cardiacDisease: boolean
  asthma: boolean
  other: boolean
  otherNotes: string | null
  recordedByUserId: string
  updatedAt: string
}

export interface IVisit {
  id: string
  visitType: VisitType // <-- جديد
  queueTicketId: string | null
  doctorId: string
  doctorName: string
  patientId: string
  patientName: string
  patientPhone: string | null // <-- جديد
  patientDateOfBirth: string | null // <-- جديد
  patientGender: string | null // <-- جديد
  status: VisitStatus
  lifecycleState: LifecycleState // <-- جديد
  financialState: FinancialState // <-- جديد
  complaint: string | null
  diagnosis: string | null
  notes: string

  // Vitals
  bloodPressureSystolic: number | null
  bloodPressureDiastolic: number | null
  heartRate: number | null
  temperature: number | null
  weight: number | null
  height: number | null
  bmi: number | null
  bloodSugar: number | null
  oxygenSaturation: number | null
  respiratoryRate: number | null
  followUpDate: string | null

  // <-- جديد: توقيتات الكشف التفصيلية -->
  startedAt: string
  completedAt: string | null
  medicallyCompletedAt: string | null
  financiallySettledAt: string | null
  fullyClosedAt: string | null

  // Relations
  prescriptions: IPrescription[]
  labRequests: ILabRequest[]
  invoice: IInvoice | null
  chronicProfile: IChronicProfile | null // <-- جديد
  createdAt: string
}

export interface DoctorVisitFieldConfig {
  bloodPressure?: boolean
  heartRate?: boolean
  temperature?: boolean
  weight?: boolean
  height?: boolean
  bmi?: boolean
  bloodSugar?: boolean
  oxygenSaturation?: boolean
  respiratoryRate?: boolean
}
