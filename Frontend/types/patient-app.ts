
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

export interface IPatientCreditBalance {
  patientId: string
  balance: number
  updatedAt: string
}

export interface IPatientCreditHistoryItem {
  id: string
  type: string
  reason: string
  amount: number
  balanceAfter: number
  notes: string | null
  createdAt: string
}

export interface IPatientPartnerOrderTimelineItem {
  id: string
  visitId: string
  partnerId: string
  partnerName: string
  partnerContactName: string | null
  partnerContactPhone: string | null
  partnerAddress: string | null
  partnerType: string
  doctorName: string
  visitComplaint: string | null
  visitDiagnosis: string | null
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
  patientDiscountPercentage: number | null
  doctorFixedPayoutAmount: number | null
  doctorPayoutAmount: number | null
  clinicRevenueAmount: number | null
  resultSummary: string | null
  externalReference: string | null
  notes: string | null
}

export interface IPatientSelfServiceRequestListItem {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  branchId: string
  branchName: string
  doctorServiceId: string
  serviceName: string
  requestType: string
  status: string
  requestedDate: string
  requestedTime: string | null
  declaredPaidAmount: number | null
  adjustedPaidAmount: number | null
  expiresAt: string
  convertedQueueTicketId: string | null
  convertedBookingId: string | null
  createdAt: string
}
