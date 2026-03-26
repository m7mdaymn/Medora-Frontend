export interface IDoctorNote {
  id: string
  doctorId: string
  doctorName: string
  message: string
  isRead: boolean
  readAt: string | null
  readByUserId: string | null
  createdAt: string
}
