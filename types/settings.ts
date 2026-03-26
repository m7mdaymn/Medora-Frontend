export interface IWorkingHour {
  id: string
  dayOfWeek: string // لاحظ التنبيه تحت بخصوص دي
  startTime: string
  endTime: string
  isActive: boolean
}

export interface IClinicSettings {
  id: string
  tenantId: string
  clinicName: string
  phone: string
  whatsAppSenderNumber: string
  supportWhatsAppNumber: string
  supportPhoneNumber: string
  address: string
  city: string
  logoUrl: string
  bookingEnabled: boolean
  cancellationWindowHours: number
  workingHours: IWorkingHour[]
}
