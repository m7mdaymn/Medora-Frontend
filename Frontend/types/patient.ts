export interface ISubProfile {
  id: string
  name: string
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female'
  isDefault: boolean
}

export interface IPatient {
  id: string
  userId: string
  name: string
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female'
  address: string | null
  notes: string | null
  isDefault: boolean
  parentPatientId: string | null
  username: string | null
  subProfiles: ISubProfile[]
  createdAt: string
}

export interface ICreatePatientResponse {
  patient: IPatient
  username: string
  password?: string
  initialPassword?: string
}

export interface IChronicConditions {
  diabetes: boolean
  hypertension: boolean
  cardiacDisease: boolean
  asthma: boolean
  other: boolean
  otherNotes?: string
}