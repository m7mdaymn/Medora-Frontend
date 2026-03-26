export interface IBooking {
  id: string
  patientId: string
  patientName: string
  patientPhone: string
  doctorId: string
  doctorName: string
  doctorServiceId?: string | null
  serviceName?: string | null
  bookingDate: string // ISO String
  bookingTime: string // HH:mm
  status: 'Confirmed' | 'Cancelled' | 'Rescheduled' | 'Completed'
  notes?: string | null
  queueTicketId?: string | null
  cancelledAt?: string | null
  cancellationReason?: string | null

  // الحقول الجديدة اللي ظهرت في السواجر
  isOperationalNow: boolean // هل الحجز ده شغال دلوقتي؟
  operationalPurpose: 'FutureAppointment' | 'QueueBridged' | string
  createdAt: string
}
