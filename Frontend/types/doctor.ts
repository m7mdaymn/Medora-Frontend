export enum UrgentCaseMode {
  UrgentNext = 0,
  UrgentBucket = 1,
  UrgentFront = 2,
}

export type DoctorCompensationMode = 'Salary' | 'Percentage' | 'FixedPerVisit'

export interface IDoctorService {
  id?: string
  serviceName: string
  price: number
  durationMinutes?: number
  isActive: boolean
}

export interface IDoctorVisitConfig {
  bloodPressure: boolean
  heartRate: boolean
  temperature: boolean
  weight: boolean
  height: boolean
  bmi: boolean
  bloodSugar: boolean
  oxygenSaturation: boolean
  respiratoryRate: boolean
}

export interface IDoctor {
  id: string
  userId: string
  name: string
  username: string
  specialty: string
  phone: string
  photoUrl: string | null
  isEnabled: boolean
  bio?: string
  urgentCaseMode: UrgentCaseMode
  urgentInsertAfterCount: number
  supportsUrgent: boolean // <-- جديد
  avgVisitDurationMinutes: number
  compensationMode: DoctorCompensationMode
  compensationValue: number
  compensationEffectiveFrom: string
  services: IDoctorService[]
  visitFieldConfig: IDoctorVisitConfig
  createdAt: string
}
