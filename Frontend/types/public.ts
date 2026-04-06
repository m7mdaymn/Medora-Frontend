export const DAYS_AR: Record<string, string> = {
  Saturday: 'السبت',
  Sunday: 'الأحد',
  Monday: 'الاثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
}

// 2. قاموس لترتيب الأيام (زي ما أنت باعته في التايبس)
export const DAY_ORDER: Record<string, number> = {
  Saturday: 0, // بدأت بالسبت عشان ده العرف في مصر، ممكن تغير الترتيب براحتك
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
}

export interface IPublicClinic {
  clinicName: string
  phone: string | null
  supportWhatsAppNumber: string | null
  supportPhoneNumber: string | null
  address: string | null
  city: string | null
  logoUrl: string | null
  imgUrl?: string | null
  galleryImageUrls?: string[]
  description?: string | null
  socialLinks?: Record<string, string>
  bookingEnabled: boolean
  tenantSlug: string
  isActive: boolean
}

export interface IPublicService {
  id: string
  serviceName: string
  price: number
  durationMinutes: number | null
}

export interface IPublicDoctor {
  id: string
  name: string
  specialty: string
  bio: string | null
  photoUrl: string | null
  isEnabled: boolean
  avgVisitDurationMinutes: number
  services: IPublicService[]
}

export interface IPublicWorkingHour {
  dayOfWeek: keyof typeof DAY_ORDER
  startTime: string
  endTime: string
  isActive: boolean
}

export interface IPublicPaymentMethod {
  id: string
  branchId?: string | null
  branchName?: string | null
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

export interface IPublicPaymentOptions {
  selfServicePaymentPolicy: string
  selfServiceRequestExpiryHours: number
  methods: IPublicPaymentMethod[]
}

export interface IPublicMarketplaceItem {
  id: string
  branchId: string
  name: string
  description: string | null
  skuCode: string
  itemType: string
  unit: string
  salePrice: number
  quantityOnHand: number
  showInLanding: boolean
  images: Array<{ id: string; imageUrl: string; displayOrder: number }>
}

export interface IPublicLanding {
  clinic: IPublicClinic
  featuredServices: IPublicService[]
  featuredProducts: IPublicMarketplaceItem[]
  doctorsAvailableNow: IPublicDoctor[]
  branches: Array<{
    id: string
    name: string
    address: string | null
    phone: string | null
  }>
  paymentMethods: IPublicPaymentMethod[]
}
