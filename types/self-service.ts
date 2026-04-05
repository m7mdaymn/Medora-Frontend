export type SelfServiceRequestType = 'SameDayTicket' | 'FutureBooking' | string

export type SelfServiceRequestStatus =
  | 'PendingPaymentReview'
  | 'PaymentApproved'
  | 'ConvertedToQueueTicket'
  | 'ConvertedToBooking'
  | 'Rejected'
  | 'ReuploadRequested'
  | 'Expired'
  | string

export interface ISelfServiceRequestListItem {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  branchId: string
  branchName: string
  doctorServiceId: string
  serviceName: string
  requestType: SelfServiceRequestType
  status: SelfServiceRequestStatus
  requestedDate: string
  requestedTime: string | null
  declaredPaidAmount: number | null
  adjustedPaidAmount: number | null
  expiresAt: string
  convertedQueueTicketId: string | null
  convertedBookingId: string | null
  createdAt: string
}

export interface ISelfServiceRequestDocument {
  id: string
  originalFileName: string
  publicUrl: string
  contentType: string
  fileSizeBytes: number
  notes: string | null
  createdAt: string
}

export interface ISelfServicePaymentProof {
  originalFileName: string
  publicUrl: string
  contentType: string
  fileSizeBytes: number
}

export interface ISelfServiceRequest {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  branchId: string
  branchName: string
  doctorServiceId: string
  serviceName: string
  requestType: SelfServiceRequestType
  status: SelfServiceRequestStatus
  visitType: string
  source: string
  requestedDate: string
  requestedTime: string | null
  servicePriceSnapshot: number | null
  serviceDurationMinutesSnapshot: number | null
  complaint: string | null
  symptoms: string | null
  durationNotes: string | null
  hasChronicConditions: boolean
  chronicConditionsDetails: string | null
  currentMedications: string | null
  knownAllergies: string | null
  isPregnant: boolean | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  notes: string | null
  declaredPaidAmount: number | null
  adjustedPaidAmount: number | null
  paymentMethod: string | null
  transferReference: string | null
  transferSenderName: string | null
  transferDate: string | null
  paymentProof: ISelfServicePaymentProof
  isWithinClinicWorkingHours: boolean | null
  isWithinDoctorSchedule: boolean | null
  doctorShiftOpenAtSubmission: boolean | null
  availabilityCheckedAt: string | null
  availabilityCheckNotes: string | null
  expiresAt: string
  reuploadCount: number
  reuploadReason: string | null
  reuploadRequestedAt: string | null
  reuploadRequestedByUserId: string | null
  rejectionReason: string | null
  rejectedAt: string | null
  rejectedByUserId: string | null
  approvalNotes: string | null
  approvedAt: string | null
  approvedByUserId: string | null
  convertedQueueTicketId: string | null
  convertedBookingId: string | null
  convertedAt: string | null
  documents: ISelfServiceRequestDocument[]
  createdAt: string
  updatedAt: string
}

export interface ISelfServiceRequestsQuery {
  patientId?: string
  doctorId?: string
  branchId?: string
  requestType?: SelfServiceRequestType
  status?: SelfServiceRequestStatus
  fromDate?: string
  toDate?: string
  pageNumber?: number
  pageSize?: number
}
