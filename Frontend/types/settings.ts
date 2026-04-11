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
  phone: string | null
  whatsAppSenderNumber: string | null
  supportWhatsAppNumber: string | null
  supportPhoneNumber: string | null
  address: string | null
  city: string | null
  logoUrl: string | null
  imgUrl: string | null
  description: string | null
  socialLinks: Record<string, string> | null
  bookingEnabled: boolean
  cancellationWindowHours: number
  retainCreditOnNoShow: boolean
  workingHours: IWorkingHour[]
}
