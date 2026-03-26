export type TicketStatus =
  | 'Waiting'
  | 'Called'
  | 'InVisit'
  | 'Completed'
  | 'Skipped'
  | 'NoShow'
  | 'Cancelled'

export interface IQueueTicket {
  id: string
  sessionId: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  doctorServiceId?: string | null
  serviceName?: string | null
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
