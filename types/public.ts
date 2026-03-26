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
  bookingEnabled: boolean
  tenantSlug: string
  isActive: boolean
}

export interface IPublicService {
  id: string
  serviceName: string
  price: number
  durationMinutes: number
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
