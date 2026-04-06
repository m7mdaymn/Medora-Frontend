export type TicketStatus =
  | 'Waiting'
  | 'Called'
  | 'InVisit'
  | 'Completed'
  | 'Skipped'
  | 'NoShow'
  | 'Cancelled'

export type QueueVisitType = 'Exam' | 'Consultation' | string
export type QueueVisitSource =
  | 'WalkInTicket'
  | 'Booking'
  | 'ConsultationBooking'
  | 'PatientSelfServiceTicket'
  | 'PatientSelfServiceBooking'
  | string

export interface IQueueTicket {
  id: string
  sessionId: string
  branchId?: string | null
  visitId?: string | null
  invoiceId?: string | null
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  source: QueueVisitSource
  visitType?: QueueVisitType | null
  isFromBooking?: boolean
  isFromWalkIn?: boolean
  isFromSelfService?: boolean
  doctorServiceId?: string | null
  serviceName?: string | null
  invoiceAmount?: number | null
  paidAmount?: number | null
  remainingAmount?: number | null
  invoiceStatus?: string | null
  ticketNumber: number
  status: TicketStatus
  isUrgent: boolean
  urgentAccepted?: boolean // <-- جديد
  issuedAt: string
  calledAt?: string | null
  visitStartedAt?: string | null
  completedAt?: string | null
  notes?: string | null

  // <-- حقول الـ Rich Status الجديدة -->
  myQueueNumber?: number
  currentServingNumber?: number
  patientsAheadCount?: number
  estimatedWaitMinutes?: number
  estimatedWaitText?: string
}

export interface IQueueSession {
  id: string
  doctorId: string
  doctorName: string
  startedAt: string
  closedAt: string | null
  isActive: boolean
  notes: string | null
  totalTickets: number
  waitingCount: number
  completedCount: number
  createdAt: string
}

export interface IQueueBoardSession {
  sessionId: string
  doctorId?: string
  doctorName: string
  isActive: boolean
  waitingCount: number
  calledCount: number
  inVisitCount: number
  completedCount: number
  currentTicket?: IQueueTicket | null
  waitingTickets: IQueueTicket[]
}

export interface IQueueBoard {
  sessions: IQueueBoardSession[]
}

export interface ICreateTicketResponse {
  ticket: IQueueTicket
  visitId: string
}
