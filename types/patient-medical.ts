export type DocumentCategory = 'Lab' | 'Radiology' | 'OtherMedicalDocument' | string

export type MedicalDocumentThreadStatus = 'Open' | 'Closed' | string

export interface IPatientMedicalDocument {
  id: string
  patientId: string
  category: DocumentCategory
  originalFileName: string
  contentType: string
  fileSizeBytes: number
  notes: string | null
  createdAt: string
}

export interface IPatientMedicalDocumentThreadReply {
  id: string
  threadId: string
  authorUserId: string
  message: string
  isInternalNote: boolean
  createdAt: string
}

export interface IPatientMedicalDocumentThread {
  id: string
  patientId: string
  documentId: string
  createdByUserId: string
  subject: string
  status: MedicalDocumentThreadStatus
  closedAt: string | null
  closedByUserId: string | null
  notes: string | null
  replies: IPatientMedicalDocumentThreadReply[]
  createdAt: string
}

export interface IPatientChronicProfile {
  id: string
  patientId: string
  diabetes: boolean
  hypertension: boolean
  cardiacDisease: boolean
  asthma: boolean
  other: boolean
  otherNotes: string | null
  recordedByUserId: string | null
  updatedAt: string
}
