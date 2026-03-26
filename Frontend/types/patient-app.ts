
export interface IPatientSummary {
  patientId: string
  name: string
  phone: string | null
  dateOfBirth: string | null
  gender: string
  totalVisits: number
  recentVisits: {
    id: string
    doctorName: string
    complaint: string | null
    diagnosis: string | null
    startedAt: string
    completedAt: string | null
  }[]
}



export interface ICreditBalance {
  patientId: string
  balance: number
}

export interface ICreditHistoryItem {
  id: string
  patientId: string
  type: 'Issued' | 'Used' | 'Refunded' | string
  reason: string
  amount: number
  balanceAfter: number
  invoiceId: string | null
  paymentId: string | null
  queueTicketId: string | null
  queueSessionId: string | null
  notes: string | null
  createdAt: string
}
