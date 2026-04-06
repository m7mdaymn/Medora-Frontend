
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

export interface IPatientPartnerOrderTimelineItem {
  id: string
  visitId: string
  partnerId: string
  partnerName: string
  partnerType: string
  serviceName: string | null
  status: string
  orderedAt: string
  acceptedAt: string | null
  scheduledAt: string | null
  patientArrivedAt: string | null
  resultUploadedAt: string | null
  completedAt: string | null
  price: number | null
  finalCost: number | null
  doctorPayoutAmount: number | null
  clinicRevenueAmount: number | null
  resultSummary: string | null
  notes: string | null
}
