export interface IWorkingHour {
  id: string
  dayOfWeek: string // لاحظ التنبيه تحت بخصوص دي
  startTime: string
  endTime: string
  isActive: boolean
}

export interface IClinicPaymentMethod {
  id: string
  branchId: string | null
  branchName: string | null
  methodName: string
  providerName: string | null
  accountName: string | null
  accountNumber: string | null
  iban: string | null
  walletNumber: string | null
  instructions: string | null
  isActive: boolean
  displayOrder: number
}

export interface IClinicPaymentOptions {
  selfServicePaymentPolicy: string
  selfServiceRequestExpiryHours: number
  methods: IClinicPaymentMethod[]
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
  galleryImages?: Array<{ id: string; publicUrl: string; createdAt: string }>
  workingHours: IWorkingHour[]
}
