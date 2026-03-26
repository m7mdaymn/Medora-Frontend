export interface IClinicService {
  id: string
  name: string
  description: string | null
  defaultPrice: number
  defaultDurationMinutes: number
  isActive: boolean
  createdAt: string
}



export interface IDoctorServiceLink {
  linkId: string
  doctorId: string
  clinicServiceId: string
  serviceName: string
  effectivePrice: number
  effectiveDurationMinutes: number
  overridePrice: number | null // لو الدكتور غير السعر الافتراضي
  overrideDurationMinutes: number | null // لو الدكتور بيطول أو بيقصر في الكشف ده
  isActive: boolean
}
